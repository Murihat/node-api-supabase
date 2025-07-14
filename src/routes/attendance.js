const express = require('express')
const { attendanceCtrl, attendanceHistoryCtrl } = require('../controller/attendanceCtrl')
const router = express.Router()

// attendance clock-in / clock-out
router.post('/attendance', attendanceCtrl);


// attendance history
router.post('/attendance/history', attendanceHistoryCtrl)


module.exports = router
