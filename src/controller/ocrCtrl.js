const { createWorker } = require("tesseract.js");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Fungsi parsing hasil OCR ke dalam struktur KTP
function parseKTPData(text) {
  const ktpData = {};
  const patterns = {
    provinsi: /PROVINSI\s+([A-Z\s]+)/,
    kabupaten: /KABUPATEN\s+([A-Z\s]+)/,
    nik: /\b\d[\d\s]{14,18}\b/, // toleransi spasi atau OCR artifact
    name: /\b[A-Z\s]+\b/,
    birthPlace: /\b[A-Z\s]+\b/,
    birthDate: /\b\d{2}[- ]\d{2}[- ]\d{4}\b/,
    gender: /\b(LAKI(?:-LAKI)?|PRIA|PEREMPUAN|WANITA)\b/,
    bloodType: /GolDarah\s([A|B|AB|O])/,
    address: /JL\s+([A-Z0-9\s]+)/,
    rtrw: /\b(\d{3})\/(\d{3})\b/,
    village: /\bCIBENTANG\b/,
    district: /\bCISEENG\b/,
    religion: /\bISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA\b/,
    maritalStatus: /\bBELUM KAWIN|KAWIN|CERAI\b/,
    occupation: /\bWIRASWASTA|PEGAWAI\b/,
    nationality: /\bWNI|WNA\b/,
    issueDate: /\b\d{2}-\d{2}-\d{4}\b/,
  };

  ktpData.provinsi = text.split("\n")[0]?.trim();
  ktpData.kabupaten = text.split("\n")[1]?.trim();
  const nikMatch = text.match(patterns.nik);
ktpData.nik = nikMatch ? nikMatch[0].replace(/\s+/g, '') : '';
//   ktpData.nik = (text.match(patterns.nik) || [])[0];
  ktpData.name = text.split("\n")[3]?.trim();
  const birthPlace = text.split("\n")[4]?.trim().match(patterns.birthPlace);
  const birthDate = text.split("\n")[4]?.trim().match(patterns.birthDate);
  ktpData.birthPlace = birthPlace ? birthPlace[0] : "";
  ktpData.birthDate = birthDate ? birthDate[0].replace(/ /g, "-") : "";
  ktpData.gender = (text.match(patterns.gender) || [])[0];
  ktpData.bloodType = (text.match(patterns.bloodType) || [])[1];
  ktpData.address = text.split("\n")[6]?.trim();
  const rtrwMatch = text.match(patterns.rtrw);
  if (rtrwMatch) {
    ktpData.rt = rtrwMatch[1];
    ktpData.rw = rtrwMatch[2];
  }
  ktpData.village = (text.match(patterns.village) || [])[0];
  ktpData.district = (text.match(patterns.district) || [])[0];
  ktpData.religion = (text.match(patterns.religion) || [])[0];
  ktpData.maritalStatus = (text.match(patterns.maritalStatus) || [])[0];
  ktpData.occupation = (text.match(patterns.occupation) || [])[0];
  ktpData.nationality = (text.match(patterns.nationality) || [])[0];
  ktpData.issueDate = (text.match(patterns.issueDate) || [])[0];

  return ktpData;
}

// Controller utama untuk route POST /ocr
const ocrCtrl = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.redirect("/ocr?ocr=" + encodeURIComponent("❌ Tidak ada file yang diunggah."));
    }

    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

    const tempPath = `uploads/temp-${Date.now()}.jpeg`;

    // Proses gambar: resize, crop, grayscale, threshold
    await sharp(file.buffer)
      .resize(1200, 755)
      .extract({ left: 266, top: 5, width: 569, height: 647 })
      .greyscale()
      .threshold(128)
      .toFile(tempPath);

    // Jalankan OCR
    const worker = await createWorker("ind");
    const { data } = await worker.recognize(tempPath);
    await worker.terminate();

    // Cleanup
    fs.unlinkSync(tempPath);

    console.log( JSON.stringify(data.text));

    // Parsing hasil OCR
    const parsed = parseKTPData(data.text);
    const pretty = JSON.stringify(parsed, null, 2);

    // Redirect ke halaman ocr dengan hasil
    // res.redirect(`/ocr?ocr=${encodeURIComponent(pretty)}`);
     res.setHeader('Content-Type', 'application/json');
    res.status(200).send(pretty);

  } catch (err) {
    console.error("OCR Error:", err);
    res.redirect("/ocr?ocr=" + encodeURIComponent("❌ Gagal memproses gambar KTP"));
  }
};

module.exports = { ocrCtrl };
