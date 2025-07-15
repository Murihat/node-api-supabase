const { supabase } = require('../config/supabase');


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
      .select(`
        *,
        tb_company:company_id (company_id, name, address),
        m_employee_level:employee_level_id (employee_level_id, level_name)
      `)
      .eq('employee_id', employee_id)
      .single();
  
    if (employeeError) return { error: `Data employee gagal diambil: ${employeeError.message}` };
    if (!employeeData) return { error: 'Data employee tidak ditemukan' };
  
    if (!employeeData.is_active) return { error: 'Akun karyawan tidak aktif' };
  
    const { tb_company, m_employee_level, ...flatEmployee } = employeeData;
  
    return {
      data: {
        ...flatEmployee,
        company_name: tb_company?.name || null,
        company_address: tb_company?.address || null,
        employee_level_name: m_employee_level?.level_name || null,
      }
    };
  };
  
  
module.exports = {
    getEmployeeDetailByToken,
};