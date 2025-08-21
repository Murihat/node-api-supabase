const express = require('express')
const router = express.Router()
const superCtrl = require('../controller/superadmin/superCtrl')
const loginCtrl = require('../controller/loginCtrl');
const UserCtrl = require('../controller/userCtrl');
const planCtrl = require('../controller/planCtrl');
const departmentCtrl = require('../controller/superadmin/departmentCtrl');
const EmployeeLevelCtrl = require('../controller/superadmin/employeeLevelCtrl');
const EmployeeCtrl = require('../controller/superadmin/employeeCtrl');
const { uploadSingleImage } = require('../controller/imageUploadCtrl');



//PLAN SUBSCRIBE
router.route('/plan')
  .get(planCtrl.getAllPlan);

//LOGIN
router.route('/login')
  .post(loginCtrl.loginAction);

//SUPERADMIN
router.route('/superadmin')
  .post(superCtrl.simpanSuperAdmin);

//DEPARTMENT
router.route('/department')
  .get(departmentCtrl.findAllDepartment)
  .put(departmentCtrl.editDepartment)
  .post(departmentCtrl.saveDepartment);

//EMPLOYEE LEVEL
router.route('/employeeLevel')
  .get(EmployeeLevelCtrl.findAllEmployeeLevel)
  .put(EmployeeLevelCtrl.editEmployeeLevel)
  .post(EmployeeLevelCtrl.saveEmployeeLevel);


//EMPLOYEE
router.route('/employee')
  .get(EmployeeCtrl.findAllEmployee)
  .put(uploadSingleImage, EmployeeCtrl.editEmployee)
  .post(uploadSingleImage, EmployeeCtrl.saveEmployee);



//USER
router.route('/findUserByTokenLogin')
  .post(UserCtrl.findUserByTokenLogin);


  


module.exports = router;