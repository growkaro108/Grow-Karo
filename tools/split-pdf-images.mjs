// split-pdf-images.mjs
// Splits a big PDF (one photo per page) into one small, compressed PDF per photo.
//
// Setup:   npm init -y && npm i pdf-to-img sharp pdf-lib
// Run:     node split-pdf-images.mjs input.pdf [outputDir] [quality] [maxWidth]
// Example: node split-pdf-images.mjs photos.pdf out 70 1600

import fs from "node:fs";
import path from "node:path";
import { pdf } from "pdf-to-img";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

// ---------- settings ----------
const INPUT = process.argv[2];
const OUT_DIR = process.argv[3] || "output_pdfs";
const QUALITY = Number(process.argv[4] || 70); // JPEG quality 1-100 (lower = smaller)
const MAX_WIDTH = Number(process.argv[5] || 1600); // px, bigger images are scaled down
const RENDER_SCALE = 2; // render resolution multiplier (2 = about 144 DPI)
const LOG_FILE = path.join(OUT_DIR, "process.log");
// ------------------------------

if (!INPUT || !fs.existsSync(INPUT)) {
  console.error("Usage: node split-pdf-images.mjs <input.pdf> [outputDir] [quality] [maxWidth]");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB";
const kb = (bytes) => (bytes / 1024).toFixed(1) + " KB";

function log(message, level = "INFO") {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`;
  (level === "ERROR" ? console.error : console.log)(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

async function main() {
  const startedAt = Date.now();
  const inputSize = fs.statSync(INPUT).size;
  log(`Input: ${INPUT} (${mb(inputSize)})`);
  log(`Output folder: ${path.resolve(OUT_DIR)} | quality=${QUALITY} maxWidth=${MAX_WIDTH}px`);

  const doc = await pdf(INPUT, { scale: RENDER_SCALE });
  const total = doc.length;
  const padLen = String(total).length;
  log(`Total pages found: ${total}`);

  let done = 0;
  let failed = 0;
  let totalOutBytes = 0;
  let pageNo = 0;

  for await (const pageImage of doc) {
    pageNo++;
    const name = `image_${String(pageNo).padStart(padLen, "0")}.pdf`;
    const outPath = path.join(OUT_DIR, name);

    try {
      const t0 = Date.now();

      // 1) compress: resize + re-encode as JPEG
      const jpeg = await sharp(pageImage)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      // 2) build a single-page PDF sized to the image
      const out = await PDFDocument.create();
      const img = await out.embedJpg(jpeg.data);
      const page = out.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      const bytes = await out.save();

      fs.writeFileSync(outPath, bytes);
      totalOutBytes += bytes.length;
      done++;

      log(
        `(${pageNo}/${total}) ${name} | raw ${kb(pageImage.length)} -> pdf ${kb(bytes.length)} ` +
          `| ${jpeg.info.width}x${jpeg.info.height} | ${Date.now() - t0} ms`
      );
    } catch (err) {
      failed++;
      log(`(${pageNo}/${total}) FAILED page ${pageNo}: ${err.message}`, "ERROR");
    }
  }

  const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
  const saved = inputSize ? (((inputSize - totalOutBytes) / inputSize) * 100).toFixed(1) : "0";
  log("---------------- SUMMARY ----------------");
  log(`Created: ${done} | Failed: ${failed} | Total pages: ${total}`);
  log(`Input size: ${mb(inputSize)} | Output size (all files): ${mb(totalOutBytes)} | Saved: ${saved}%`);
  log(`Time taken: ${secs}s`);
}

main().catch((err) => {
  log(`Fatal error: ${err.stack || err.message}`, "ERROR");
  process.exit(1);
});
