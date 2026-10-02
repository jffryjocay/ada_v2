import express from "express";
import { query, get, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";
import { clearPdfCache } from "../utils/pdfGenerator.js";

const router = express.Router();
router.use(verifyToken);

// Helper to pad number with leading zeroes
const padZero = (num, length = 4) => String(num).padStart(length, "0");

// GET next auto-generated ADA No.
router.get("/next-no", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

    const defaultVal = await get("SELECT account_no FROM default_value LIMIT 1");
    const accountNo = defaultVal ? defaultVal.account_no : "2012-1001-78";
    const accParts = accountNo.split("-");
    const suffix = accParts.length >= 3 ? accParts[2] : "78";

    // Find counts for current year
    const existing = await query("SELECT count FROM ada_list WHERE year_beg = ?", [currentYear]);
    let nextCount = "0001";

    if (existing && existing.length > 0) {
      const counts = existing.map((r) => parseInt(r.count, 10)).filter((n) => !isNaN(n));
      if (counts.length > 0) {
        const maxVal = Math.max(...counts);
        const countSet = new Set(counts);
        let foundGap = false;
        for (let i = 1; i <= maxVal; i++) {
          if (!countSet.has(i)) {
            nextCount = padZero(i);
            foundGap = true;
            break;
          }
        }
        if (!foundGap) {
          nextCount = padZero(maxVal + 1);
        }
      }
    }

    const ada_no = `${suffix}-${currentYear}${currentMonth}-${nextCount}`;
    res.json({ success: true, ada_no, count: nextCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all ADA list records
router.get("/", async (req, res) => {
  try {
    const list = await query(`
      SELECT 
        a.ada_id,
        a.ada_no,
        a.count,
        a.ada_date,
        a.addressee,
        a.bank,
        a.account_no,
        a.year_beg,
        COALESCE(SUM(o.amount), 0) AS total_amount,
        COUNT(o.office_id) AS office_count
      FROM ada_list a
      LEFT JOIN office o ON a.ada_no = o.ada_no
      GROUP BY a.ada_id, a.ada_no, a.count, a.ada_date, a.addressee, a.bank, a.account_no, a.year_beg
      ORDER BY a.ada_id DESC
    `);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST save new ADA
router.post("/", async (req, res) => {
  try {
    const { ada_no, ada_date, count } = req.body;
    if (!ada_no || !ada_date) {
      return res.status(400).json({ success: false, message: "ADA No. and Date are required" });
    }

    const currentYear = new Date().getFullYear().toString();
    const defaultVal = await get("SELECT addressee, bank, account_no FROM default_value LIMIT 1");
    
    const addressee = defaultVal ? defaultVal.addressee : "";
    const bank = defaultVal ? defaultVal.bank : "";
    const account_no = defaultVal ? defaultVal.account_no : "";

    const autoCount = count || ada_no.split("-")[2] || "0001";

    await run(
      `INSERT INTO ada_list (ada_no, count, ada_date, addressee, bank, account_no, year_beg)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ada_no, autoCount, ada_date, addressee, bank, account_no, currentYear]
    );

    clearPdfCache();
    res.json({ success: true, message: "ADA saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update ADA date
router.put("/:ada_no", async (req, res) => {
  try {
    const { ada_date } = req.body;
    await run("UPDATE ada_list SET ada_date = ? WHERE ada_no = ?", [ada_date, req.params.ada_no]);
    clearPdfCache();
    res.json({ success: true, message: "ADA date updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE ADA record and offices
router.delete("/:ada_no", async (req, res) => {
  try {
    await run("DELETE FROM ada_list WHERE ada_no = ?", [req.params.ada_no]);
    await run("DELETE FROM office WHERE ada_no = ?", [req.params.ada_no]);
    clearPdfCache();
    res.json({ success: true, message: "ADA record deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

