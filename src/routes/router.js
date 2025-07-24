const express = require('express')
const router = express.Router()
const path = require('path')
const loginCtrl = require('../controller/loginCtrl')
const tokenCtrl = require('../controller/tokenCtrl')
const planCtrl = require('../controller/planCtrl')
const employeeCtrl = require('../controller/employeeCtrl')
const companyCtrl = require('../controller/companyCtrl');
const attendanceCtrl = require('../controller/attendanceCtrl')
const superAdminCtrl = require('../controller/superAdminCtrl')
const nsfwCtrl = require('../controller/nsfwCtrl')
const multer = require('multer')                    // ✅ tambahkan ini
const upload = multer({ storage: multer.memoryStorage() })  // ✅ inisialisasi




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