const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("../services/emailService");

exports.register = async (req, res) => {
  try {
    console.log("🚀 Registration request received:", {
      body: { ...req.body, password: "***" },
      headers: req.headers,
      method: req.method,
      url: req.url,
    });

    const { username, email, password, role } = req.body;

    // Input validation
    if (!username || !email || !password) {
      console.log("❌ Missing required fields:", {
        username: !!username,
        email: !!email,
        password: !!password,
      });
      return res.status(400).json({
        message: "All fields are required",
        missing: {
          username: !username,
          email: !email,
          password: !password,
        },
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password length validation
    if (password.length < 6) {
      console.log("❌ Password too short:", password.length);
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Username validation
    if (username.length < 3) {
      console.log("❌ Username too short:", username.length);
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters long" });
    }

    console.log("🔍 Checking for existing user with email:", email);
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      console.log("❌ User already exists with email:", email);
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    console.log("🔍 Checking for existing user with username:", username);
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      console.log("❌ User already exists with username:", username);
      return res.status(400).json({ message: "Username already taken" });
    }

    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed successfully");

    // Set default role if not provided
    const userRole = role || "user";
    console.log("👤 Creating user with role:", userRole);

    const user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
    });

    console.log("💾 Saving user to database...");
    await user.save();
    console.log("✅ User saved successfully:", {
      id: user._id,
      username: user.username,
      email: user.email,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("💥 Registration error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
    });

    // Handle specific MongoDB errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      console.log("❌ Duplicate key error for field:", field);
      return res.status(400).json({
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists`,
      });
    }

    if (err.name === "ValidationError") {
      console.log("❌ Validation error:", err.message);
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    if (err.name === "CastError") {
      console.log("❌ Cast error:", err.message);
      return res.status(400).json({ message: "Invalid data format" });
    }

    // Generic server error
    console.error("🔥 Unhandled registration error:", err);
    res.status(500).json({
      message: "Internal server error during registration",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("🚀 Login request received:", {
      body: { ...req.body, password: "***" },
      headers: req.headers,
      method: req.method,
      url: req.url,
    });

    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      console.log("❌ Missing required fields:", {
        email: !!email,
        password: !!password,
      });
      return res.status(400).json({
        message: "Email and password are required",
        missing: {
          email: !email,
          password: !password,
        },
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return res.status(400).json({ message: "Invalid email format" });
    }

    console.log("🔍 Looking up user with email:", email);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("🔐 Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("❌ Password mismatch for user:", user.username);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("✅ Password verified for user:", user.username);

    if (!process.env.JWT_SECRET) {
      console.error("💥 JWT_SECRET not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }

    console.log("🎫 Generating JWT token...");
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ Login successful for user:", user.username);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("💥 Login error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
    });

    if (err.name === "JsonWebTokenError") {
      return res.status(500).json({ message: "Token generation failed" });
    }

    res.status(500).json({
      message: "Internal server error during login",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
};

exports.logout = (req, res) => {
  // For JWT, logout is handled client-side by deleting the token
  res.status(200).json({ message: "User logged out successfully" });
};

// Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Hash the token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    const emailSent = await sendPasswordResetEmail(email, resetToken, resetUrl);

    if (emailSent) {
      res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } else {
      // Clear the token if email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res
        .status(500)
        .json({ message: "Failed to send reset email. Please try again." });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    res.status(200).json({ message: "Token is valid" });
  } catch (err) {
    console.error("Verify reset token error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendPasswordResetConfirmation(user.email);

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
