const { supabase } = require('../config/supabase');

const getEmployeeByEmail = async (email) => {
  const { data, error } = await supabase
    .from('tb_employee')
    .select('employee_id')
    .eq('email', email);

  if (error) {
    return { error: `Gagal mendapatkan employee: ${error.message}`};
  }

  if (data.length > 0) {
    return { error: "Employee sudah terdaftar"};
  }

  return { error: null };
};

async function getEmployeeRoleByEmail(email) {
  const { data, error } = await supabase
    .from('tb_employee')
    .select(`
      *,
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
      m_employee_level:employee_level_id!left  (
        employee_level_id,
        level_name,
        level_code
      )
    `)
    .eq('email', email)
    .single();

  if (error) return { error: `Data employee gagal diambil: ${error.message}` };
  if (!data) return { error: 'Data employee tidak ditemukan' };
  if (!data.is_active) return { error: 'Akun karyawan tidak aktif' };

  const {
    tb_company,
    m_employee_level,
    m_user_status,
    ...flatEmployee
  } = data;

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
}


// Ambil employee detail dari token
const getEmployeeDetailByToken = async (token) => {
    // Step 1: Cek token di m_login_employee
    const { data: loginData, error: loginError } = await supabase
      .from('m_login_employee')
      .select('employee_id')
      .eq('token', token)
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
  

const insertEmployee = async (payload) => {
  return await supabase
    .from('tb_employee')
    .insert(payload)
    .select()
    .single();
};



const getEmployeeListByCompany = async (company_id) => {
  try {
    const { data, error } = await supabase
      .from('tb_employee')
      .select(`
        *,
        tb_company:company_id (
          company_id,
          name,
          address
        ),
        m_employee_level:employee_level_id!left (
          employee_level_id,
          level_name,
          level_code
        ),
        m_department:department_id!left (
          department_id,
          department_name,
          department_code
        )
      `)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .neq('user_status_id', 1) // ✅ Exclude super_admin
      .order('created_at', { ascending: false });

    if (error) throw error;

    const employeeList = data.map(item => {
      const {
        tb_company,
        m_employee_level,
        m_department,
        ...flatEmployee
      } = item;

      return {
        ...flatEmployee,
        company_name: tb_company?.name ?? null,
        company_address: tb_company?.address ?? null,
        employee_level_name: m_employee_level?.level_name ?? null,
        employee_level_code: m_employee_level?.level_code ?? null,
        department_name: m_department?.department_name ?? null,
        department_code: m_department?.department_code ?? null,
      };
    });

    return { data: employeeList, error: null };

  } catch (error) {
    console.error('❌ Error getEmployeeListByCompany:', error.message);
    return { data: null, error };
  }
};
  
module.exports = {
    getEmployeeDetailByToken,
    getEmployeeByEmail,
    getEmployeeRoleByEmail,
    insertEmployee,
    getEmployeeListByCompany,
};