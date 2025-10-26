const express = require("express");
const router = express.Router();
const Goal = require("../models/Goal");
const auth = require("../middleware/auth");

// Get all goals for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching goals" });
  }
});

// Create a new goal for the authenticated user
router.post("/", auth, async (req, res) => {
  try {
    const { title, targetAmount, targetDate, description, type, progress } = req.body;
    if (!title || !targetAmount || !targetDate) {
      return res.status(400).json({ message: "title, targetAmount and targetDate are required" });
    }

    const goal = new Goal({
      user: req.user._id,
      title,
      targetAmount,
      targetDate,
      description,
      type,
      progress: progress || 0
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ message: "Error creating goal" });
  }
});

// Delete a goal
router.delete("/:id", auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    await goal.remove();
    res.json({ message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting goal" });
  }
});

module.exports = router;
