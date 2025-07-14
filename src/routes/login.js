const express = require('express')
const { loginCtrl } = require('../controller/loginCtrl')
const router = express.Router()

// login
router.post('/login', loginCtrl)

module.exports = router
