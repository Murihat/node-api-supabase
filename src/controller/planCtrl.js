const model = require('../models/planModel');

async function getAllCompanyPlans(req, res) {
  const { data, error } = await model.getAllPlans();
  if (error) return res.status(500).json({ status: false, message: error.message });
  res.json({ status: true, message: 'List company plans', data });
}

async function getCompanyPlanById(req, res) {
  const { id } = req.params;
  const { data, error } = await model.getPlanById(id);
  if (error) return res.status(404).json({ status: false, message: 'Plan not found' });
  res.json({ status: true, data });
}


async function createSubscription(req, res) {
    const { company_id, company_plan_id, start_date, end_date } = req.body;
  
    // 1. Ambil detail plan
    const { data: plan, error: planError } = await model.getPlanById(company_plan_id);
    if (planError || !plan) return res.status(404).json({ status: false, message: 'Plan not found' });
  
    // 2. Insert ke subscription
    const payload = {
      company_id,
      company_plan_id,
      start_date,
      end_date,
      is_active: true,
      plan_name: plan.plan_name,
      plan_price: plan.price_month,
      plan_discount: plan.discount,
      max_limit: plan.max_user_limit
    };
  
    const { data, error } = await model.createCompanySubscription(payload);
    if (error) return res.status(500).json({ status: false, message: error.message });
  
    return res.json({ status: true, message: 'Company subscription created', data });
}
  

module.exports = {
  getAllCompanyPlans,
  getCompanyPlanById,
  createSubscription, 
};
