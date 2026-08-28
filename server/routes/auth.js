import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function sanitizeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

// Login only ever uses email + password, per the brief. There is no public
// registration endpoint — admin accounts are created directly in the
// database with scripts/createAdmin.js (see that file's header comment
// for usage).
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (_error) {
    res.status(500).json({ message: "Could not log in" });
  }
});

// Lets the frontend verify a stored token is still valid on page load.
router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
