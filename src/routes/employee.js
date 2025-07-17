const express = require('express')
const router = express.Router()
const employeeCtrl = require('../controller/employeeCtrl');

// GET /employee → ambil semua data employee
router.get('/employeeDetail', employeeCtrl.getEmployeeDetailCtrl);


// cek employee by email
router.post('/cekemployee', employeeCtrl.cekEmployeeCtrl);


module.exports = router
