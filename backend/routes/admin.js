const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");
const Stock = require("../models/Stock");
const Portfolio = require("../models/Portfolio");

// Get all users
router.get("/users", auth, adminAuth, async (req, res) => {
  try {
  // Return users along with their portfolios and a brief transactions summary
  // By default return active users only; use ?showDisabled=true to include disabled users
  const showDisabled = req.query.showDisabled === "true";
  const users = await User.find(showDisabled ? {} : { isActive: true }).select("-password").lean();

    // Populate portfolios for each user
    const usersWithPortfolios = await Promise.all(users.map(async (u) => {
      const portfolios = await Portfolio.find({ user: u._id }).lean();

      // Summarize transactions count per portfolio
      const portfoliosWithSummary = portfolios.map(p => ({
        _id: p._id,
        symbol: p.symbol,
        quantity: p.quantity,
        averageBuyPrice: p.averageBuyPrice,
        investmentDate: p.investmentDate,
        lastUpdated: p.lastUpdated,
        transactionsCount: (p.transactions || []).length,
        transactions: p.transactions || []
      }));

      return { ...u, portfolios: portfoliosWithSummary };
    }));

    res.json(usersWithPortfolios);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get system statistics
router.get("/stats", auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPortfolios = await Portfolio.countDocuments();
    const totalStocks = await Stock.countDocuments();
    
    const stats = {
      totalUsers,
      totalPortfolios,
      totalStocks,
      lastUpdated: new Date()
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update user status (can be used to promote to admin or deactivate account)
router.put("/users/:userId", auth, adminAuth, async (req, res) => {
  try {
  const { isAdmin, name, phone, isActive } = req.body;
    const update = {};
    if (typeof isAdmin !== "undefined") update.isAdmin = isAdmin;
    if (typeof name !== "undefined") update.name = name;
    if (typeof phone !== "undefined") update.phone = phone;
  if (typeof isActive !== "undefined") update.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      update,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get single user with portfolios
router.get("/users/:userId", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const portfolios = await Portfolio.find({ user: user._id }).lean();
    user.portfolios = portfolios;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



// Delete a portfolio for a user
router.delete("/users/:userId/portfolios/:portfolioId", auth, adminAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ _id: req.params.portfolioId, user: req.params.userId });
    if (!portfolio) return res.status(404).json({ message: "Portfolio not found" });

    await portfolio.remove();
    res.json({ message: "Portfolio deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user and all associated portfolios
router.delete("/users/:userId", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
  // Soft-delete user: mark isActive = false
  user.isActive = false;
  await user.save();
    
  // Optionally keep portfolios or mark them deleted; here we leave them but you could remove if desired
  res.json({ message: "User disabled (soft-deleted) successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;