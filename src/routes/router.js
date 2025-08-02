const express = require('express')
const router = express.Router()
const path = require('path')
const nsfwCtrl = require('../controller/nsfwCtrl')
const multer = require('multer')                   
const upload = multer({ storage: multer.memoryStorage() }) 



// Home page (can be optional if already handled in index.js)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/index.html'))
})

// NSFWJS HTML Page
router.get('/nsfw', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views/nsfwjs.html'));
});

// Upload + classify NSFW
router.post('/upload', upload.single('image'), nsfwCtrl.checkImageNSFW)

module.exports = router;