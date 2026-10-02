import express from "express";
import { query, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);

// GET items for an ADA No.
router.get("/:ada_no", async (req, res) => {
  try {
    const items = await query("SELECT * FROM office WHERE ada_no = ? ORDER BY office_id DESC", [req.params.ada_no]);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add office item for ADA
router.post("/:ada_no", async (req, res) => {
  try {
    const { ada_no } = req.params;
    const { office, reference, nop, cafoa, amount } = req.body;

    if (!office || !reference || !nop || amount === undefined) {
      return res.status(400).json({ success: false, message: "Incomplete item data" });
    }

    const result = await run(
      "INSERT INTO office (ada_no, office, reference, nop, cafoa, amount) VALUES (?, ?, ?, ?, ?, ?)",
      [ada_no, office, reference, nop, cafoa || "", parseFloat(amount)]
    );

    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE office item
router.delete("/item/:office_id", async (req, res) => {
  try {
    await run("DELETE FROM office WHERE office_id = ?", [req.params.office_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

