const express = require('express')
const router = express.Router()
const path = require('path')
const multer = require('multer')                   
const upload = multer({ storage: multer.memoryStorage() }) 
const { ocrCtrl } = require('../controller/ocrCtrl');




// Home page (can be optional if already handled in index.js)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/index.html'))
})

// Halaman OCR
router.get('/ocr', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/ocr.html'));
});

// Proses OCR
router.post('/ocr', upload.single('image'), ocrCtrl);

module.exports = router;