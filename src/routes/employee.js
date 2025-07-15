const express = require('express')
const router = express.Router()
const { getEmployeeDetailCtrl } = require('../controller/employeeCtrl')

// GET /employee → ambil semua data employee
router.get('/employeeDetail', getEmployeeDetailCtrl);

module.exports = router
