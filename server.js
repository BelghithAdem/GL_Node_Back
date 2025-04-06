require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Set the directory where your views are located (optional, defaults to "views")
app.set("views", __dirname + "/views");

// Routes
app.use("/api/users", require("./routes/userRoutes"));

// Example route for rendering an EJS template
app.get("/", (req, res) => {
  res.render("index", { message: "Hello from EJS!" });
});

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
