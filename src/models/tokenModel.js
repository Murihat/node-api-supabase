const { supabase } = require('../config/supabase')

async function validateTokenModel(token) {
  return await supabase
    .from('m_login_employee')
    .select('token_expired_at')
    .eq('token', token)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

async function updateToken(token, is_active = true) {
  try {
    if (!is_active) {
      const { error } = await supabase
        .from('m_login_employee')
        .update({ is_active: false })
        .eq('token', token)
        .eq('is_active', true)

      if (error) throw error
    } else {
      const newExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const { error } = await supabase
        .from('m_login_employee')
        .update({ token_expired_at: newExpiredAt.toISOString() })
        .eq('token', token)
        .eq('is_active', true)

      if (error) throw error
    }

    return true
  } catch (err) {
    console.error('❌ updateToken error:', err.message)
    return false
  }
}

module.exports = { validateTokenModel, updateToken }
