/**
 * dailyDepositLedgerXlsx.js
 *
 * Builds the Daily Deposit ledger workbook in the SAME layout as the
 * hand-made bond ledger (e.g. Varsha_Kumari_12M.xlsx):
 *
 *   title band, client box + logo, yellow column header, one row per calendar
 *   day (Date | Days | Tenure Day | Deposit | Percentage | Profit | Total
 *   Blance), a yellow subtotal row per month block and a blue grand total.
 *
 * Profit stays a live Excel formula (=+D10*E10/C10*B10) so the sheet can be
 * edited by hand exactly like the originals.
 *
 * Input is a list of DEPOSITS (the day money was received + amount). It does
 * NOT use the SIP-style pre-generated installment slots.
 *
 * Dates: pass "YYYY-MM-DD" strings (or Date objects built with local
 * components). Everything is handled as UTC midnight so nothing shifts a day.
 */
import ExcelJS from "exceljs";

// ---------------------------------------------------------------------------
// Look & feel copied from the actual ledger
// ---------------------------------------------------------------------------
const BLUE = "FF5B9BD5"; // theme accent1 of the original file
const YELLOW = "FFFFFF00";
const BLACK = "FF000000";
const TITLE_GREY = "FF595959"; // theme text colour lightened 35%, as in the original title

const FMT = {
  date: "mm-dd-yy",
  money: '_ * #,##0.00_ ;_ * \\-#,##0.00_ ;_ * "-"??_ ;_ @_ ',
  profit: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)',
  percent: "0%",
  phone: "0_);[Red]\\(0\\)",
};

// Labels exactly as in the actual ledger (including its spelling).
export const LABELS = {
  title: "Groww Karo Daily Deposit ",
  header: ["Date ", "Days", "Tenure Day", "Deposit", "Percentage", "Profit", "Total Blance "],
};

const THIN = { style: "thin" };
const edges = (spec) => {
  const b = {};
  if (spec.includes("l")) b.left = THIN;
  if (spec.includes("r")) b.right = THIN;
  if (spec.includes("t")) b.top = THIN;
  if (spec.includes("b")) b.bottom = THIN;
  return b;
};

// ---------------------------------------------------------------------------
// UTC date helpers
// ---------------------------------------------------------------------------
const DAY_MS = 86400000;

export function toUtc(value) {
  if (!value) {
    throw new Error("Date value cannot be null or undefined");
  }

  // Agar already Date object hai
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  const strVal = String(value).trim();

  // 1. Check for YYYY-MM-DD format (e.g., "2026-09-20")
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(strVal);
  if (m) {
    const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (date.getUTCFullYear() === +m[1] && date.getUTCMonth() === +m[2] - 1 && date.getUTCDate() === +m[3]) {
      return date;
    }
  }

  // 2. Check for DD-MM-YYYY or DD/MM/YYYY format (e.g., "20-9-2026" or "20/09/2026")
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(strVal);
  if (m) {
    const date = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    if (date.getUTCFullYear() === +m[3] && date.getUTCMonth() === +m[2] - 1 && date.getUTCDate() === +m[1]) {
      return date;
    }
  }

  throw new Error(`Invalid date format: ${value}`);
}

const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);
const diffDays = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY_MS);
const key = (d) => d.toISOString().slice(0, 10);
const endOfMonth = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));

/** Same as Java's LocalDate.plusMonths: clamps to the last day of the month. */
export function addMonthsClamped(d, months) {
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + months;
  const y = Math.floor(total / 12);
  const m = total % 12;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last)));
}

export function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
}

/**
 * Month blocks as in the actual ledgers: calendar months, the first one
 * starting on the start date and the last one ending on the end date.
 * A start date that is the LAST day of its month (31-Jan) is folded into the
 * next month's block, which is how the 31-Jan-2026 bond was laid out.
 */
export function buildBlocks(start, end) {
  const blocks = [];
  let cursor = start;
  while (cursor <= end) {
    let blockEnd = endOfMonth(cursor);
    if (blocks.length === 0 && cursor.getUTCDate() === blockEnd.getUTCDate()) {
      blockEnd = endOfMonth(addDays(blockEnd, 1));
    }
    if (blockEnd > end) blockEnd = end;
    blocks.push({ from: cursor, to: blockEnd });
    cursor = addDays(blockEnd, 1);
  }
  return blocks;
}

/** True for Daily Deposit bonds, whether tagged by plan type or still stored as SIP with DAILY frequency. */
export function isDailyDeposit(bond) {
  const plan = String(bond?.planType ?? bond?.scheme?.planType ?? "").toUpperCase();
  const freq = String(bond?.sipFrequency ?? "").toUpperCase();
  return plan === "DAILY_DEPOSIT" || freq === "DAILY";
}

/**
 * Adapter for data that still comes from the SIP-style ledger
 * (sipLedger rows with paidDate / paidAmount): one deposit per paid date.
 */
export function depositsFromSipLedger(installments = []) {
  const byDate = new Map();
  for (const row of installments) {
    const amount = Number(row?.paidAmount || 0);
    if (!(amount > 0)) continue;
    if (!row.paidDate) {
      throw new Error("Add a payment date for every daily deposit before exporting the ledger");
    }
    const k = String(row.paidDate).slice(0, 10);
    byDate.set(k, (byDate.get(k) || 0) + amount);
  }
  return [...byDate].map(([date, amount]) => {
    if (amount > 2000) {
      throw new Error(`Daily deposits on ${date} exceed the ₹2,000 limit`);
    }
    return { date, amount };
  });
}

// ---------------------------------------------------------------------------
// Workbook builder (pure: no DOM, runs in Node for tests)
// ---------------------------------------------------------------------------
/**
 * @param {object}  p
 * @param {{name:string, phone?:string|number}} p.member
 * @param {{bondNo:string, startDate:string, tenureMonths:number,
 *          ratePercent:number, endDate?:string}} p.bond
 *        ratePercent = interest for the whole tenure (28 for the 12-month bond)
 * @param {{date:string, amount:number}[]} p.deposits
 * @param {{base64:string, extension:'png'|'jpeg'}} [p.logo]  already cropped
 */
export function buildDailyDepositLedgerWorkbook({ member, bond, deposits = [], logo }) {
  const start = toUtc(bond.startDate);
  const months = Number(bond.tenureMonths);
  if (!Number.isInteger(months) || !(months > 0)) {
    throw new Error("tenureMonths must be a positive whole number");
  }
  const end = bond.endDate ? toUtc(bond.endDate) : addDays(addMonthsClamped(start, months), -1);
  if (end < start) throw new Error("The ledger end date must not be before its start date");
  const rawRate = bond.ratePercent ?? bond.profitPercentage;
  const ratePercent = Number(rawRate);
  if (rawRate == null || rawRate === "" || !Number.isFinite(ratePercent) || ratePercent < 0) {
    // never guess: a wrong rate prints wrong money on a client's ledger
    throw new Error("Interest rate is missing for this bond, cannot build the ledger");
  }
  const rate = ratePercent / 100;
  const tenureDays = diffDays(start, end) + 1;

  // deposits by day; refuse to silently drop money that falls outside the tenure
  const byDay = new Map();
  const outside = [];
  for (const d of deposits) {
    const day = toUtc(d.date);
    const amount = Number(d.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid deposit amount for ${key(day)}: ${d.amount}`);
    }
    if (day < start || day > end) {
      outside.push(`${key(day)} (${amount})`);
      continue;
    }
    const dailyTotal = (byDay.get(key(day)) || 0) + amount;
    if (dailyTotal > 2000) {
      throw new Error(`Daily deposits on ${key(day)} exceed the ₹2,000 limit`);
    }
    byDay.set(key(day), dailyTotal);
  }
  if (outside.length) {
    throw new Error(`Deposits outside ${key(start)}..${key(end)}: ${outside.join(", ")}`);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1", {
    views: [{ zoomScale: 85, zoomScaleNormal: 85 }],
    pageSetup: { paperSize: 9, orientation: "portrait" },
    properties: { defaultColWidth: 8.6640625, defaultRowHeight: 14.4 },
  });
  [11, 6.88671875, 12.44140625, 11.5546875, 14, 10.109375, 13.5546875].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const font = (bold = false, size = 11, argb = BLACK) => ({ name: "Calibri", size, bold, color: { argb } });
  const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

  // ---- title band -------------------------------------------------------
  ws.getRow(1).height = 29.1;
  const title = ws.getCell("A1");
  title.value = LABELS.title;
  title.font = font(true, 22, TITLE_GREY);
  title.fill = fill(BLUE);
  title.alignment = { horizontal: "center", vertical: "middle" };
  title.border = { right: THIN };
  ws.mergeCells("A1:G1");

  // ---- client box (rows 2-7) ---------------------------------------------
  const phoneDigits = String(member.phone ?? "").replace(/\D/g, "");
  const info = [
    ["Client Name:", member.name?.trim() ?? "", FMT.money],
    ["Starting Date:", start, FMT.date],
    ["Ending Date:", end, FMT.date],
    ["Mobile No.:", phoneDigits.length === 10 ? Number(phoneDigits) : String(member.phone ?? ""), FMT.phone],
    ["Bond No. :", bond.bondNo, FMT.money],
    ["Tenure:", `${months} Month`, FMT.money],
  ];
  info.forEach(([label, value, numFmt], i) => {
    const r = i + 2;
    const a = ws.getCell(`A${r}`);
    a.value = label;
    a.font = font();
    a.alignment = { horizontal: "left" };
    a.border = edges("lrtb");
    ws.mergeCells(`A${r}:C${r}`);
    const d = ws.getCell(`D${r}`);
    d.value = value;
    d.numFmt = numFmt;
    d.font = font();
    d.alignment = { horizontal: "center" };
    d.border = edges("lrtb");
    ws.mergeCells(`D${r}:E${r}`);
  });

  // logo box F2:G7
  ws.getCell("F2").font = font(true);
  ws.getCell("F2").alignment = { horizontal: "center" };
  ws.getCell("F2").border = edges("lrb");
  ws.mergeCells("F2:G7");
  if (logo?.base64) {
    const imageId = wb.addImage({ base64: logo.base64, extension: logo.extension || "png" });
    ws.addImage(imageId, {
      tl: { nativeCol: 5, nativeColOff: 161290, nativeRow: 1, nativeRowOff: 49530 },
      br: { nativeCol: 6, nativeColOff: 735330, nativeRow: 6, nativeRowOff: 139065 },
      editAs: "oneCell",
    });
  }

  // ---- blue band (row 8) --------------------------------------------------
  ws.getCell("A8").fill = fill(BLUE);
  ws.getCell("A8").border = edges("lrb");
  ws.getCell("A8").alignment = { horizontal: "center" };
  ws.mergeCells("A8:F8");
  ws.getCell("G8").fill = fill(BLUE);
  ws.getCell("G8").border = edges("ltb");
  ws.getCell("G8").alignment = { horizontal: "center" };

  // ---- column header (row 9) ----------------------------------------------
  LABELS.header.forEach((text, i) => {
    const c = ws.getCell(9, i + 1);
    c.value = text;
    c.font = font(true);
    c.fill = fill(YELLOW);
    c.border = edges("lrtb");
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  // ---- data rows + month blocks ----------------------------------------------
  const blocks = buildBlocks(start, end);
  let row = 10;
  const subtotalRows = [];
  const subtotals = [];
  let grandDeposit = 0;
  let grandProfit = 0;

  const styleSummary = (r, { label, totalLabel, fillArgb, centerProfit }) => {
    for (let c = 1; c <= 7; c++) {
      const cell = ws.getCell(r, c);
      cell.font = font(true);
      cell.fill = fill(fillArgb);
      cell.border = edges("lrtb");
    }
    ws.getCell(r, 1).value = label || null;
    ws.getCell(r, 3).value = totalLabel;
    ws.getCell(r, 4).numFmt = FMT.money;
    ws.getCell(r, 6).numFmt = FMT.profit;
    ws.getCell(r, 7).numFmt = FMT.money;
    if (centerProfit) ws.getCell(r, 6).alignment = { horizontal: "center", vertical: "middle" };
  };

  blocks.forEach((blk, bi) => {
    const first = row;
    let sumD = 0;
    let sumF = 0;
    for (let day = blk.from; day <= blk.to; day = addDays(day, 1)) {
      const amount = byDay.get(key(day)) || 0;
      const days = diffDays(day, end) + 1;
      const profit = (amount * rate) / tenureDays * days;
      sumD += amount;
      sumF += profit;

      const a = ws.getCell(row, 1);
      a.value = day;
      a.numFmt = FMT.date;
      ws.getCell(row, 2).value = days;
      ws.getCell(row, 3).value = tenureDays;
      const d = ws.getCell(row, 4);
      if (amount) d.value = amount;
      d.numFmt = FMT.money;
      const e = ws.getCell(row, 5);
      e.value = rate;
      e.numFmt = FMT.percent;
      const f = ws.getCell(row, 6);
      f.value = { formula: `+D${row}*E${row}/C${row}*B${row}`, result: profit };
      f.numFmt = FMT.profit;
      f.alignment = { horizontal: "center", vertical: "middle" };
      const g = ws.getCell(row, 7);
      g.value = { formula: `D${row}+F${row}`, result: amount + profit };
      g.numFmt = FMT.money;
      for (let c = 1; c <= 7; c++) {
        const cell = ws.getCell(row, c);
        cell.font = font();
        cell.border = edges("lrtb");
      }
      row++;
    }
    const last = row - 1;
    const isLast = bi === blocks.length - 1;
    styleSummary(row, {
      label: bi + 1 <= months ? `${ordinal(bi + 1)} Month` : "",
      totalLabel: isLast ? "Total :-" : "Total:-",
      fillArgb: YELLOW,
      centerProfit: !isLast,
    });
    ws.getCell(row, 5).value = "Totalprofit:-";
    ws.getCell(row, 4).value = { formula: `SUM(D${first}:D${last})`, result: sumD };
    ws.getCell(row, 6).value = { formula: `SUM(F${first}:F${last})`, result: sumF };
    ws.getCell(row, 7).value = { formula: `SUM(G${first}:G${last})`, result: sumD + sumF };
    subtotalRows.push(row);
    subtotals.push({ deposit: sumD, profit: sumF });
    grandDeposit += sumD;
    grandProfit += sumF;
    row++;
  });

  // ---- grand total (blue) ------------------------------------------------------
  const refs = (col) => [...subtotalRows].reverse().map((r) => `${col}${r}`).join("+");
  styleSummary(row, { label: "", totalLabel: "Total Deposit", fillArgb: BLUE, centerProfit: false });
  ws.getCell(row, 5).value = "Total";
  ws.getCell(row, 4).value = { formula: refs("D"), result: grandDeposit };
  ws.getCell(row, 6).value = { formula: refs("F"), result: grandProfit };
  ws.getCell(row, 7).value = { formula: refs("G"), result: grandDeposit + grandProfit };

  return {
    workbook: wb,
    summary: {
      startDate: key(start),
      endDate: key(end),
      tenureDays,
      blocks: blocks.length,
      totalDeposit: grandDeposit,
      totalProfit: grandProfit,
      maturityAmount: grandDeposit + grandProfit,
      grandTotalRow: row,
    },
  };
}

// ---------------------------------------------------------------------------
// Browser helpers (not used by the Node tests)
// ---------------------------------------------------------------------------
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function downloadDailyDepositLedgerXlsx(data, fileName) {
  const { workbook } = buildDailyDepositLedgerWorkbook(data);
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_MIME }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Fetches the company logo and crops it to the part the original ledger shows
 * (the fractions below are the crop stored in the original file).
 * Returns { base64, extension } or undefined if the logo can't be loaded, so
 * a missing logo never blocks the download.
 */
export async function loadLedgerLogo(
  url,
  crop = { left: 0.05498, top: 0.13964, right: 0.05271, bottom: 0.21097 },
) {
  if (!url) return undefined;
  try {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob);
    const sx = Math.round(bmp.width * crop.left);
    const sy = Math.round(bmp.height * crop.top);
    const sw = Math.round(bmp.width * (1 - crop.left - crop.right));
    const sh = Math.round(bmp.height * (1 - crop.top - crop.bottom));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext("2d").drawImage(bmp, sx, sy, sw, sh, 0, 0, sw, sh);
    return { base64: canvas.toDataURL("image/png"), extension: "png" };
  } catch {
    return undefined;
  }
}
