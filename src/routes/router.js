const express = require('express')
const router = express.Router()
const loginCtrl = require('../controller/loginCtrl')
const tokenCtrl = require('../controller/tokenCtrl')
const planCtrl = require('../controller/planCtrl')
const employeeCtrl = require('../controller/employeeCtrl')
const companyCtrl = require('../controller/companyCtrl');
const attendanceCtrl = require('../controller/attendanceCtrl')

// token
router.post('/validateToken', tokenCtrl.validateTokenCtrl)
router.post('/updateToken', tokenCtrl.updateTokenCtrl)

// login
router.post('/login', loginCtrl.loginAction)

// employee
router.get('/employeeDetail', employeeCtrl.getEmployeeDetailCtrl);
router.post('/cekemployee', employeeCtrl.cekEmployeeCtrl);
router.post('/insertsuperadmin', employeeCtrl.insertSuperadminCtrl);

// plan
router.get('/plan', planCtrl.getAllCompanyPlans);
router.get('/plan:id', planCtrl.getCompanyPlanById);
router.post('/plan', planCtrl.createSubscription);

// company
router.post('/company/cekcompany', companyCtrl.cekCompanyController);
router.post('/company/create', companyCtrl.createCompanyController);
router.get('/company/ceksubscompany:id', companyCtrl.checkCompanySubscriptionController);
router.post('/company/subscription', companyCtrl.createSubscriptionController);

// attendance
// attendance clock_in / clock_out
router.post('/attendance', attendanceCtrl.attendanceSave);
router.post('/attendance/history', attendanceCtrl.attendanceHistoryCtrl)

module.exports = router;