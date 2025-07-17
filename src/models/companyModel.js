const { supabase } = require('../config/supabase');

// CEK COMPANY BERDASARKAN identity_company, name, email
const checkCompanyExists = async ({ identity_company, name, email }) => {
    const { data, error } = await supabase
      .from('tb_company')
      .select('*')
      .or(`identity_company.eq.${identity_company},name.eq.${name},email.eq.${email}`);
  
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


// CEK SUBSCRIPTION BERDASARKAN company_id
const checkCompanySubscriptionExists = async (company_id) => {
  const { data, error } = await supabase
    .from('tb_company_subscription')
    .select('*')
    .eq('company_id', company_id)
    .eq('is_active', true); // opsional, hanya subscription aktif

  if (error) return { error: `Gagal cek subscription: ${error.message}` };

  if (data.length > 0) {
    return { exists: true, data };
  }

  return { exists: false };
};

// CREATE COMPANY SUBSCRIPTION
const createCompanySubscription = async (subscriptionData) => {
  const { data, error } = await supabase
    .from('tb_company_subscription')
    .insert([subscriptionData])
    .select();

  if (error) return { error: `Gagal membuat subscription: ${error.message}` };
  if (!data || data.length === 0) return { error: 'Data subscription tidak berhasil disimpan' };

  return { data: data[0] };
};

module.exports = {
  checkCompanyExists,
  createCompany,
  checkCompanySubscriptionExists,
  createCompanySubscription,
};
