import express from "express";
import { query, get, run } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);

const padZero = (num, length = 4) => String(num).padStart(length, "0");

// GET next report_no
router.get("/next-no", async (req, res) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

    const existing = await query("SELECT count FROM radai_list WHERE year_beg = ?", [currentYear]);
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

    const report_no = `${currentYear}-${currentMonth}-${nextCount}`;
    res.json({ success: true, report_no, count: nextCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all RADAI list records
router.get("/", async (req, res) => {
  try {
    const records = await query("SELECT * FROM radai_list ORDER BY radai_id DESC");
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST save RADAI report transaction
router.post("/", async (req, res) => {
  try {
    const {
      report_no,
      date_range,
      todays_date,
      fix_date,
      beg_date,
      end_date,
      fund,
      acctno
    } = req.body;

    const cleanDate = (d) => (d && d.includes("T") ? d.split("T")[0] : d || "");

    const tDate = cleanDate(todays_date);
    const fDate = cleanDate(fix_date);
    const bDate = cleanDate(beg_date);
    const eDate = cleanDate(end_date);

    let one_date = null;
    let two_date = null;
    let year_get = new Date().getFullYear().toString();

    if (date_range === "daily") {
      one_date = tDate;
      if (tDate) year_get = tDate.substring(0, 4);
    } else if (date_range === "as_of") {
      one_date = fDate;
      two_date = tDate;
      if (tDate) year_get = tDate.substring(0, 4);
    } else if (date_range === "periodic") {
      one_date = bDate;
      two_date = eDate;
      if (eDate) year_get = eDate.substring(0, 4);
    }

    // Check if record exists matching criteria
    let checkSql = "";
    let checkParams = [];

    if (date_range === "daily") {
      checkSql = "SELECT * FROM radai_list WHERE one_date = ? AND fund = ? AND account_no = ?";
      checkParams = [one_date, fund, acctno];
    } else {
      checkSql = "SELECT * FROM radai_list WHERE one_date = ? AND two_date = ? AND fund = ? AND account_no = ?";
      checkParams = [one_date, two_date, fund, acctno];
    }

    const checkRow = await get(checkSql, checkParams);

    if (checkRow) {
      return res.json({
        success: true,
        alreadyExisted: true,
        report_no: checkRow.report_no,
        message: "Existing RADAI report found"
      });
    }

    const num_arr = report_no.split("-");
    const count = num_arr.length >= 3 ? num_arr[2] : "0001";

    await run(
      `INSERT INTO radai_list (report_no, count, date_range, one_date, two_date, fund, account_no, year_beg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [report_no, count, date_range, one_date, two_date || null, fund, acctno, year_get]
    );

    res.json({
      success: true,
      alreadyExisted: false,
      report_no,
      message: "RADAI report generated successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE RADAI record
router.delete("/:radai_id", async (req, res) => {
  try {
    await run("DELETE FROM radai_list WHERE radai_id = ?", [req.params.radai_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

