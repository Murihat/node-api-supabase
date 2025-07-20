const express = require('express')
const router = express.Router()
const loginCtrl = require('../controller/loginCtrl')
const tokenCtrl = require('../controller/tokenCtrl')
const planCtrl = require('../controller/planCtrl')
const employeeCtrl = require('../controller/employeeCtrl')
const companyCtrl = require('../controller/companyCtrl');
const attendanceCtrl = require('../controller/attendanceCtrl')
const superAdminCtrl = require('../controller/superAdminCtrl')


// token
router.post('/validateToken', tokenCtrl.validateTokenCtrl)
router.post('/updateToken', tokenCtrl.updateTokenCtrl)

// login
router.post('/login', loginCtrl.loginAction)

// superadmin
router.post('/saveSuperadmin', superAdminCtrl.saveSuperadminCtrl)
router.post('/saveEmployeeLevel', superAdminCtrl.insertEmployeeLevelCtrl)
router.get('/getEmployeeLevel', superAdminCtrl.getEmployeeLevelsCtrl)
router.post('/saveDepartment', superAdminCtrl.insertDepartmentCtrl)
router.get('/getDepartment', superAdminCtrl.getDepartmentsCtrl)
router.post('/saveEmployee', superAdminCtrl.insertEmployeeCtrl)
router.get('/getEmployee', superAdminCtrl.getEmployeeListCtrl)


// employee
router.get('/employeeDetail', employeeCtrl.getEmployeeDetailCtrl);
router.post('/cekemployee', employeeCtrl.cekEmployeeCtrl);
router.get('/getAllEmployee', employeeCtrl.getEmployeeListCtrl);


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