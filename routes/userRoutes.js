const express = require("express");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  register,
  login,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Inscription de l'utilisateur
router.post("/register", register);

// 📌 Connexion de l'utilisateur
router.post("/login", login);

// 📌 Créer un utilisateur
router.post("/", createUser, authMiddleware);

// 📌 Récupérer tous les utilisateurs
router.get("/", getUsers, authMiddleware);

// 📌 Récupérer un utilisateur par ID
router.get("/:id", getUserById, authMiddleware);

// 📌 Mettre à jour un utilisateur
router.put("/:id", updateUser, authMiddleware);

// 📌 Supprimer un utilisateur
router.delete("/:id", deleteUser, authMiddleware);

module.exports = router;
