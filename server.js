require("dotenv").config();
const express = require("express");
const cors = require("cors");
const methodOverride = require("method-override");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

const PORT = process.env.PORT || 5000;

// 🟢 Connect DB
connectDB();

// 🔧 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());  // Assurez-vous que cette ligne est bien présente
app.use(methodOverride("_method"));

// 📡 Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 🖼️ View engine
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// 🛣️ Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

// 🌐 Default route redirect
app.get("/", (req, res) => {
  res.redirect("/api/users/login");
});

// 🔌 Socket.io connection
io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

// Route pour la déconnexion
app.get('/api/users/logout', (req, res) => {
  // Supprimer le cookie contenant le token JWT
  res.clearCookie('token');  // Nom du cookie où le token JWT est stocké

  // Rediriger vers la page d'accueil ou la page de connexion après la déconnexion
  res.redirect('/api/users/login');  // Ou '/home', '/dashboard', etc. selon ta configuration
});


// 🚀 Start server
server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
