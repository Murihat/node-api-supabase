const express = require('express')
const { validateTokenCtrl, updateTokenCtrl } = require('../controller/tokenCtrl')
const router = express.Router()


// validate token
router.post('/validateToken', validateTokenCtrl)

// update token
router.post('/updateToken', updateTokenCtrl)

module.exports = router
