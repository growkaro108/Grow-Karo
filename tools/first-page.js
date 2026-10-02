
// this will remove all the pages except page no 1 from all pdfs in a folder and save them in another folder
// setup
//  cd /mnt/e/done
// npm init -y
// npm install pdf-lib
// node first-page.js <source_folder> <destination_folder>  eg. node first-page.js ./pdfs ./first-page

const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const inputDir = process.argv[2] || ".";
const outputDir = process.argv[3] || "./first-page";

async function keepFirstPage(inPath, outPath) {
  const bytes = fs.readFileSync(inPath);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });

  if (src.getPageCount() === 0) throw new Error("PDF has no pages");

  // Copy only page 1 into a fresh document (also drops the other pages' data)
  const out = await PDFDocument.create();
  const [firstPage] = await out.copyPages(src, [0]);
  out.addPage(firstPage);

  fs.writeFileSync(outPath, await out.save());
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  console.log(`Found ${files.length} PDF(s)\n`);

  for (const file of files) {
    const inPath = path.join(inputDir, file);
    const outPath = path.join(outputDir, file);

    try {
      await keepFirstPage(inPath, outPath);
      const before = (fs.statSync(inPath).size / 1024).toFixed(0);
      const after = (fs.statSync(outPath).size / 1024).toFixed(0);
      console.log(`${file}: ${before} KB -> ${after} KB`);
    } catch (err) {
      console.error(`Failed: ${file} - ${err.message}`);
    }
  }

  console.log("\nDone!");
}

main();