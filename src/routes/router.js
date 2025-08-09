const express = require('express')
const router = express.Router()
const superCtrl = require('../controller/superadmin/superCtrl')
const loginCtrl = require('../controller/loginCtrl');
const UserCtrl = require('../controller/userCtrl');


//LOGIN
router.route('/login')
  .post(loginCtrl.loginAction);

//SUPERADMIN
router.route('/superadmin')
  .post(superCtrl.simpanSuperAdmin);

//USER
router.route('/findUserByTokenLogin')
  .post(UserCtrl.findUserByTokenLogin);
  


module.exports = router;