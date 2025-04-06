require("dotenv").config();
const express = require("express");
const cors = require("cors");
const methodOverride = require("method-override"); // For DELETE forms
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form submissions
app.use(cors());
app.use(methodOverride("_method")); // Support DELETE/PUT in forms

// Attach `io` to `req` for controllers
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

// Render home page
app.get("/", (req, res) => {
  res.render("index", { message: "Welcome to the Dashboard!" });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
