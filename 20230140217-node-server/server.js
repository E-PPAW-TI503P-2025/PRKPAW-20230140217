// server.js (Pastikan ini di baris paling atas)
require('dotenv').config(); 
// ------------------------------------------------------------------

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3001;

// Import router
const presensiRoutes = require("./routes/presensi");
const reportRoutes = require("./routes/reports");
const authRoutes = require("./routes/auth");
const ruteBuku = require("./routes/books");

// Middleware
app.use(cors()); // <-- CUKUP GUNAKAN INI UNTUK MENANGANI CORS DAN OPTIONS
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Home Page for API");
});

// Router
app.use("/api/auth", authRoutes);
app.use("/api/presensi", presensiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/books", ruteBuku);

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});