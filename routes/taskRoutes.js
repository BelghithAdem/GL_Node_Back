const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.get('/by-status', taskController.getTasksByStatus);

router.get('/:id/status-history', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('statusHistory.changedBy', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task.statusHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
