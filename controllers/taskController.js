// controllers/task.controller.js
const Task = require('../models/Task');
const jwt = require("jsonwebtoken");
const { emitTaskEvent } = require("../server");

exports.createTask = async (req, res) => {
  try {
    const token = req.cookies.token; // 1. Lire le token depuis le cookie

    if (!token) {
      return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }
  
    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const task = await Task.create({ ...req.body, user: userId });
    req.io.emit("task_created", task); // Émettre un événement Socket.io
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  const token = req.cookies.token; // 1. Lire le token depuis le cookie

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
  }

  // 2. Vérifier et décoder le token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  const tasks = await Task.find({ user: userId });
  res.json(tasks);
};
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'authentification via le token
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Récupérer la tâche en vérifiant aussi l'utilisateur
    const task = await Task.findOne({ _id: id, user: userId });

    if (!task) {
      return res.status(404).json({ error: "Tâche non trouvée." });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateTask = async (req, res) => {
  const { id } = req.params;
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const task = await Task.findOneAndUpdate({ _id: id, user: userId }, req.body, { new: true });
    if (!task) return res.status(404).json({ message: 'Not found' });
    req.io.emit('task_updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { id } = req.params; // 👈 Récupération de l'id depuis l'URL

    const task = await Task.findOneAndDelete({ _id: id, user: userId });

    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée." });
    }

    req.io.emit('task_deleted', { id }); // 👈 Événement Socket.io
    res.json({ message: "Tâche supprimée avec succès." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateTaskStatus = async (req, res) => {

  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const validTransitions = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const task = await Task.findOne({ _id: id, user: userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (!validTransitions[task.status].includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${task.status} to ${status}` });
    }

    // Update status and log the change
    task.status = status;
    task.statusHistory.push({ status, changedBy: req.user.id });
    await task.save();

    req.io.emit('task_status_updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasksByStatus = async (req, res) => {
  const { status } = req.query;

  try {
    const tasks = await Task.find({
      user: req.user.id,
      ...(status && { status })
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const token = req.cookies.token; // 1. Lire le token depuis le cookie

    if (!token) {
      return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 3. Récupérer toutes les tâches de l'utilisateur
    const tasks = await Task.find({ user: userId });

    // 4. Calculer les statistiques manuellement
    const stats = {};
    for (const task of tasks) {
      const status = task.status || "unknown";
      stats[status] = (stats[status] || 0) + 1;
    }

    const totalTasks = tasks.length;

    // 5. Retourner la réponse complète
    res.json({
      totalTasks,
      stats,
      tasks, // Inclure toutes les tâches dans la réponse
    });
  } catch (err) {
    console.error("Erreur dans getTaskStats :", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
};
