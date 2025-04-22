const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');


//foget password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.render('auth/forgot-password', {
        message: 'Email is required'
      });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).render('auth/forgot-password', {
        message: 'No account with that email exists'
      });
    }

    // Create reset token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email
    const resetUrl = `http://${req.headers.host}/api/users/reset-password/${token}`;
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset',
      html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="${resetUrl}">link</a> to reset your password</p>
        <p>This link will expire in 1 hour</p>
      `
    });

    res.render('auth/forgot-password', {
      message: 'Password reset link has been sent to your email'
    });
  } catch (err) {
    res.status(500).render('auth/forgot-password', {
      message: 'Error processing your request'
    });
  }
};


// Render Reset Password Form
exports.renderResetPasswordForm = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('auth/reset-password', {
        error: 'Password reset token is invalid or has expired'
      });
    }

    res.render('auth/reset-password', {
      token: req.params.token,
      email: user.email
    });
  } catch (err) {
    res.render('auth/reset-password', {
      error: 'Error processing your request'
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('auth/reset-password', {
        error: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email,
      subject: 'Password Changed',
      html: '<p>Your password has been successfully changed</p>'
    });

    res.redirect('/api/users/login');
  } catch (err) {
    res.render('auth/reset-password', {
      error: 'Error processing your request'
    });
  }
};

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
  
    res.redirect("/api/users/login");
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
       const token = req.cookies.token; // 1. Lire le token depuis le cookie
      
        if (!token) {
          return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
        }
      
        // 2. Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.render("auth/manage", { user });
      } catch (error) {
        res.status(500).json({ message: error.message });
        }
    }