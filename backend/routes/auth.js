const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendConfirmationEmail } = require("../services/mailService");
const authMiddleware = require("../middleware/auth");

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();
    // Send registration confirmation email
    try {
      await sendConfirmationEmail(user.email, "registration");
    } catch (e) {
      console.error("Email send error:", e.message);
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    // If error has a message, send it as the main message
    let message = error.message || "Error creating user";
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      message = Object.values(error.errors).map(e => e.message).join(", ");
    }
    res.status(500).json({ message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Send login confirmation email
    try {
      await sendConfirmationEmail(user.email, "login");
    } catch (e) {
      console.error("Email send error:", e.message);
    }
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update user profile
router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (profileImage) {
      try {
        // Check if the image is a valid base64 string
        if (!profileImage.includes("base64,")) {
          return res.status(400).json({ message: "Invalid image format" });
        }

        // Validate image size (limit to 1MB)
        const base64Size = Buffer.from(profileImage.split(",")[1], "base64").length;
        if (base64Size > 1024 * 1024) {
          return res.status(400).json({ message: "Image size must be less than 1MB" });
        }
        user.profileImage = profileImage;
      } catch (err) {
        console.error("Error processing image:", err);
        return res.status(400).json({ message: "Error processing image" });
      }
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(400).json({ message: error.message || "Error updating profile" });
  }
});

// Top-up balance
router.post("/topup", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: "Minimum top-up amount is ₹100" });
    }

    const user = await User.findById(req.user._id);
    user.balance += amount;
    await user.save();

    res.json({ balance: user.balance, message: "Balance updated successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error processing top-up" });
  }
});

// Withdraw balance
router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: "Minimum withdrawal amount is ₹100" });
    }

    const user = await User.findById(req.user._id);
    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance for withdrawal" });
    }

    user.balance -= amount;
    await user.save();

    res.json({ balance: user.balance, message: "Withdrawal processed successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error processing withdrawal" });
  }
});

module.exports = router;