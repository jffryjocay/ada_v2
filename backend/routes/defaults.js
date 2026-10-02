import express from "express";
import { get, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", async (req, res) => {
  try {
    const row = await get("SELECT * FROM default_value LIMIT 1");
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const {
      addressee,
      bank,
      account_no,
      left_name,
      left_title,
      right_name,
      right_title,
      radai_name,
      radai_position,
      year_beg
    } = req.body;

    const currentYear = year_beg || new Date().getFullYear().toString();

    await run("DELETE FROM default_value");
    await run(
      `INSERT INTO default_value (default_id, addressee, bank, account_no, left_name, left_title, right_name, right_title, radai_name, radai_position, year_beg)
       VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        addressee || "",
        bank || "",
        account_no || "",
        left_name || "",
        left_title || "",
        right_name || "",
        right_title || "",
        radai_name || "",
        radai_position || "",
        currentYear
      ]
    );

    res.json({ success: true, message: "Default values updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

