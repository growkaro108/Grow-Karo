export function currency(n) {
  if (typeof n !== "number") {
    return "₹0";
  }
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
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

  clone.querySelectorAll("image").forEach((img) => {
    img.setAttribute("crossorigin", "anonymous");
  });

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

export async function downloadSvgAsPng(svgEl, filename, opts) {
  const blob = await svgToPngBlob(svgEl, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
