const express = require("express");
const {
  register,
  login,
  me,
  getUsers,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Render login page
router.get("/login", (req, res) => res.render("auth/login"));

// Render register page
router.get("/register", (req, res) => res.render("auth/register"));

// Render user management page (protected)
router.get("/manage", authMiddleware, me);


// API routes
router.post("/register", register);
router.post("/login", login);
router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
