const { supabase } = require('../config/supabase');


// Ambil employee detail dari token
const getEmployeeDetailByToken = async (token) => {
    // Step 1: Cek token di m_login_employee
    const { data: loginData, error: loginError } = await supabase
      .from('m_login_employee')
      .select('employee_id')
      .eq('token', token)
      .single();
  
    if (loginError) throw new Error(`Token tidak valid: ${loginError.message}`);
    if (!loginData) throw new Error('Token tidak ditemukan');
  
    const employee_id = loginData.employee_id;
    if (!employee_id) throw new Error('employee_id tidak ditemukan dalam login');
  
    // Step 2: Get employee detail by employee_id, join ke tb_company & m_employee_level
    const { data: employeeData, error: employeeError } = await supabase
    .from('tb_employee')
    .select(`
      *,
      tb_company:company_id (*),
      m_employee_level:employee_level_id (*)
    `)
    .eq('employee_id', employee_id)
    .single();

    if (employeeError) throw new Error(`Data employee gagal diambil: ${employeeError.message}`);
    if (!employeeData) throw new Error('Data employee tidak ditemukan');
  
    // Step 3: cek apakah employee masih aktif
    if (!employeeData.is_active) throw new Error('Akun karyawan tidak aktif');

    // Destructure data
    const { tb_company, m_employee_level, ...flatEmployee } = employeeData;

    // Tambahkan data relasi ke object utama
    return {
        ...flatEmployee,
        company_name: tb_company?.name || null,
        company_address: tb_company?.address || null,
        employee_level_name: m_employee_level?.level_name || null,
    };
};
  
  
module.exports = {
    getEmployeeDetailByToken,
};