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

/**
 * Rasterise an <svg> element to a PNG and download it.
 * Same signature the button uses: downloadSvgAsPng(svgEl, filename, { scale }).
 *
 * External <image href="https://..."> tags are blocked when an SVG is drawn via
 * <img>, so BondCertificate embeds them as data: URIs first (see its
 * data-images-ready attribute). This util only needs to serialise and draw.
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
