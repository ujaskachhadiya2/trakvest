const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    // User is already authenticated from the auth middleware
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = adminAuth;