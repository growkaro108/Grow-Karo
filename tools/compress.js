// you need linux or wsl for this script
// install: sudo apt install ghostscript
//maks sure you have all pdf in one folder and run this script with
//  node compress.js <input_folder> <output_folder> <quality>  eg. node compress.js ./pdfs ./compressed ebook




const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const run = promisify(execFile);

const inputDir = process.argv[2] || "./pdfs";
const outputDir = process.argv[3] || "./compressed";
const quality = process.argv[4] || "ebook"; // screen | ebook | printer
const gs = process.platform === "win32" ? "gswin64c" : "gs";

async function compressAll() {
  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  console.log(`Found ${files.length} PDF(s)\n`);

  for (const file of files) {
    const inPath = path.join(inputDir, file);
    const outPath = path.join(outputDir, file);

    try {
      await run(gs, [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        `-dPDFSETTINGS=/${quality}`,
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${outPath}`,
        inPath,
      ]);

      const before = fs.statSync(inPath).size;
      let after = fs.statSync(outPath).size;

      // Keep the original if compression made it bigger
      if (after >= before) {
        fs.copyFileSync(inPath, outPath);
        after = before;
      }

      const saved = (((before - after) / before) * 100).toFixed(1);
      console.log(
        `${file}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (saved ${saved}%)`
      );
    } catch (err) {
      console.error(`Failed: ${file} - ${err.message}`);
    }
  }
  console.log("\nDone!");
}

compressAll();