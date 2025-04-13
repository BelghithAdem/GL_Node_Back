const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Task = require('../models/Task');
const authMiddleware = require("../middleware/authMiddleware");

// Protect all routes
router.use(auth);

// RESTful task endpoints
router.post('/',authMiddleware, taskController.createTask);
router.get('/',authMiddleware, taskController.getTasks);
router.get('/by-status',authMiddleware, taskController.getTasksByStatus);
router.get('/stats',authMiddleware, taskController.getTaskStats);
router.put('/:id',authMiddleware, taskController.updateTask);
router.delete('/:id',authMiddleware, taskController.deleteTask);
router.patch('/:id/status',authMiddleware, taskController.updateTaskStatus);
router.get('/byId/:id', taskController.getTaskById);

// ➕ Status history of a task
router.get('/:id/status-history',authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('statusHistory.changedBy', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task.statusHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Render the dashboard with user and their tasks
router.get('/dashboard',authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const tasks = await Task.find({ user: req.userId });

    res.render('index', { user, tasks }); // <-- here
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});
router.get('/manage',authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const tasks = await Task.find({ user: req.userId });

    res.render('tasks', { user, tasks }); // <-- here
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
