const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true },
  targetDate: { type: Date, required: true },
  description: { type: String },
  type: { type: String, enum: ["investment","savings","profit","portfolio_value"], default: "investment" },
  progress: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Goal", goalSchema);
