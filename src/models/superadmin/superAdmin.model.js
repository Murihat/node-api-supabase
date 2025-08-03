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

  async deleteCompany(company_id, conn) {
    try {
      await (conn || db).query(`DELETE FROM tb_company WHERE company_id = ?`, [company_id]);
      return {};
    } catch (error) {
      return { error };
    }
  },

  async deleteCompanySubscription(company_id, conn) {
    try {
      await (conn || db).query(`DELETE FROM tb_company_subscription WHERE company_id = ?`, [company_id]);
      return {};
    } catch (error) {
      return { error };
    }
  },

  async getAllSuperadmins(conn) {
    try {
      const [rows] = await (conn || db).query(`SELECT * FROM tb_employee WHERE user_status = 1`);
      return { data: rows };
    } catch (error) {
      return { error };
    }
  },

  async getSuperadminById(id, conn) {
    try {
      const [rows] = await (conn || db).query(
        `SELECT * FROM tb_employee WHERE employee_id = ? AND user_status = 1`,
        [id]
      );
      return { data: rows[0] };
    } catch (error) {
      return { error };
    }
  },

  async updateSuperadminById(id, data, conn) {
    try {
      await (conn || db).query(
        `UPDATE tb_employee SET ? WHERE employee_id = ? AND user_status = 1`,
        [data, id]
      );
      return { data: { ...data, employee_id: id } };
    } catch (error) {
      return { error };
    }
  },

  async deleteSuperadminById(id, conn) {
    try {
      await (conn || db).query(`DELETE FROM tb_employee WHERE employee_id = ? AND user_status = 1`, [id]);
      return {};
    } catch (error) {
      return { error };
    }
  },
};

module.exports = SuperAdminModel;
