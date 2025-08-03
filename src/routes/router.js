const express = require('express')
const router = express.Router()
const superCtrl = require('../controller/superadmin/superCtrl')

//SUPERADMIN
router.route('/superadmin')
  .post(superCtrl.simpanSuperAdmin);


module.exports = router;