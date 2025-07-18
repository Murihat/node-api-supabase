const { supabase } = require('../config/supabase')

async function findUserByEmailAndPassword(email, hashedPassword) {
  const { data, error } = await supabase
    .from('tb_employee')
    .select()
    .eq('email', email)
    .eq('password', hashedPassword)
    .maybeSingle()

  return error ? null : data
}

async function getActiveTokenByEmployeeId(employeeId) {
  const { data, error } = await supabase
    .from('m_login_employee')
    .select('login_id')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .maybeSingle()

  return error ? null : data
}

async function deactivateTokenByLoginId(loginId) {
  const { error } = await supabase
    .from('m_login_employee')
    .update({ is_active: false })
    .eq('login_id', loginId)

  return !error
}

async function createLoginToken(employeeId, token, expiredAt) {
  const { error } = await supabase.from('m_login_employee').insert({
    employee_id: employeeId,
    token,
    token_expired_at: expiredAt.toISOString(),
    is_active: true
  })

  return !error
}

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
      m_employee_level:employee_level_id (
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

  const { tb_company, m_employee_level, ...flatEmployee } = data;

  return {
    data: {
      ...flatEmployee,
      company_name: tb_company?.name || null,
      company_address: tb_company?.address || null,
      employee_level_name: m_employee_level?.level_name || null,
      employee_level_code: m_employee_level?.level_code || null,
    }
  };
}

module.exports = {
  findUserByEmailAndPassword,
  getActiveTokenByEmployeeId,
  deactivateTokenByLoginId,
  createLoginToken,
  getEmployeeRoleByEmail,
}
