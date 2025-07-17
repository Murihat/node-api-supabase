const { supabase } = require('../config/supabase')

// List all plans
async function getAllPlans() {
  return await supabase.from('tb_company_plan').select('*').order('company_plan_id');
}

// Get plan by ID
async function getPlanById(id) {
  return await supabase.from('tb_company_plan').select('*').eq('company_plan_id', id).single();
}

// Create new plan
async function createPlan(data) {
  return await supabase.from('tb_company_plan').insert([data]).select('*').single();
}

// Update plan
async function updatePlan(id, data) {
  return await supabase.from('tb_company_plan').update(data).eq('company_plan_id', id).select('*').single();
}

// Delete plan
async function deletePlan(id) {
  return await supabase.from('tb_company_plan').delete().eq('company_plan_id', id);
}

async function createCompanySubscription(payload) {
    return await supabase.from('tb_company_subscription').insert([payload]).select('*').single();
}

const getCompanyActiveSubscription = async (company_id) => {
  return await supabase
    .from('tb_company_subscription')
    .select('*')
    .eq('company_id', company_id)
    .eq('is_active', true);
};


module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  createCompanySubscription,
  getCompanyActiveSubscription
};
