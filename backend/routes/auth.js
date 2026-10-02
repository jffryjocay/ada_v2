import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { get, run } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "ada_system_secret_key_2026";

// Rate limiting for login attempts (15 requests per 15 minutes per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const user = await get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid Account or Password!" });
    }

    let isMatch = false;
    if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Plaintext fallback (for existing seeded users), and auto-upgrade to hash
      if (password === user.password) {
        isMatch = true;
        const newHash = await bcrypt.hash(password, 10);
        await run("UPDATE users SET password = ? WHERE user_id = ?", [newHash, user.user_id]);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid Account or Password!" });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        employee: user.employee,
        position: user.position
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        employee: user.employee,
        position: user.position
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

export default router;

