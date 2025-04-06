// controllers/task.controller.js
const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user.id });
    req.io.emit('task_created', task); // Notification WebSocket
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
  
    const validStatuses = ['en_attente', 'en_cours', 'termine', 'annule'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
  
    try {
      const task = await Task.findOneAndUpdate(
        { _id: id, user: req.user.id },
        { status },
        { new: true }
      );
  
      if (!task) return res.status(404).json({ message: 'Tâche introuvable' });
  
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
  
