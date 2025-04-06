require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http"); // Import HTTP module
const { Server } = require("socket.io"); // Import Socket.io
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Configure CORS as needed
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Attach `io` to `req` for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

// Example route for rendering an EJS template
app.get("/", (req, res) => {
  res.render("index", { message: "Hello from EJS!" });
});

// Socket.io connection event
io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
