const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Admin user details
        const adminUser = {
            name: "Admin User",
            email: "admin@stockmarket.com",
            password: "Admin@123",
            isAdmin: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminUser.email });
        if (existingAdmin) {
            console.log("Admin user already exists");
            process.exit(0);
        }

        // Create new admin user
        const newAdmin = new User(adminUser);
        await newAdmin.save();

        console.log("Admin user created successfully");
        console.log("Email:", adminUser.email);
        console.log("Password:", adminUser.password);

    } catch (error) {
        console.error("Error creating admin user:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdminUser();