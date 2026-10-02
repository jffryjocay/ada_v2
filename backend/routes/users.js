import express from "express";
import bcrypt from "bcryptjs";
import { query, run } from "../db.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All user management routes require authentication and Admin role
router.use(verifyToken, requireAdmin);

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await query("SELECT user_id, employee, position, username, role FROM users ORDER BY user_id ASC");
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add new user with password hashing
router.post("/", async (req, res) => {
  try {
    const { employee, position, username, password, role } = req.body;
    if (!employee || !position || !username || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await run(
      "INSERT INTO users (employee, position, username, password, role) VALUES (?, ?, ?, ?, ?)",
      [employee, position, username, hashedPassword, role]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    await run("DELETE FROM users WHERE user_id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

