const db = require('../../config/mysqli').pool;

const EmployeeModel = {
  // Cari satu karyawan unik (misal by company_id + email atau name + phone; silakan sesuaikan kebutuhan)
  async findEmployeeSingle(company_id, { email = null, employee_code = null, name = null } = {}) {
    const whereParts = ['company_id = ?'];
    const params = [company_id];

    if (email) {
      whereParts.push('email = ?');
      params.push(email);
    }
    if (employee_code) {
      whereParts.push('employee_code = ?');
      params.push(employee_code);
    }
    if (name) {
      whereParts.push('name = ?');
      params.push(name);
    }

    const whereClause = `WHERE ${whereParts.join(' AND ')}`;

    const query = `
      SELECT 
        employee_id, employee_code, name, email, phone, identity_card, picture,
        job_title, is_active, join_date, end_date,
        company_id, employee_level_id, department_id,
        created_at, updated_at
      FROM tb_employee
      ${whereClause}
      ORDER BY created_at ASC
      LIMIT 1
    `;

    try {
      const [rows] = await db.query(query, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ EmployeeModel.findEmployeeSingle error:', error);
      return { error };
    }
  },

  // Insert karyawan baru
  // Catatan: password sebaiknya sudah di-hash di layer service sebelum dipassing ke model ini.
  async insertEmployee(companyId, payload) {
    const {
        company_id = companyId,
        employee_code = null,
        name,
        email,
        phone = null,
        identity_card = null,
        picture = null,
        job_title = null,
        is_active = 1,
        join_date = null,
        end_date = null,
        password, // hashed!
        employee_level_id = null,
        department_id = null,
    } = payload;

    const insertQuery = `
      INSERT INTO tb_employee (
        employee_code, name, email, phone, identity_card, picture, job_title,
        is_active, join_date, end_date, password,
        company_id, department_id, employee_level_id, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      employee_code, name, email, phone, identity_card, picture, job_title,
      is_active, join_date, end_date, password,
      company_id, department_id, employee_level_id
    ];

    try {
      const [result] = await db.query(insertQuery, params);

      const [rows] = await db.query(
        `
        SELECT 
          employee_id, employee_code, name, email, phone, identity_card, picture,
          job_title, is_active, join_date, end_date,
          company_id, employee_level_id, department_id,
          created_at, updated_at
        FROM tb_employee
        WHERE employee_id = ?
        LIMIT 1
        `,
        [result.insertId]
      );

      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('❌ EmployeeModel.insertEmployee error:', error);
      return { error };
    }
  },

  // List dengan search/sort/paging
  async findAllEmployee(
    company_id,
    {
        search = '',
        sortBy = 'created_at', // aman karena di-map ke alias kolom di SORT_MAP
        sortDir = 'ASC',       // hanya ASC/DESC
        limit = 10,
        offset = 0,
        activeOnly = false,    // hanya employee aktif (opsional)
    } = {}
    ) {
    // Whitelist kolom untuk ORDER BY
    const SORT_MAP = {
        created_at: 'e.created_at',
        updated_at: 'e.updated_at',
        name: 'e.name',
        email: 'e.email',
        employee_code: 'e.employee_code',
        job_title: 'e.job_title',
        is_active: 'e.is_active',
        join_date: 'e.join_date',
        end_date: 'e.end_date',
        // kolom dari join:
        level_name: 'el.level_name',
        level_order: 'el.level_order',
        department_name: 'd.department_name',
        company_name: 'c.name'
    };
    const sortCol = SORT_MAP[sortBy] || SORT_MAP.created_at;
    const sortDirection = (String(sortDir).toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    const whereParts = ['e.company_id = ?'];
    const params = [company_id];

    if (activeOnly) {
        whereParts.push('e.is_active = 1');
    }

    if (search) {
        // cari juga di level_name & department_name
        whereParts.push(`(
        e.name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ? OR
        e.job_title LIKE ? OR e.phone LIKE ? OR e.identity_card LIKE ? OR
        el.level_name LIKE ? OR d.department_name LIKE ?
        )`);
        const kw = `%${search}%`;
        params.push(kw, kw, kw, kw, kw, kw, kw, kw);
    }

    const whereClause = `WHERE ${whereParts.join(' AND ')}`;

    const query = `
        SELECT
        e.employee_id,
        e.employee_code,
        e.name,
        e.email,
        e.phone,
        e.identity_card,
        e.picture,
        e.job_title,
        e.is_active,
        e.join_date,
        e.end_date,
        e.company_id,
        e.employee_level_id,
        e.department_id,
        e.created_at,
        e.updated_at,
        -- dari join employee level
        el.level_name,
        el.level_code,
        el.level_order,
        -- dari join department
        d.department_name,
        d.department_code,
        -- dari join company
        c.name AS company_name
        FROM tb_employee e
        INNER JOIN tb_company c
        ON c.company_id = e.company_id
        LEFT JOIN m_employee_level el
        ON el.employee_level_id = e.employee_level_id
        AND el.company_id = e.company_id
        LEFT JOIN m_department d
        ON d.department_id = e.department_id
        AND d.company_id = e.company_id
        ${whereClause}
        ORDER BY ${sortCol} ${sortDirection}
        LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));

    try {
        const [rows] = await db.query(query, params);
        return rows;
    } catch (error) {
        console.error('❌ EmployeeModel.findAllEmployee (joined) error:', error);
        throw error;
    }
    },


  // Hitung total (untuk paging)
  async countEmployee(company_id, { search = '', activeOnly = false } = {}) {
    const whereParts = ['company_id = ?'];
    const params = [company_id];

    if (activeOnly) {
      whereParts.push('is_active = 1');
    }

    if (search) {
      whereParts.push(`(
        name LIKE ? OR email LIKE ? OR employee_code LIKE ? OR
        job_title LIKE ? OR phone LIKE ? OR identity_card LIKE ?
      )`);
      const kw = `%${search}%`;
      params.push(kw, kw, kw, kw, kw, kw);
    }

    const whereClause = `WHERE ${whereParts.join(' AND ')}`;

    const query = `
      SELECT COUNT(1) AS total
      FROM tb_employee
      ${whereClause}
    `;

    try {
      const [rows] = await db.query(query, params);
      return rows?.[0]?.total ?? 0;
    } catch (error) {
      console.error('❌ EmployeeModel.countEmployee error:', error);
      throw error;
    }
  },

  // Detail by id + company
    async findEmployeeById(employee_id, company_id) {
        const query = `
            SELECT
            e.employee_id,
            e.employee_code,
            e.name,
            e.email,
            e.phone,
            e.identity_card,
            e.picture,
            e.job_title,
            e.is_active,
            e.join_date,
            e.end_date,
            e.company_id,
            e.employee_level_id,
            e.department_id,
            e.created_at,
            e.updated_at,
            -- dari join employee level
            el.level_name,
            el.level_code,
            el.level_order,
            -- dari join department
            d.department_name,
            d.department_code,
            -- dari join company
            c.name AS company_name
            FROM tb_employee e
            INNER JOIN tb_company c
            ON c.company_id = e.company_id
            LEFT JOIN m_employee_level el
            ON el.employee_level_id = e.employee_level_id
            AND el.company_id = e.company_id
            LEFT JOIN m_department d
            ON d.department_id = e.department_id
            AND d.company_id = e.company_id
            WHERE e.employee_id = ? AND e.company_id = ?
            LIMIT 1
        `;

        try {
            const [rows] = await db.query(query, [employee_id, company_id]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('❌ EmployeeModel.findEmployeeById (joined) error:', error);
            return { error };
        }
    },


  // Update by id + company (tanpa ubah password — sediakan method terpisah jika perlu)
  async updateEmployeeById(employee_id, company_id, payload = {}) {
    // whitelist kolom yang boleh diupdate
    const allow = [
      'employee_code', 'name', 'email', 'phone', 'identity_card', 'picture',
      'job_title', 'is_active', 'join_date', 'end_date',
      'employee_level_id', 'department_id'
    ];

    const sets = [];
    const params = [];

    for (const key of allow) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        sets.push(`${key} = ?`);
        params.push(payload[key]);
      }
    }

    if (sets.length === 0) {
      return null; // tidak ada perubahan
    }

    const updateQuery = `
      UPDATE tb_employee
      SET ${sets.join(', ')}, updated_at = NOW()
      WHERE employee_id = ? AND company_id = ?
    `;

    params.push(employee_id, company_id);

    try {
      const [result] = await db.query(updateQuery, params);
      if (result.affectedRows === 0) return null;

      const [rows] = await db.query(
        `
        SELECT 
          employee_id, employee_code, name, email, phone, identity_card, picture,
          job_title, is_active, join_date, end_date,
          company_id, employee_level_id, department_id,
          created_at, updated_at
        FROM tb_employee
        WHERE employee_id = ? AND company_id = ?
        LIMIT 1
        `,
        [employee_id, company_id]
      );

      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('❌ EmployeeModel.updateEmployeeById error:', error);
      return { error };
    }
  },

  // (Opsional) Update password (hash sudah diproses di layer service)
  async updateEmployeePassword(employee_id, company_id, hashedPassword) {
    const query = `
      UPDATE tb_employee
      SET password = ?, updated_at = NOW()
      WHERE employee_id = ? AND company_id = ?
    `;
    try {
      const [result] = await db.query(query, [hashedPassword, employee_id, company_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ EmployeeModel.updateEmployeePassword error:', error);
      return { error };
    }
  },

  // (Opsional) Soft delete: set is_active = 0
  async deactivateEmployeeById(employee_id, company_id) {
    const query = `
      UPDATE tb_employee
      SET is_active = 0, updated_at = NOW()
      WHERE employee_id = ? AND company_id = ?
    `;
    try {
      const [result] = await db.query(query, [employee_id, company_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ EmployeeModel.deactivateEmployeeById error:', error);
      return { error };
    }
  },

  // (Opsional) Hard delete
  async deleteEmployeeById(employee_id, company_id) {
    const query = `
      DELETE FROM tb_employee
      WHERE employee_id = ? AND company_id = ?
    `;
    try {
      const [result] = await db.query(query, [employee_id, company_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('❌ EmployeeModel.deleteEmployeeById error:', error);
      return { error };
    }
  },
};

module.exports = EmployeeModel;
