const express = require('express');
const router = express.Router();
const companyPlanCtrl = require('../controller/planCtrl');

router.get('/plan', companyPlanCtrl.getAllCompanyPlans);
router.get('/plan:id', companyPlanCtrl.getCompanyPlanById);
router.post('/plan', companyPlanCtrl.createSubscription);

module.exports = router;