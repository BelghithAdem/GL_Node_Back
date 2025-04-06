const express = require("express");
const {
  register,
  login,
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
router.get("/manage", authMiddleware, async (req, res) => {
  const users = await getUsers(req, res, true); // Fetch users for rendering
  res.render("auth/manage", { users });
});

// API routes
router.post("/register", register);
router.post("/login", login);
router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
