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

module.exports = {
  findUserByEmailAndPassword,
  getActiveTokenByEmployeeId,
  deactivateTokenByLoginId,
  createLoginToken
}
