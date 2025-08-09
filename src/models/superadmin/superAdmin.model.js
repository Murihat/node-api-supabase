const db = require('../../config/mysqli').pool;

const SuperAdminModel = {
  async checkCompanyExists({ identity_company, name, email, identity_owner }, conn) {
    try {
      const [rows] = await (conn || db).query(
        `SELECT * FROM tb_company WHERE identity_company = ? OR name = ? OR email = ? OR identity_owner = ?`,
        [identity_company, name, email, identity_owner]
      );
      return { exists: rows.length > 0, data: rows[0] };
    } catch (error) {
      return { error };
    }
  },

  async createCompany(data, conn) {
    try {
      const [result] = await (conn || db).query(`INSERT INTO tb_company SET ?`, data);
      return { data: { ...data, company_id: result.insertId } };
    } catch (error) {
      return { error };
    }
  },

  async getPlanById(plan_id, conn) {
    try {
      const [rows] = await (conn || db).query(
        `SELECT * FROM tb_company_plan WHERE company_plan_id = ? AND is_active = 1`,
        [plan_id]
      );
      return { data: rows[0] };
    } catch (error) {
      return { error };
    }
  },

  async getCompanyActiveSubscription(company_id, conn) {
    try {
      const [rows] = await (conn || db).query(
        `SELECT * FROM tb_company_subscription WHERE company_id = ? AND is_active = 1`,
        [company_id]
      );
      return { data: rows };
    } catch (error) {
      return { error };
    }
  },

  async createCompanySubscription(data, conn) {
    try {
      const [result] = await (conn || db).query(`INSERT INTO tb_company_subscription SET ?`, data);
      return { data: { ...data, company_subs_id: result.insertId } };
    } catch (error) {
      return { error };
    }
  },

  async insertEmployee(data, conn) {
    try {
      const [result] = await (conn || db).query(`INSERT INTO tb_employee SET ?`, data);
      return { data: { ...data, employee_id: result.insertId } };
    } catch (error) {
      return { error };
    }
  },

  async getCompanySuperAdmin(company_id, conn) {
    try {
      const [rows] = await (conn || db).query(
        `SELECT e.employee_id
         FROM tb_employee e
         JOIN m_employee_level l ON e.employee_level_id = l.employee_level_id
         WHERE e.company_id = ? AND l.level_code = 'super_admin' AND e.is_active = 1
         LIMIT 1`,
        [company_id]
      );
      return { data: rows.length > 0 ? rows[0] : null };
    } catch (error) {
      return { error };
    }
  },

  async getOrCreateEmployeeLevel({ company_id, level_name, level_code }, conn) {
    try {
      // Cek apakah level sudah ada
      const [rows] = await (conn || db).query(
        `SELECT * FROM m_employee_level 
         WHERE company_id = ? AND level_code = ?
         LIMIT 1`,
        [company_id, level_code]
      );

      if (rows.length > 0) {
        return { data: rows[0] };
      }

      // Insert level baru jika belum ada
      const [result] = await (conn || db).query(
        `INSERT INTO m_employee_level (company_id, level_name, level_code, level_order, is_active)
         VALUES (?, ?, ?, 1, 1)`,
        [company_id, level_name, level_code]
      );

      return { data: { employee_level_id: result.insertId, company_id, level_name, level_code } };
    } catch (error) {
      return { error };
    }
  },
};

module.exports = SuperAdminModel;
