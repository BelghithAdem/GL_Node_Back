const express = require("express");
const {
  register,
  login,
  me,
  getUsers,
  deleteUser,
  forgotPassword,
  renderResetPasswordForm,
  resetPassword
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Render login page
router.get("/login", (req, res) => res.render("auth/login"));

// Render register page
router.get("/register", (req, res) => res.render("auth/register"));

// Render forgot password page
router.get("/forgot-password", (req, res) => res.render("auth/forgot-password"));

// Render user management page (protected)
router.get("/manage", authMiddleware, me);

// Password rest routes
router.post('/forgot-password', forgotPassword); 
router.get('/reset-password/:token', renderResetPasswordForm);
router.post('/reset-password/:token', resetPassword);

// API routes
router.post("/register", register);
router.post("/login", login);
router.delete("/:id", authMiddleware, deleteUser);


module.exports = router;
