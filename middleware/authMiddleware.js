const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; // 🔹 Lire depuis le cookie "token"

  if (!token) {
    return res.status(401).redirect("/api/users/login"); // 🔸 Rediriger vers la page login si non connecté
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // 🔹 Tu peux l'utiliser dans les routes
    next();
  } catch (error) {
    res.clearCookie("token"); // 🔸 Nettoyer le cookie invalide
    return res.status(401).redirect("/api/users/login");
  }
};

module.exports = authMiddleware;
