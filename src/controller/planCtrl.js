const model = require('../models/planModel');
const { successResponse, errorResponse } = require('../helpers/response');

// GET ALL PLANS
async function getAllCompanyPlans(req, res) {
  const { data, error } = await model.getAllPlans();
  if (error) return successResponse(res, { code: 200, status: false, message: error.message, data: [] });
  return successResponse(res, { code: 200, status: true, message: 'List company plans', data });
}

// GET BY ID
async function getCompanyPlanById(req, res) {
  const { id } = req.params;
  const { data, error } = await model.getPlanById(id);
  if (error || !data) {
    return successResponse(res, { code: 200, status: false, message: 'Plan not found', data: {} });
  }
  return successResponse(res, { code: 200, status: true, message: 'Plan found', data });
}

// CREATE SUBSCRIPTION
async function createSubscription(req, res) {
  const { company_id, company_plan_id, start_date, end_date } = req.body;

  const { data: plan, error: planError } = await model.getPlanById(company_plan_id);
  if (planError || !plan) {
    return successResponse(res, { code: 200, status: false, message: 'Plan not found', data: {} });
  }

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
  if (error) return successResponse(res, { code: 200, status: false, message: error.message, data: {} });

  return successResponse(res, { code: 200, status: true, message: 'Company subscription created', data });
}

module.exports = {
  getAllCompanyPlans,
  getCompanyPlanById,
  createSubscription,
};
