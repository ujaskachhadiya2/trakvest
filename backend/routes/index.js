const express = require("express");
const router = express.Router();
const stockRoutes = require("./stocks");
const portfolioRoutes = require("./portfolio");
const authRoutes = require("./auth");
const adminRoutes = require("./admin");
const goalsRoutes = require("./goals");
const authMiddleware = require("../middleware/auth");

// Public routes
router.use("/auth", authRoutes);

// Protected routes
router.use("/stocks", authMiddleware, stockRoutes);
router.use("/portfolio", authMiddleware, portfolioRoutes);
router.use("/goals", goalsRoutes);
router.use("/admin", adminRoutes);

module.exports = router;