const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const routes = require("./routes");
const { startUpdateJob } = require("./services/updateStockPrices");
const { initializeWebSocket } = require("./services/websocketService");
require("dotenv").config({ path: __dirname + "/.env" });

// Debug environment variables
console.log("Environment variables loaded:");
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("PORT:", process.env.PORT);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
console.log("ALPHA_VANTAGE_API_KEY:", process.env.ALPHA_VANTAGE_API_KEY ? "Set" : "Not set (required for international stocks)");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    // Start the background job to update stock prices
    startUpdateJob();
  })
  .catch(err => console.log("MongoDB Connection Error:", err));

// Initialize WebSocket
initializeWebSocket(server);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});