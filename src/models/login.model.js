const db = require('../config/mysqli').pool; // sesuaikan path ini dengan konfigurasi koneksi database kamu

const loginModel = {
  async findUserByEmailAndPassword(email, hashedPassword) {
    const query = `
      SELECT * FROM tb_employee 
      WHERE email = ? AND password = ? 
      LIMIT 1
    `;
    try {
      const [rows] = await db.query(query, [email, hashedPassword]);
      return rows[0] || null;
    } catch (err) {
      console.error('❌ findUserByEmailAndPassword error:', err);
      return null;
    }
  },

  async getEmployeeLevel(company_id, employee_level_id) {
    const query = `
      SELECT * FROM m_employee_level 
      WHERE company_id = ? AND employee_level_id = ? 
      LIMIT 1
    `;
    try {
      const [rows] = await db.query(query, [company_id, employee_level_id]);
      return rows[0] || null;
    } catch (err) {
      console.error('❌ getEmployeeLevel error:', err);
      return null;
    }
  },

  async getActiveTokenByEmployeeId(employeeId) {
    const query = `
      SELECT * FROM m_login_token 
      WHERE employee_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    try {
      const [rows] = await db.query(query, [employeeId]);
      return rows[0] || null;
    } catch (err) {
      console.error('❌ getActiveTokenByEmployeeId error:', err);
      return null;
    }
  },

  async deactivateTokenByLoginId(loginId) {
    const query = `
      UPDATE m_login_token 
      SET is_active = 0, updated_at = NOW() 
      WHERE login_id = ?
    `;
    try {
      const [result] = await db.query(query, [loginId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('❌ deactivateTokenByLoginId error:', err);
      return false;
    }
  },

  async createLoginTokenWithMeta({
    employee_id,
    token,
    token_expired_at,
    ip_address,
    user_agent,
    platform,
    accept_language,
    headers_json,
  }) {
    const query = `
      INSERT INTO m_login_token 
      (employee_id, token, token_expired_at, is_active, ip_address, user_agent, platform, accept_language, headers_json, created_at)
      VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      employee_id,
      token,
      token_expired_at,
      ip_address,
      user_agent,
      platform,
      accept_language,
      headers_json,
    ];
    try {
      const [result] = await db.query(query, values);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('❌ createLoginTokenWithMeta error:', err);
      return false;
    }
  },
};

module.exports = loginModel;
