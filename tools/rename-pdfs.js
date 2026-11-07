#!/usr/bin/env node
// work: we have a list of pdf in folder and we want to rename them to the "Full Name" || <Label>  printed inside them (OCR on page 1).
// Rename PDFs to the "Full Name" printed inside them (OCR on page 1).
//
// Setup (Kali/Debian):  sudo apt install -y poppler-utils tesseract-ocr
// Usage:
//  step 1: node rename-pdfs.js <folder>                          # dry run, label "Full Name"
// <<OR>> node rename-pdfs.js <folder> --label "Husband Name"   # use a different field
// step 2: node rename-pdfs.js <folder> --label "S. No." --apply # actually rename
//
// No npm packages needed (Node 18+).

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const li = args.indexOf("--label");
const LABEL = li !== -1 && args[li + 1] ? args[li + 1] : "Full Name";
const dir = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--label");
if (!dir) {
    console.error('Usage: node rename-pdfs.js <folder> [--label "Full Name"] [--apply]');
    process.exit(1);
}
const esc = (t) => t.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
const LABEL_RE = new RegExp(esc(LABEL) + "\\s*[-–—:]*\\s*([^\\n\\r]+)", "i");

// Render page 1 to PNG and OCR it. Returns the recognized text.
function ocrFirstPage(pdfPath) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pdfocr-"));
    try {
        const prefix = path.join(tmp, "page");
        execFileSync("pdftoppm", ["-r", "150", "-f", "1", "-l", "1", "-png", pdfPath, prefix]);
        const png = fs.readdirSync(tmp).find((f) => f.endsWith(".png"));
        if (!png) return "";
        return execFileSync("tesseract", [path.join(tmp, png), "stdout", "--psm", "6"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        });
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

// Pull the value from a line like "<label> - Guriya Soni".
function extractName(text) {
    const m = text.match(LABEL_RE);
    if (!m) return null;
    let name = m[1]
        .replace(/[^A-Za-zऀ-ॿ .'-]/g, " ") // keep letters, Devanagari, space . ' -
        .replace(/\s+/g, " ")
        .trim();
    // Title-case Latin names ("GURIYA SONI" -> "Guriya Soni")
    if (/^[A-Za-z .'-]+$/.test(name)) {
        name = name.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
    }
    return name.length >= 3 ? name : null;
}

// Avoid overwriting: "Name.pdf", "Name (2).pdf", ...
function uniqueTarget(folder, base, ownPath) {
    let candidate = path.join(folder, `${base}.pdf`);
    for (let i = 2; fs.existsSync(candidate) && candidate !== ownPath; i++) {
        candidate = path.join(folder, `${base} (${i}).pdf`);
    }
    return candidate;
}

const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
const report = [];
let ok = 0;

for (const file of files) {
    const from = path.join(dir, file);
    try {
        const name = extractName(ocrFirstPage(from));
        if (!name) {
            console.log(`SKIP  ${file}  (no "${LABEL}" found)`);
            report.push({ file, status: "skipped" });
            continue;
        }
        const to = uniqueTarget(dir, name, from);
        if (to === from) {
            console.log(`OK    ${file}  (already named)`);
            continue;
        }
        console.log(`${APPLY ? "RENAME" : "WOULD"} ${file}  ->  ${path.basename(to)}`);
        if (APPLY) fs.renameSync(from, to);
        report.push({ file, status: "renamed", to: path.basename(to) });
        ok++;
    } catch (e) {
        console.log(`ERROR ${file}  (${e.message.split("\n")[0]})`);
        report.push({ file, status: "error" });
    }
}

console.log(`\n${ok}/${files.length} ${APPLY ? "renamed" : "can be renamed"}.` +
    (APPLY ? "" : " Re-run with --apply to rename."));
fs.writeFileSync(path.join(dir, "rename-report.json"), JSON.stringify(report, null, 2));