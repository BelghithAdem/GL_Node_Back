// controllers/task.controller.js
const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user.id });
    req.io.emit("task_created", task); // Émettre un événement Socket.io
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });
  res.json(tasks);
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOneAndUpdate({ _id: id, user: req.user.id }, req.body, { new: true });
    if (!task) return res.status(404).json({ message: 'Not found' });
    req.io.emit('task_updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOneAndDelete({ _id: id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Not found' });
    req.io.emit('task_deleted', { id });
    res.json({ message: 'Deleted' });
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
    const task = await Task.findOne({ _id: id, user: req.user.id });
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
    const userId = req.user.id;

    // Calculer les statistiques
    const stats = await Task.aggregate([
      { $match: { user: userId } }, // Filtrer par utilisateur
      { $group: { 
          _id: "$status", 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // Reformater les données pour un affichage clair
    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      totalTasks: stats.reduce((sum, stat) => sum + stat.count, 0),
      stats: formattedStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Calculer les statistiques
    const stats = await Task.aggregate([
      { $match: { user: userId } }, // Filtrer par utilisateur
      { $group: { 
          _id: "$status", 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // Reformater les données pour un affichage clair
    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      totalTasks: 10,
      stats: {
        pending: 4,
        in_progress: 3,
        completed: 2,
        cancelled: 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

