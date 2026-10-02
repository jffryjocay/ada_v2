import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { query, get } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportPhpPath = path.join(__dirname, "../report/report.php");
const summaryPhpPath = path.join(__dirname, "../report/summary.php");
const logoPath = path.join(__dirname, "../../img/cityhall_logo.png");

// In-memory PDF buffer cache for sub-millisecond response delivery
const pdfCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

export const clearPdfCache = () => {
  pdfCache.clear();
};

const formatDateWords = (dateInput) => {
  if (!dateInput) return "";
  let dStr = String(dateInput).trim();
  if (dStr.includes("T")) dStr = dStr.split("T")[0];
  if (dStr.includes(" ")) dStr = dStr.split(" ")[0];

  let parts = [];
  if (dStr.includes("-")) {
    parts = dStr.split("-");
    if (parts[0].length === 4) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      if (months[monthIdx]) {
        return `${months[monthIdx]} ${String(day).padStart(2, "0")}, ${year}`;
      }
    }
  } else if (dStr.includes("/")) {
    parts = dStr.split("/");
    if (parts[2] && parts[2].length === 4) {
      const year = parts[2];
      const monthIdx = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      if (months[monthIdx]) {
        return `${months[monthIdx]} ${String(day).padStart(2, "0")}, ${year}`;
      }
    }
  }

  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
  }
  return dStr;
};

const formatDateYMD = (dateInput) => {
  if (!dateInput) return "";
  let dStr = String(dateInput).trim();
  if (dStr.includes("T")) dStr = dStr.split("T")[0];
  if (dStr.includes(" ")) dStr = dStr.split(" ")[0];

  if (dStr.includes("-")) {
    const parts = dStr.split("-");
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  } else if (dStr.includes("/")) {
    const parts = dStr.split("/");
    if (parts[2] && parts[2].length === 4) return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }

  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return dStr;
};

function numberToWord(num) {
  num = Math.floor(Number(num)).toString();
  if (isNaN(num) || num === "0" || !num) return "ZERO";

  const list1 = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const list2 = [
    "", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
    "Eighty", "Ninety", "Hundred"
  ];
  const list3 = [
    "", "Thousand", "Million", "Billion", "Trillion", "Quadrillion"
  ];

  let numLength = num.length;
  let levels = Math.floor((numLength + 2) / 3);
  let maxLength = levels * 3;
  num = num.padStart(maxLength, "0");
  let numLevels = [];
  for (let i = 0; i < num.length; i += 3) {
    numLevels.push(num.slice(i, i + 3));
  }

  let words = [];
  for (let numPartStr of numLevels) {
    levels--;
    let numPart = parseInt(numPartStr, 10);
    let hundreds = Math.floor(numPart / 100);
    let hundredsStr = hundreds ? ` ${list1[hundreds]} Hundred ` : "";
    let tens = numPart % 100;
    let tensStr = "";
    let singlesStr = "";

    if (tens < 20) {
      tensStr = tens ? ` ${list1[tens]} ` : "";
    } else {
      let tensDigit = Math.floor(tens / 10);
      tensStr = ` ${list2[tensDigit]} `;
      let singlesDigit = numPart % 10;
      singlesStr = singlesDigit ? ` ${list1[singlesDigit]} ` : "";
    }
    let levelStr = levels && numPart ? ` ${list3[levels]} ` : "";
    words.push(hundredsStr + tensStr + singlesStr + levelStr);
  }

  return words.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Generate Appendix 36 (ADA Slip) using native Node.js PDFKit stream
 */
const generateAdaPdfBuffer = async (ada_no) => {
  const default_row = (await get("SELECT * FROM default_value LIMIT 1")) || {};
  const ada_list_row = (await get("SELECT * FROM ada_list WHERE ada_no = ?", [ada_no])) || {};
  const offices = await query("SELECT * FROM office WHERE ada_no = ?", [ada_no]);

  let total1 = offices.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
  let totalz = total1.toFixed(2);
  let [wholenum, decnum] = totalz.split(".");

  let dateFormatted = formatDateYMD(ada_list_row.ada_date);
  if (dateFormatted.includes("-")) {
    const parts = dateFormatted.split("-");
    dateFormatted = `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}/${parts[0]}`;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 28.3 });
    const buffers = [];
    doc.on("data", (c) => buffers.push(c));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 28.3, 14.1, { width: 70.8, height: 70.8 });
    }

    doc.font("Times-Italic").fontSize(10).text("Appendix 36", 28.3, 14.1, { align: "right", width: 552.7 });
    doc.font("Times-Roman").fontSize(12).text("CITY GOVERNMENT OF COTABATO", 28.3, 28.3, { align: "center", width: 552.7 });
    doc.moveDown(0.2);
    doc.font("Times-Bold").fontSize(12).text("AUTHORITY TO DEBIT ACCOUNT (ADA)", { align: "center", width: 552.7 });
    doc.moveDown(0.8);

    let startY = 85;

    doc.font("Times-Bold").fontSize(12).text(default_row.addressee || "", 28.3, startY, { underline: true, width: 276 });
    doc.font("Times-Roman").fontSize(12).text(default_row.bank || "", 28.3, startY + 14, { underline: true, width: 276 });

    doc.font("Times-Roman").fontSize(12).text("ADA No. ", 304.3, startY, { align: "right", width: 191 });
    doc.font("Times-Bold").fontSize(12).text(ada_list_row.ada_no || "", 495.3, startY, { width: 85, underline: true });

    doc.font("Times-Roman").fontSize(12).text("Date: ", 304.3, startY + 14, { align: "right", width: 191 });
    doc.font("Times-Bold").fontSize(12).text(dateFormatted, 495.3, startY + 14, { width: 85, underline: true });

    doc.y = startY + 35;
    doc.font("Times-Roman").fontSize(11).text("Sir/Madam:", 28.3);
    doc.moveDown(0.3);

    let lineY = doc.y;
    doc.font("Times-Roman").fontSize(11).text("Please debit the agency Account No.", 28.3, lineY);
    doc.font("Times-Bold").fontSize(12).text(ada_list_row.account_no || default_row.account_no || "", 200, lineY, { width: 170, align: "center", underline: true });
    doc.font("Times-Roman").fontSize(11).text("the amount of", 375, lineY, { align: "right", width: 206 });

    doc.y = lineY + 18;

    let wordsText = parseInt(decnum, 10) > 0
      ? `${numberToWord(wholenum)} Pesos & ${decnum}/100 Only`
      : `${numberToWord(wholenum)} Pesos Only`;

    doc.font("Times-BoldItalic").fontSize(11).text(wordsText, 28.3, doc.y, { align: "center", width: 552.7, underline: true });
    doc.font("Times-Roman").fontSize(9).text("(In Words)", { align: "center", width: 552.7 });
    doc.moveDown(0.4);

    let amountStr = Number(total1).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let figY = doc.y;
    doc.font("Times-Bold").fontSize(8.5);
    doc.text("₱", 28.3 + 30, figY + 3);
    doc.font("Times-Roman").fontSize(13).text(amountStr, 28.3, figY, { align: "center", width: 141.7, underline: true });
    doc.font("Times-Roman").fontSize(9).text("(In Figures)", 28.3, figY + 15, { align: "center", width: 141.7 });

    doc.y = figY + 30;
    doc.font("Times-Roman").fontSize(11).text("Please credit the accounts of the listed creditors to cover payment of payables.", 28.3);
    doc.moveDown(0.5);

    let tableY = doc.y;
    let colWidths = [184, 90, 173, 105];
    let colX = [28.3, 28.3 + 184, 28.3 + 184 + 90, 28.3 + 184 + 90 + 173];

    doc.rect(colX[0], tableY, colWidths[0], 18).stroke();
    doc.rect(colX[1], tableY, colWidths[1], 18).stroke();
    doc.rect(colX[2], tableY, colWidths[2], 18).stroke();
    doc.rect(colX[3], tableY, colWidths[3], 18).stroke();

    doc.font("Times-Bold").fontSize(11);
    doc.text("Office/Department/Payee", colX[0], tableY + 4, { width: colWidths[0], align: "center" });
    doc.text("Reference", colX[1], tableY + 4, { width: colWidths[1], align: "center" });
    doc.text("Nature of Payment", colX[2], tableY + 4, { width: colWidths[2], align: "center" });
    doc.text("Amount", colX[3], tableY + 4, { width: colWidths[3], align: "center" });

    let currentY = tableY + 18;

    offices.forEach((off) => {
      let rowHeight = 18;
      doc.rect(colX[0], currentY, colWidths[0], rowHeight).stroke();
      doc.rect(colX[1], currentY, colWidths[1], rowHeight).stroke();
      doc.rect(colX[2], currentY, colWidths[2], rowHeight).stroke();
      doc.rect(colX[3], currentY, colWidths[3], rowHeight).stroke();

      doc.font("Times-Roman").fontSize(10);
      doc.text(off.office || "", colX[0] + 2, currentY + 4, { width: colWidths[0] - 4, align: "center" });
      doc.text(off.reference || "", colX[1] + 2, currentY + 4, { width: colWidths[1] - 4, align: "center" });

      let nopFont = (off.nop || "").length > 24 ? 9 : 10;
      doc.font("Times-Roman").fontSize(nopFont);
      doc.text(off.nop || "", colX[2] + 2, currentY + 4, { width: colWidths[2] - 4, align: "center" });

      let amtFormatted = Number(off.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Times-Bold").fontSize(8.5);
      doc.text("₱", colX[3] + 4, currentY + 4);
      doc.font("Times-Roman").fontSize(10);
      doc.text(amtFormatted, colX[3] - 2, currentY + 4, { width: colWidths[3] - 4, align: "right" });

      currentY += rowHeight;
    });

    let totWidth = colWidths[0] + colWidths[1] + colWidths[2];
    doc.rect(colX[0], currentY, totWidth, 18).stroke();
    doc.rect(colX[3], currentY, colWidths[3], 18).stroke();
    doc.font("Times-Bold").fontSize(11);
    doc.text("Total Amount", colX[0] - 5, currentY + 4, { width: totWidth, align: "right" });

    let totalFormatted = Number(total1).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    doc.font("Times-Bold").fontSize(8.5);
    doc.text("₱", colX[3] + 4, currentY + 4);
    doc.font("Times-Roman").fontSize(10);
    doc.text(totalFormatted, colX[3] - 2, currentY + 4, { width: colWidths[3] - 4, align: "right" });

    currentY += 30;

    doc.font("Times-Bold").fontSize(11).text("Agency Authorized Signatories", 28.3, currentY, { align: "center", width: 552.7 });
    currentY += 25;

    let leftX = 28.3;
    let rightX = 380;
    let sigWidth = 200;

    doc.font("Times-Bold").fontSize(11);
    doc.text(default_row.left_name || "", leftX, currentY, { align: "center", width: sigWidth, underline: true });
    doc.text(default_row.right_name || "", rightX, currentY, { align: "center", width: sigWidth, underline: true });

    currentY += 15;
    doc.font("Times-Roman").fontSize(10);
    doc.text(default_row.left_title || "", leftX, currentY, { align: "center", width: sigWidth });
    doc.text(default_row.right_title || "", rightX, currentY, { align: "center", width: sigWidth });

    doc.end();
  });
};

/**
 * Generate Appendix 37 (RADAI Report) using native Node.js PDFKit stream
 */
const generateRadaiPdfBuffer = async (report_no) => {
  const default_row = (await get("SELECT * FROM default_value LIMIT 1")) || {};
  const radai_row = (await get("SELECT * FROM radai_list WHERE report_no = ?", [report_no])) || {};

  const date_range = radai_row.date_range || "daily";
  const one_date = radai_row.one_date || "";
  const two_date = radai_row.two_date || "";
  const acctno = radai_row.account_no || default_row.account_no || "";
  const fund = radai_row.fund || "";

  let sql = "";
  let params = [];
  if (date_range === "daily") {
    sql = "SELECT * FROM ada_list WHERE ada_date = ? AND account_no = ?";
    params = [one_date, acctno];
  } else {
    sql = "SELECT * FROM ada_list WHERE ada_date >= ? AND ada_date <= ? AND account_no = ?";
    params = [one_date, two_date, acctno];
  }

  const ada_list = await query(sql, params);
  let rowsData = [];
  for (let ada of ada_list) {
    const offices = await query("SELECT * FROM office WHERE ada_no = ?", [ada.ada_no]);
    for (let off of offices) {
      rowsData.push({
        ada_date: formatDateYMD(ada.ada_date),
        ada_no: ada.ada_no,
        reference: off.reference,
        cafoa: off.cafoa,
        office: off.office,
        nop: off.nop,
        amount: parseFloat(off.amount || 0)
      });
    }
  }

  let adaNumbers = [...new Set(rowsData.map((r) => r.ada_no))].sort();
  let startAda = adaNumbers.length > 0 ? adaNumbers[0] : "";
  let endAda = adaNumbers.length > 0 ? adaNumbers[adaNumbers.length - 1] : "";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 28.3 });
    const buffers = [];
    doc.on("data", (c) => buffers.push(c));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Logo
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 28.3, 14.1, { width: 70.8, height: 70.8 });
    }

    doc.font("Times-Italic").fontSize(10).text("Appendix 37", 28.3, 14.1, { align: "right", width: 552.7 });
    doc.font("Times-Bold").fontSize(12).text("REPORT OF AUTHORITY TO DEBIT ACCOUNT ISSUED", 28.3, 30, { align: "center", width: 552.7 });

    let periodText = "";
    if (date_range === "daily") {
      periodText = `Period Covered: ${formatDateWords(one_date)}`;
    } else {
      periodText = `Period Covered: From ${formatDateWords(one_date)} To ${formatDateWords(two_date)}`;
    }
    doc.font("Times-Bold").fontSize(11).text(periodText, 28.3, 46, { align: "center", width: 552.7 });

    let infoY = 92;

    doc.font("Times-Roman").fontSize(10).text("LGU: ", 28.3, infoY);
    doc.font("Times-Roman").fontSize(10).text("City Government of Cotabato", 55, infoY);
    doc.moveTo(55, infoY + 11).lineTo(260, infoY + 11).stroke();

    infoY += 16;
    doc.font("Times-Roman").fontSize(10).text("Fund: ", 28.3, infoY);
    doc.font("Times-Roman").fontSize(10).text(fund, 60, infoY);
    doc.moveTo(60, infoY + 11).lineTo(260, infoY + 11).stroke();

    doc.font("Times-Roman").fontSize(10).text("Report No.: ", 375, infoY);
    doc.font("Times-Roman").fontSize(10).text(report_no, 435, infoY);
    doc.moveTo(435, infoY + 11).lineTo(581, infoY + 11).stroke();

    infoY += 16;
    doc.font("Times-Roman").fontSize(10).text("Bank Name/Account No.: ", 28.3, infoY);
    doc.font("Times-Roman").fontSize(10).text(acctno, 145, infoY);
    doc.moveTo(145, infoY + 11).lineTo(260, infoY + 11).stroke();

    doc.font("Times-Roman").fontSize(10).text("Sheet No.: ", 375, infoY);
    doc.font("Times-Roman").fontSize(10).text("1-1", 435, infoY);
    doc.moveTo(435, infoY + 11).lineTo(581, infoY + 11).stroke();

    let tableY = infoY + 22;
    let colW = [52, 60, 62, 48, 142, 110, 78.7];
    let colX = [28.3];
    for (let i = 0; i < colW.length - 1; i++) {
      colX.push(colX[i] + colW[i]);
    }

    doc.rect(colX[0], tableY, colW[0] + colW[1], 15).stroke();
    doc.rect(colX[2], tableY, colW[2], 30).stroke();
    doc.rect(colX[3], tableY, colW[3], 30).stroke();
    doc.rect(colX[4], tableY, colW[4], 30).stroke();
    doc.rect(colX[5], tableY, colW[5], 30).stroke();
    doc.rect(colX[6], tableY, colW[6], 30).stroke();

    doc.font("Times-Bold").fontSize(9);
    doc.text("ADA", colX[0], tableY + 3, { width: colW[0] + colW[1], align: "center" });

    doc.text("DV/Payroll", colX[2], tableY + 5, { width: colW[2], align: "center" });
    doc.text("No.", colX[2], tableY + 16, { width: colW[2], align: "center" });

    doc.text("CAFOA", colX[3], tableY + 5, { width: colW[3], align: "center" });
    doc.text("No.", colX[3], tableY + 16, { width: colW[3], align: "center" });

    doc.text("Payee", colX[4], tableY + 10, { width: colW[4], align: "center" });
    doc.text("Nature of Payment", colX[5], tableY + 10, { width: colW[5], align: "center" });
    doc.text("Amount", colX[6], tableY + 10, { width: colW[6], align: "center" });

    doc.rect(colX[0], tableY + 15, colW[0], 15).stroke();
    doc.rect(colX[1], tableY + 15, colW[1], 15).stroke();
    doc.text("Date", colX[0], tableY + 18, { width: colW[0], align: "center" });
    doc.text("Serial No.", colX[1], tableY + 18, { width: colW[1], align: "center" });

    let currentY = tableY + 30;

    rowsData.forEach((row) => {
      let rH = 16;
      for (let i = 0; i < colW.length; i++) {
        doc.rect(colX[i], currentY, colW[i], rH).stroke();
      }
      doc.font("Times-Roman").fontSize(8);
      doc.text(row.ada_date || "", colX[0] + 1, currentY + 4, { width: colW[0] - 2, align: "center" });
      doc.text(row.ada_no || "", colX[1] + 1, currentY + 4, { width: colW[1] - 2, align: "center" });
      doc.text(row.reference || "", colX[2] + 1, currentY + 4, { width: colW[2] - 2, align: "center" });
      doc.text(row.cafoa || "", colX[3] + 1, currentY + 4, { width: colW[3] - 2, align: "center" });
      doc.text(row.office || "", colX[4] + 1, currentY + 4, { width: colW[4] - 2, align: "center" });

      let nopFont = (row.nop || "").length >= 22 ? 8 : 9;
      doc.font("Times-Roman").fontSize(nopFont);
      doc.text(row.nop || "", colX[5] + 1, currentY + 4, { width: colW[5] - 2, align: "center" });

      doc.font("Times-Bold").fontSize(8.5);
      doc.text("₱", colX[6] + 4, currentY + 3.5);
      let amtStr = Number(row.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.font("Times-Roman").fontSize(9);
      doc.text(amtStr, colX[6] + 2, currentY + 3.5, { width: colW[6] - 4, align: "right" });

      currentY += rH;
    });

    if (rowsData.length === 1) {
      let rH = 16;
      for (let i = 0; i < colW.length; i++) {
        doc.rect(colX[i], currentY, colW[i], rH).stroke();
      }
      currentY += rH;
    }

    currentY += 15;

    doc.font("Times-Bold").fontSize(11).text("CERTIFICATION", 28.3, currentY, { align: "center", width: 552.7 });
    currentY += 14;

    doc.font("Times-Roman").fontSize(9.5);
    doc.text("I hereby certify on my official oath that the above is a true statement of all ADAs issued this me during", 28.3, currentY, { align: "center", width: 552.7 });
    currentY += 12;

    let certLine2Text = `period stated above for which ADA Nos. ${startAda} to ${endAda} inclusive, were actually this by me in the amounts shown there.`;
    doc.text(certLine2Text, 28.3, currentY, { align: "center", width: 552.7 });

    // Underline the startAda and endAda in the certification sentence
    if (startAda && endAda) {
      let line2Y = currentY + 10;
      doc.moveTo(215, line2Y).lineTo(290, line2Y).stroke();
      doc.moveTo(304, line2Y).lineTo(380, line2Y).stroke();
    }

    currentY += 28;

    let certName = default_row.radai_name || "TEDDY U. INTA, MPA";
    let certTitle = "Name and Signature of Local Treasurer";
    let todayObj = new Date();
    let todayFormatted = `${todayObj.getMonth() + 1}/${todayObj.getDate()}/${todayObj.getFullYear()}`;

    doc.font("Times-Bold").fontSize(11).text(certName, 28.3, currentY, { align: "center", width: 552.7 });
    let sigLineY = currentY + 13;
    doc.moveTo(176, sigLineY).lineTo(436, sigLineY).stroke();

    currentY = sigLineY + 3;
    doc.font("Times-Roman").fontSize(9.5).text(certTitle, 28.3, currentY, { align: "center", width: 552.7 });

    currentY += 20;
    doc.font("Times-Bold").fontSize(10).text(todayFormatted, 28.3, currentY, { align: "center", width: 552.7 });
    let dateLineY = currentY + 12;
    doc.moveTo(240, dateLineY).lineTo(372, dateLineY).stroke();

    currentY = dateLineY + 3;
    doc.font("Times-Roman").fontSize(9).text("Date", 28.3, currentY, { align: "center", width: 552.7 });

    doc.end();
  });
};

/**
 * Controller: Generate ADA Slip PDF (Appendix 36)
 */
export const generateAdaPdf = async (req, res) => {
  const { ada_no } = req.params;
  const cacheKey = `ADA_${ada_no}`;

  const cached = pdfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=ADA_${ada_no}.pdf`);
    res.setHeader("X-Cache", "HIT");
    return res.send(cached.buffer);
  }

  try {
    const pdfBuffer = await generateAdaPdfBuffer(ada_no);
    pdfCache.set(cacheKey, { buffer: pdfBuffer, timestamp: Date.now() });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=ADA_${ada_no}.pdf`);
    res.setHeader("X-Cache", "MISS");
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDFKit error, falling back to PHP execution:", err.message);
    const queryString = `a=${encodeURIComponent(ada_no)}`;
    execFile("php", [reportPhpPath, queryString], { encoding: "buffer", maxBuffer: 10 * 1024 * 1024 }, (pErr, stdout) => {
      if (pErr && !stdout) {
        return res.status(500).send("Error generating ADA report: " + pErr.message);
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=ADA_${ada_no}.pdf`);
      res.send(stdout);
    });
  }
};

/**
 * Controller: Generate RADAI Report PDF (Appendix 37)
 */
export const generateRadaiPdf = async (req, res) => {
  const { report_no } = req.params;
  const cacheKey = `RADAI_${report_no}`;

  const cached = pdfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=RADAI_${report_no}.pdf`);
    res.setHeader("X-Cache", "HIT");
    return res.send(cached.buffer);
  }

  try {
    const pdfBuffer = await generateRadaiPdfBuffer(report_no);
    pdfCache.set(cacheKey, { buffer: pdfBuffer, timestamp: Date.now() });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=RADAI_${report_no}.pdf`);
    res.setHeader("X-Cache", "MISS");
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("PDFKit error, falling back to PHP execution:", err.message);
    const queryString = `report_no=${encodeURIComponent(report_no)}`;
    execFile("php", [summaryPhpPath, queryString], { encoding: "buffer", maxBuffer: 10 * 1024 * 1024 }, (pErr, stdout) => {
      if (pErr && !stdout) {
        return res.status(500).send("Error generating RADAI report: " + pErr.message);
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=RADAI_${report_no}.pdf`);
      res.send(stdout);
    });
  }
};
