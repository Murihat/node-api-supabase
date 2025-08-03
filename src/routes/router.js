const express = require('express')
const router = express.Router()
const superCtrl = require('../controller/superadmin/superCtrl')
const loginCtrl = require('../controller/loginCtrl')



//LOGIN
router.route('/login')
  .post(loginCtrl.loginAction);

//SUPERADMIN
router.route('/superadmin')
  .post(superCtrl.simpanSuperAdmin);

  


module.exports = router;