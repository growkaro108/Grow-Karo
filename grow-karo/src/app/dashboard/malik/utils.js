import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
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

export async function downloadLedgerXlsx(
  { member, bond, installments },
  filename = "SIP_Ledger",
) {
  if (!installments?.length) throw new Error("No installments to export");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("SIP Ledger");
  const DATE_FMT = "dd/mm/yyyy";
  const RUPEE_FMT = '"₹"#,##0';
  ws.columns = [
    { key: "no", width: 8 },
    { key: "installmentDate", width: 18 },
    { key: "dueDate", width: 18 },
    { key: "paidDate", width: 18 },
    { key: "dueAmount", width: 16 },
    { key: "paidAmount", width: 16 },
    { key: "status", width: 14 },
  ];

  // Title
  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = "SIP Installment Ledger";
  ws.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  ws.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
  ws.getRow(1).height = 32;

  ws.mergeCells("A2:G2");
  ws.getCell("A2").value = "Systematic Investment Plan — Payment Record";
  ws.getCell("A2").font = { color: { argb: "FFCBD5E1" } };
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };

  // Member (left) and bond (right) details
  const info = [
    [`Member: ${member.name}`, `Bond No: ${bond.bondNo}`],
    [`Phone: ${member.phone}`, `Monthly Premium: ₹${bond.monthlyPremium}`],
    [`Aadhaar: ${member.aadhaar}`, `Tenure: ${bond.tenureMonths} Months`],
    [
      `Investment Date: ${bond.investmentDate}`,
      `Maturity Date: ${bond.maturityDate}`,
    ],
  ];
  info.forEach(([left, right], i) => {
    const r = 4 + i;
    ws.mergeCells(`A${r}:C${r}`);
    ws.mergeCells(`E${r}:G${r}`);
    ws.getCell(`A${r}`).value = left;
    ws.getCell(`E${r}`).value = right;
    ws.getCell(`E${r}`).alignment = { horizontal: "right" };
  });

  // Table header
  const headerRowNo = 9;
  const headers = [
    "#",
    "Installment Date",
    "Due Date",
    "Paid Date",
    "Due Amount",
    "Paid Amount",
    "Status",
  ];
  const headerRow = ws.getRow(headerRowNo);
  headers.forEach((h, i) => (headerRow.getCell(i + 1).value = h));
  headerRow.height = 22;
  headerRow.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Rows (dates as real Date objects, amounts as numbers)
  const toDate = (d) => (d ? new Date(d) : null);
  installments.forEach((it, idx) => {
    const row = ws.addRow({
      no: it.no ?? idx + 1,
      installmentDate: toDate(it.installmentDate),
      dueDate: toDate(it.dueDate),
      paidDate: toDate(it.paidDate),
      dueAmount: Number(it.dueAmount ?? 0),
      paidAmount: it.paidAmount != null ? Number(it.paidAmount) : null,
      status: it.status,
    });
    ["B", "C", "D"].forEach((col) => (row.getCell(col).numFmt = DATE_FMT));
    ["E", "F"].forEach((col) => (row.getCell(col).numFmt = RUPEE_FMT));
    row.eachCell((c) => (c.alignment = { horizontal: "center" }));

    const paid = String(it.status).toLowerCase() === "paid";
    row.getCell("G").font = {
      bold: true,
      color: { argb: paid ? "FF16A34A" : "FFDC2626" },
    };
    if (paid) {
      row.getCell("D").font = { color: { argb: "FF16A34A" } };
      row.getCell("F").font = { color: { argb: "FF16A34A" } };
    }
    if (idx % 2 === 1) {
      row.eachCell(
        (c) =>
          (c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          }),
      );
    }
  });

  // Totals with live formulas
  const first = headerRowNo + 1;
  const last = headerRowNo + installments.length;
  const totalRow = ws.addRow({});
  const t = totalRow.number;
  ws.getCell(`D${t}`).value = "Total";
  ws.getCell(`E${t}`).value = { formula: `SUM(E${first}:E${last})` };
  ws.getCell(`F${t}`).value = { formula: `SUM(F${first}:F${last})` };
  ws.getCell(`G${t}`).value = { formula: `E${t}-F${t}` };
  ws.getCell(`G${t}`).numFmt = RUPEE_FMT;
  ws.getCell(`E${t}`).numFmt = RUPEE_FMT;
  ws.getCell(`F${t}`).numFmt = RUPEE_FMT;

  const labelRow = ws.addRow({});
  ws.getCell(`D${labelRow.number}`).value = "";
  ws.getCell(`E${labelRow.number}`).value = "Total Due";
  ws.getCell(`F${labelRow.number}`).value = "Total Paid";
  ws.getCell(`G${labelRow.number}`).value = "Balance";

  [totalRow, labelRow].forEach((r) => {
    r.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" },
      };
      c.alignment = { horizontal: "center" };
    });
  });

  // Footer
  const footerNo = labelRow.number + 2;
  ws.mergeCells(`A${footerNo}:G${footerNo}`);
  ws.getCell(`A${footerNo}`).value =
    "Generated by Groww Karo • www.growwkaro.com • +919430050782 • karogroww@gmail.com";
  ws.getCell(`A${footerNo}`).font = { color: { argb: "FF94A3B8" }, size: 9 };
  ws.getCell(`A${footerNo}`).alignment = { horizontal: "center" };

  ws.views = [{ state: "frozen", ySplit: headerRowNo }];

  const buffer = await wb.xlsx.writeBuffer();
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
