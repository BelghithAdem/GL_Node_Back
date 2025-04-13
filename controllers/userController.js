const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 📌 Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📌 Récupérer tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Inscription de l'utilisateur
exports.register = async (req, res) => {
  try {
    const { name, email, password, age } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Remove manual hashing here
    const user = new User({ name, email, password, age });
    await user.save();

    res.status(201).json({ message: "Utilisateur créé avec succès", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
  
// 📌 Connexion de l'utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).render("auth/login", { message: "Email ou mot de passe incorrect" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).render("auth/login", { message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // 👉 Stocker le token dans un cookie sécurisé
    res.cookie("token", token, {
      httpOnly: true,  // Empêche l'accès au cookie par JavaScript côté client
      secure: process.env.NODE_ENV === "production",  // Assure la sécurité en production (HTTPS)
      maxAge: 7 * 24 * 60 * 60 * 1000,  // Expiration du cookie : 7 jours
    });
    

    // 👉 Rediriger vers /dashboard
    return res.redirect("/api/tasks/dashboard");
  } catch (error) {
    return res.status(500).render("auth/login", { message: error.message });
  }
};


  exports.me = async (req, res) => {
    try {
      const user = await User.findById(req.userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json(user);
      } catch (error) {
        res.status(500).json({ message: error.message });
        }
    }