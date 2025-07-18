const { supabase } = require('../config/supabase');

// CEK COMPANY BERDASARKAN identity_company, name, email
const checkCompanyExists = async ({ identity_company, name, email, identity_owner }) => {
    const { data, error } = await supabase
        .from('tb_company')
        .select('*')
        .or(`identity_company.eq.${identity_company},name.eq.${name},email.eq.${email},identity_owner.eq.${identity_owner}`);

    if (error) return { error: `Gagal cek data company: ${error.message}` };

    if (data.length > 0) {
        return { exists: true, data };
    }

    return { exists: false };
};

// CREATE COMPANY
const createCompany = async (companyData) => {
  const { data, error } = await supabase
    .from('tb_company')
    .insert([companyData])
    .select();

  if (error) return { error: `Gagal membuat company: ${error.message}` };
  if (!data || data.length === 0) return { error: 'Data company tidak berhasil disimpan' };

  return { data: data[0] };
};

// Get plan by ID
async function getPlanById(id) {
  return await supabase.from('tb_company_plan').select('*').eq('company_plan_id', id).single();
}

// Get plan by getCompanyActiveSubscription
const getCompanyActiveSubscription = async (company_id) => {
  return await supabase
    .from('tb_company_subscription')
    .select('*')
    .eq('company_id', company_id)
    .eq('is_active', true);
};


async function createCompanySubscription(payload) {
    return await supabase.from('tb_company_subscription').insert([payload]).select('*').single();
}


const insertEmployee = async (payload) => {
  return await supabase
    .from('tb_employee')
    .insert(payload)
    .select()
    .single();
};


// deleteCompanyById.
const deleteCompanyById = async (company_id) => {
  return supabase.from('tb_company').delete().eq('company_id', company_id);
};

// deleteActiveSubscriptionByCompany.
const deleteActiveSubscriptionByCompany = async (company_id) => {
  return supabase.from('tb_company_subscription').delete().eq('company_id', company_id).eq('is_active', true);
};

module.exports = { 
    checkCompanyExists,
    createCompany,
    getPlanById,
    getCompanyActiveSubscription, 
    createCompanySubscription,
    insertEmployee,
    deleteCompanyById,
    deleteActiveSubscriptionByCompany,
}
