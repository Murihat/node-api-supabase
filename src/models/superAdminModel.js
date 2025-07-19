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



// Cek level sudah ada
const checkEmployeeLevelExists = async ({ company_id, level_code, level_order }) => {
  const { data, error } = await supabase
    .from('m_employee_level')
    .select('employee_level_id, level_code, level_order')
    .eq('company_id', company_id)
    .or(`level_code.eq.${level_code},level_order.eq.${level_order}`)
    .maybeSingle();

  return { data, error };
};


const insertEmployeeLevel = async ({ company_id, level_name, level_code, level_order }) => {
   const { data, error } = await supabase
    .from('m_employee_level')
    .insert([
      {
        company_id,
        level_name,
        level_code,
        level_order,
      }
    ])
    .select('*') // Supabase .select('*') mengembalikan data setelah insert
    .single();   // ambil hanya 1 record, karena insert 1 row

  return { data, error };
};



// Ambil employee detail dari token
const getEmployeeDetailByToken = async (token) => {
  // Step 1: Cek token di m_login_employee
  const { data: loginData, error: loginError } = await supabase
    .from('m_login_employee')
    .select('employee_id')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (loginError) return { error: `Token tidak valid: ${loginError.message}` };
  if (!loginData) return { error: 'Token tidak ditemukan' };

  const employee_id = loginData.employee_id;
  if (!employee_id) return { error: 'employee_id tidak ditemukan dalam login' };

  // Step 2: Get employee detail + join
  const { data: employeeData, error: employeeError } = await supabase
     .from('tb_employee')
       .select(`*,
          tb_company:company_id (
            company_id,
            name,
            address
          ),
          m_user_status:user_status_id (
            user_status_id,
            status_name,
            status_code
          ),
          m_employee_level:employee_level_id!left (
            employee_level_id,
            level_name,
            level_code
          )
      `)
      .eq('employee_id', employee_id)
      .eq('is_active', true)
      .single();

  if (employeeError) return { error: `Data employee gagal diambil: ${employeeError.message}` };
  if (!employeeData) return { error: 'Data employee tidak ditemukan' };

  if (!employeeData.is_active) return { error: 'Akun karyawan tidak aktif' };

  const {
      tb_company,
      m_employee_level,
      m_user_status,
      ...flatEmployee
    } = employeeData;

    return {
      data: {
        ...flatEmployee,
        company_name: tb_company?.name ?? null,
        company_address: tb_company?.address ?? null,
        employee_level_name: m_employee_level?.level_name ?? null,
        employee_level_code: m_employee_level?.level_code ?? null,
        user_status_name: m_user_status?.status_name ?? null,
        user_status_code: m_user_status?.status_code ?? null,
      }
    };
};


const getEmployeeLevelsByCompany = async (company_id) => {
  const { data, error } = await supabase
    .from('m_employee_level')
    .select('*')
    .eq('company_id', company_id)
    // .eq('is_active', true)
    .order('level_order', { ascending: true });

  return { data, error };
};


const checkDepartmentExists = async (company_id, department_code) => {
  const { data, error } = await supabase
      .from('m_department')
      .select('department_id')
      .eq('company_id', company_id)
      .eq('department_code', department_code)
      .maybeSingle();

    return { data, error };
};


const getDepartmentByCompany = async (company_id) => {
  const { data, error } = await supabase
    .from('m_department')
    .select('*')
    .eq('company_id', company_id)
    // .eq('is_active', true)
    .order('department_id', { ascending: true });

  return { data, error };
};

const insertDepartment = async ({ company_id, department_name, department_code }) => {
   const { data, error } = await supabase
    .from('m_department')
    .insert([
      {
        company_id,
        department_name,
        department_code,
      }
    ])
    .select('*') // Supabase .select('*') mengembalikan data setelah insert
    .single();   // ambil hanya 1 record, karena insert 1 row

  return { data, error };
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
    insertEmployeeLevel,
    getEmployeeDetailByToken,
    checkEmployeeLevelExists,
    getEmployeeLevelsByCompany,
    checkDepartmentExists,
    insertDepartment,
    getDepartmentByCompany,
}
