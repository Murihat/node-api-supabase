const planModel = require('../models/planModel');
const response = require('../helpers/response');

// GET ALL PLANS
async function getAllCompanyPlans(req, res) {
  const { data, error } = await planModel.getAllPlans();
  if (error) return response.successResponse(res, { code: 200, status: false, message: error.message, data: [] });
  return response.successResponse(res, { code: 200, status: true, message: 'List plans', data });
}

// GET BY ID
async function getCompanyPlanById(req, res) {
  const { id } = req.params;
  const { data, error } = await planModel.getPlanById(id);
  if (error || !data) {
    return response.successResponse(res, { code: 200, status: false, message: 'Plan not found', data: {} });
  }
  return response.successResponse(res, { code: 200, status: true, message: 'Plan found', data });
}

// CREATE SUBSCRIPTION
async function createSubscription(req, res) {
  const { company_id, company_plan_id } = req.body;

  const { data: plan, error: planError } = await planModel.getPlanById(company_plan_id);
  if (planError || !plan) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'Plan tidak ditemukan',
      data: {}
    });
  }


  // ✅ Step 2: Cek apakah company sudah punya subscription aktif
  const { data: existingSub, error: subError } = await planModel.getCompanyActiveSubscription(company_id);
  if (subError) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: `Gagal cek subscription: ${subError.message}`,
      data: {}
    });
  }

  if (existingSub && existingSub.length > 0) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'Company sudah memiliki subscription aktif',
      data: {}
    });
  }

  // ✅ Tanggal start & end
  const start_date = new Date();
  const end_date = new Date();
  end_date.setMonth(end_date.getMonth() + 1);

  const formatDate = (date) => date.toISOString().split('T')[0];

  const payload = {
    company_id,
    company_plan_id: plan.company_plan_id,
    start_date: formatDate(start_date),
    end_date: formatDate(end_date),
    is_active: true,
    plan_name: plan.plan_name,
    plan_price: plan.price_month,
    plan_discount: plan.discount,
    max_limit: plan.max_user_limit
  };

  const { data, error } = await planModel.createCompanySubscription(payload);
  if (error) {
    return response.successResponse(res, { code: 200, status: false, message: error.message, data: {} });
  }

  return response.successResponse(res, { code: 200, status: true, message: '✅ Company subscription berhasil dibuat', data });
}


module.exports = {
  getAllCompanyPlans,
  getCompanyPlanById,
  createSubscription,
};
