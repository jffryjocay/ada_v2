import express from "express";
import { get, query } from "../db.js";
import { convertNumberToWords } from "../utils/numberToWords.js";
import { generateAdaPdf, generateRadaiPdf } from "../utils/pdfGenerator.js";

const router = express.Router();

// GET PDF Stream for Appendix 36 (ADA Slip)
router.get("/pdf/ada/:ada_no", generateAdaPdf);

// GET PDF Stream for Appendix 37 (RADAI Report)
router.get("/pdf/radai/:report_no", generateRadaiPdf);

// GET Appendix 36 data (ADA print slip)
router.get("/ada/:ada_no", async (req, res) => {
  try {
    const { ada_no } = req.params;
    const ada = await get("SELECT * FROM ada_list WHERE ada_no = ?", [ada_no]);

    if (!ada) {
      return res.status(404).json({ success: false, message: "ADA record not found" });
    }

    const defaultVal = await get("SELECT * FROM default_value LIMIT 1");
    const items = await query("SELECT * FROM office WHERE ada_no = ? ORDER BY office_id ASC", [ada_no]);

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const amountInWords = convertNumberToWords(totalAmount);

    res.json({
      success: true,
      ada,
      defaults: defaultVal,
      items,
      totalAmount,
      amountInWords
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET Appendix 37 data (RADAI report)
router.get("/radai/:report_no", async (req, res) => {
  try {
    const { report_no } = req.params;
    const radai = await get("SELECT * FROM radai_list WHERE report_no = ?", [report_no]);

    if (!radai) {
      return res.status(404).json({ success: false, message: "RADAI record not found" });
    }

    const defaultVal = await get("SELECT * FROM default_value LIMIT 1");

    let adaSql = "";
    let params = [];

    if (radai.date_range === "daily") {
      adaSql = "SELECT * FROM ada_list WHERE ada_date = ? AND account_no = ?";
      params = [radai.one_date, radai.account_no];
    } else {
      adaSql = "SELECT * FROM ada_list WHERE ada_date >= ? AND ada_date <= ? AND account_no = ?";
      params = [radai.one_date, radai.two_date, radai.account_no];
    }

    const adaList = await query(adaSql, params);

    let reportRows = [];
    let grandTotal = 0;
    let adaNumbers = [];

    for (const adaItem of adaList) {
      adaNumbers.push(adaItem.ada_no);
      const offices = await query("SELECT * FROM office WHERE ada_no = ?", [adaItem.ada_no]);
      for (const off of offices) {
        grandTotal += parseFloat(off.amount || 0);
        reportRows.push({
          ada_date: adaItem.ada_date,
          ada_no: adaItem.ada_no,
          reference: off.reference,
          cafoa: off.cafoa,
          office: off.office,
          nop: off.nop,
          amount: parseFloat(off.amount || 0)
        });
      }
    }

    const minAdaNo = adaNumbers.length > 0 ? adaNumbers.reduce((a, b) => a < b ? a : b) : "";
    const maxAdaNo = adaNumbers.length > 0 ? adaNumbers.reduce((a, b) => a > b ? a : b) : "";

    res.json({
      success: true,
      radai,
      defaults: defaultVal,
      items: reportRows,
      grandTotal,
      startAdaNo: minAdaNo,
      endAdaNo: maxAdaNo
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

