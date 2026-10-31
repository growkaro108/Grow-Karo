import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import { getSipProfitRate } from "./components/user-management/format";
export function currency(n) {
  if (typeof n !== "number" || Number.isNaN(n)) {
    return "₹0";
  }

  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  const trim = (value) =>
    value % 1 === 0 ? value.toString() : value.toFixed(1);

  if (abs >= 1_00_00_000) {
    return `${sign}₹${trim(abs / 1_00_00_000)} Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${trim(abs / 1_00_000)} L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${trim(abs / 1_000)} k`;
  }
  return `${sign}₹${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
export const COMPOUNDS_PER_YEAR = {
  "21 Days": 365 / 21,
  Monthly: 12,
  Quarterly: 4,
  "Half-Yearly": 2,
  Yearly: 1,
};

export function calcMaturityValue(amount, percent, tenureDays, frequency) {
  const principal = Number(amount);
  const rate = Number(percent);
  const days = Number(tenureDays);
  if (!principal || !rate || !days) return "";

  const n = COMPOUNDS_PER_YEAR[frequency] ?? 1;
  const years = days / 365;
  const value = principal * Math.pow(1 + rate / 100 / n, n * years);
  return value.toFixed(2);
}

/**
 * exportSvg.js
 *
 * Exports an in-page <svg> element (e.g. the BondCertificate) as a
 * downloadable PNG using a canvas. Kept SVG-based rather than DOM-based
 * (html2canvas etc.) for reliability: no font-loading races, no CSS
 * features that fail to translate to canvas.
 *
 * IMPORTANT — CORS: if `profilePhoto` / `logoUrl` are loaded from a
 * different origin than your app, that origin's server must send
 * `Access-Control-Allow-Origin` for the image, or canvas.toDataURL()
 * will throw a "tainted canvas" SecurityError. Same-origin images
 * (e.g. served from your own /public folder or same API domain) work
 * with no extra config.
 */

export async function svgToPngBlob(
  svgEl,
  { scale = 3, background = "#FFFFFF" } = {},
) {
  if (!svgEl) throw new Error("svgToPngBlob: no SVG element provided");

  const viewBox = svgEl.getAttribute("viewBox");
  let vbWidth = svgEl.clientWidth || 480;
  let vbHeight = svgEl.clientHeight || 800;
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length === 4) {
      vbWidth = parts[2];
      vbHeight = parts[3];
    }
  }

  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", vbWidth);
  clone.setAttribute("height", vbHeight);
  await embedSvgImages(clone);

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(svgUrl);

    const canvas = document.createElement("canvas");
    canvas.width = vbWidth * scale;
    canvas.height = vbHeight * scale;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Canvas export failed")),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Failed to rasterize SVG (check image CORS)"));
    img.src = src;
  });
}

async function embedSvgImages(svgEl) {
  const imageCache = new Map();
  const images = Array.from(svgEl.querySelectorAll("image"));

  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute("href") ||
        image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (!href || href.startsWith("data:")) return;

      if (!imageCache.has(href)) {
        imageCache.set(
          href,
          fetch(href, { mode: "cors", credentials: "omit" }).then(
            async (response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch certificate image (${response.status}): ${href}`,
                );
              }
              const blob = await response.blob();
              if (!blob.type.startsWith("image/")) {
                throw new Error(`Certificate asset is not an image: ${href}`);
              }
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () =>
                  typeof reader.result === "string"
                    ? resolve(reader.result)
                    : reject(
                        new Error(`Could not read certificate image: ${href}`),
                      );
                reader.onerror = () =>
                  reject(
                    new Error(`Could not read certificate image: ${href}`),
                  );
                reader.readAsDataURL(blob);
              });
            },
          ),
        );
      }

      const dataUrl = await imageCache.get(href);
      image.setAttribute("href", dataUrl);
      image.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        dataUrl,
      );
    }),
  );
}

/**
 * Rasterise an <svg> element to a PNG and download it.
 * Same signature the button uses: downloadSvgAsPng(svgEl, filename, { scale }).
 *
 * External images are embedded as data URIs before the SVG is rasterized.
 */
export async function downloadSvgAsPng(
  svgEl,
  filename = "investment-bond",
  { scale = 3, background = "#ffffff" } = {},
) {
  const { width, height } = svgEl.viewBox.baseVal;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  await embedSvgImages(clone);

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(
    new Blob([xml], { type: "image/svg+xml;charset=utf-8" }),
  );

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Could not render SVG to image"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG export failed"))),
        "image/png",
      ),
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function svgToCanvas(svgEl, { scale = 3, background = "#ffffff" } = {}) {
  const { width, height } = svgEl.viewBox.baseVal;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  await embedSvgImages(clone);

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(
    new Blob([xml], { type: "image/svg+xml;charset=utf-8" }),
  );

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Could not render SVG to image"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return { canvas, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadSvgAsPdf(
  svgEl,
  filename = "investment-bond",
  { scale = 3, background = "#ffffff", pageSize = "fit", margin = 24 } = {},
) {
  const { canvas, width, height } = await svgToCanvas(svgEl, {
    scale,
    background,
  });
  const imgData = canvas.toDataURL("image/png");

  let pdf;
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;

  if (pageSize === "a4") {
    // A4 in points; scale image to fit within margins, centered
    pdf = new jsPDF({
      orientation: width > height ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(
      (pageW - margin * 2) / width,
      (pageH - margin * 2) / height,
    );
    w = width * ratio;
    h = height * ratio;
    x = (pageW - w) / 2;
    y = (pageH - h) / 2;
  } else {
    // "fit": the PDF page is exactly the size of the SVG
    pdf = new jsPDF({
      orientation: width > height ? "landscape" : "portrait",
      unit: "px",
      format: [width, height],
      hotfixes: ["px_scaling"],
      compress: true,
    });
  }

  pdf.addImage(imgData, "PNG", x, y, w, h, undefined, "FAST");
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

// NOTE: your file already imports ExcelJS at the top (e.g. `import ExcelJS from "exceljs";`) – keep that line.

// Accepts Date | ISO string | "dd-mm-yyyy" / "dd/mm/yyyy" and returns a Date (or null)
const parseDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const GREY = "FF595959";
const BLUE = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B9BD5" } };
const YELLOW = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
const thin = { style: "thin" };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };
const NUM = '_ * #,##0.00_ ;_ * \\-#,##0.00_ ;_ * "-"??_ ;_ @_ ';
const DATE_FMT = "dd-mm-yyyy";
// Fetches the logo and returns { buffer, extension } (or null if it can't be loaded)
async function loadLogo(logoUrl) {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    const extension = type.includes("jpeg") || type.includes("jpg") ? "jpeg" : "png";
    return { buffer: await res.arrayBuffer(), extension };
  } catch {
    return null;
  }
}

export async function buildLedgerXlsxBuffer({ member, bond, installments, logoUrl }) {
  if (!installments?.length) throw new Error("No installments to export");

  const rate = getSipProfitRate(bond);
  const n = installments.length;
  const rowProfits = installments.map((it, idx) => {
    const deposit = Number(it.paidAmount ?? 0) || 0;
    return (deposit * rate * (n - idx)) / n;
  });
  const totalDeposit = installments.reduce(
    (sum, it) => sum + (Number(it.paidAmount ?? 0) || 0),
    0,
  );
  const totalProfit = rowProfits.reduce((sum, profit) => sum + profit, 0);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.properties.defaultRowHeight = 15;
  ws.columns = [
    { key: "date", width: 13 },
    { key: "days", width: 8 },
    { key: "tenure", width: 13 },
    { key: "deposit", width: 13 },
    { key: "pct", width: 13 },
    { key: "profit", width: 12 },
    { key: "total", width: 15 },
  ];

  // ---------- Title ----------
  ws.mergeCells("A1:G1");
  const title = ws.getCell("A1");
  title.value = "Groow Karo SIP Ledger";
  title.font = { name: "Calibri", bold: true, size: 22, color: { argb: GREY } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  title.fill = BLUE;
  ws.getRow(1).height = 29.1;
  for (let c = 1; c <= 7; c++) ws.getCell(1, c).border = BORDER;

  // ---------- Client info (A:C label, D:E value, F2:G7 logo) ----------
  const info = [
    ["Client Name:", member.name || "", null],
    ["Starting Date:", parseDate(bond.investmentDate), DATE_FMT],
    ["Ending Date:", parseDate(bond.maturityDate), DATE_FMT],
    ["Mobile No.:", member.phone ? Number(member.phone) || member.phone : "", "0"],
    ["Bond No. :", bond.bondNo || "", null],
    ["Tenure:", `${bond.tenureMonths}M`, null],
  ];
  info.forEach(([label, value, fmt], i) => {
    const r = 2 + i;
    ws.mergeCells(`A${r}:C${r}`);
    ws.mergeCells(`D${r}:E${r}`);
    ws.getCell(`A${r}`).value = label;
    ws.getCell(`A${r}`).alignment = { horizontal: "left" };
    ws.getCell(`D${r}`).value = value;
    ws.getCell(`D${r}`).alignment = { horizontal: "center" };
    if (fmt) ws.getCell(`D${r}`).numFmt = fmt;
    for (let c = 1; c <= 5; c++) ws.getCell(r, c).border = BORDER;
  });
  ws.mergeCells("F2:G7");
  for (let r = 2; r <= 7; r++) for (let c = 6; c <= 7; c++) ws.getCell(r, c).border = BORDER;

  const logo = await loadLogo(logoUrl);
  if (logo) {
    const id = wb.addImage(logo);
    ws.addImage(id, {
      tl: { col: 5.15, row: 1.1 },
      ext: { width: 135, height: 118 },
      editAs: "oneCell",
    });
  }

  // ---------- Blue band (A:F) + G ----------
  ws.mergeCells("A8:F8");
  for (let c = 1; c <= 7; c++) {
    ws.getCell(8, c).fill = BLUE;
    ws.getCell(8, c).border = BORDER;
  }

  // ---------- Table header ----------
  const headerRowNo = 9;
  ["Date", "Days", "Tenure Day", "Deposit", "Percentage", "Profit", "Total Blance"].forEach((h, i) => {
    const c = ws.getCell(headerRowNo, i + 1);
    c.value = h;
    c.font = { name: "Calibri", bold: true };
    c.fill = YELLOW;
    c.border = BORDER;
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  // ---------- Rows ----------
  const first = headerRowNo + 1;
  installments.forEach((it, idx) => {
    const r = first + idx;
    const deposit = Number(it.paidAmount ?? 0) || null; // blank until paid
    const cells = [1, 2, 3, 4, 5, 6, 7].map((c) => ws.getCell(r, c));
    cells.forEach((c) => (c.border = BORDER));

    cells[0].value = parseDate(it.installmentDate);
    cells[0].numFmt = DATE_FMT;
    cells[0].alignment = { horizontal: "center" };
    cells[1].value = n - idx; // remaining days: 60 … 1
    cells[2].value = n; // tenure day
    cells[3].value = deposit;
    cells[3].numFmt = NUM;
    cells[4].value = rate;
    cells[4].numFmt = "0.00%";
    cells[5].value = {
      formula: `D${r}*E${r}/C${r}*B${r}`,
      result: rowProfits[idx],
    };
    cells[5].numFmt = NUM;
    cells[5].alignment = { horizontal: "center", vertical: "middle" };
    cells[6].value = {
      formula: `D${r}+F${r}`,
      result: (Number(it.paidAmount ?? 0) || 0) + rowProfits[idx],
    };
    cells[6].numFmt = NUM;
  });

  // ---------- Totals ----------
  const last = first + n - 1;
  const spacer = last + 1;
  const tot = last + 2;
  for (let c = 1; c <= 7; c++) {
    ws.getCell(spacer, c).fill = YELLOW;
    ws.getCell(spacer, c).border = BORDER;
    ws.getCell(tot, c).border = BORDER;
  }
  const put = (col, value, fmt) => {
    const c = ws.getCell(tot, col);
    c.value = value;
    c.font = { name: "Calibri", bold: true };
    if (fmt) c.numFmt = fmt;
  };
  put(3, "Total Deposit");
  put(4, { formula: `SUM(D${first}:D${spacer})`, result: totalDeposit }, NUM);
  put(5, "Total Profit");
  put(6, { formula: `SUM(F${first}:F${spacer})`, result: totalProfit }, NUM);
  put(7, {
    formula: `SUM(G${first}:G${spacer})`,
    result: totalDeposit + totalProfit,
  }, NUM);

  // ---------- Print setup ----------
  ws.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  return wb.xlsx.writeBuffer();
}

export async function downloadLedgerXlsx(
  { member, bond, installments, logoUrl },
  filename = "SIP_Ledger",
) {
  const buffer = await buildLedgerXlsxBuffer({ member, bond, installments, logoUrl });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export const handleCopyCode = (code) => {
  try {
    navigator.clipboard?.writeText(code);
  } catch (e) {
    // ignore
    alert("something went wrong while copping... Try again!");
  }
  // showToast(`Copied "${code}" to clipboard.`);
};
