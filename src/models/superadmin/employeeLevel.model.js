const db = require('../../config/mysqli').pool;

const EmployeeLevelModel = {
    async findEmployeeLevelSingle(company_id, level_name, level_code ) {
        const query = `
            SELECT * 
            FROM m_employee_level 
            WHERE company_id = ? 
            AND level_name = ? 
            AND level_code = ?  
            ORDER BY created_at ASC
            LIMIT 1
        `;

        try {
            const [rows] = await db.query(query, [company_id, level_name, level_code]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ findEmployeeLevelSingle error:', error);
            return { error };
        }
    },

    async insertEmployeeLevel(company_id, level_name, level_code) {
        // const insertQuery = `
        //     INSERT INTO m_employee_level (company_id, level_name, level_code, level_order, is_active, created_at)
        //     VALUES (?, ?, ?, COALESCE(MAX(level_order), 0) + 1, 1, NOW())
        // `;

       const insertQuery = `INSERT INTO m_employee_level
                            (company_id, level_name, level_code, level_order, is_active, created_at)
                            SELECT ?, ?, ?, COALESCE(MAX(level_order), 0) + 1, 1, NOW()
                            FROM m_employee_level
                        `;

        try {
            // 1. Insert data baru
            const [result] = await db.query(insertQuery, [
                company_id,
                level_name,
                level_code
          ]);

            // 2. Ambil data yang baru diinsert
            const [newData] = await db.query(
                `SELECT * FROM m_employee_level WHERE employee_level_id = ? LIMIT 1`,
                [result.insertId]
            );

            return newData.length > 0 ? newData[0] : null;
        } catch (error) {
            console.error('❌ insertEmployeeLevel error:', error);
            return { error };
        }
    },

    async findAllEmployeeLevel(company_id, { search = '', sortBy = 'created_at', sortDir = 'ASC', limit = 10, offset = 0 } = {}) {
        // Build WHERE
        const whereParts = ['company_id = ?'];
        const params = [company_id];

        if (search) {
            whereParts.push('(level_name LIKE ? OR level_code LIKE ?)');
            const kw = `%${search}%`;
            params.push(kw, kw);
        }

        // Whitelist sortBy handled in controller; sortDir already sanitized (ASC/DESC)
        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        const query = `
                        SELECT 
                            employee_level_id,
                            level_name,
                            level_code,
                            level_order,
                            is_active,
                            created_at
                        FROM m_employee_level
                        ${whereClause}
                        ORDER BY ${sortBy} ${sortDir}
                        LIMIT ? OFFSET ?
                    `;

        params.push(Number(limit), Number(offset));

        try {
            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            console.error('❌ findAllEmployeeLevel error:', error);
            throw error;
        }
    },

    async countEmployeeLevel(company_id, { search = '' } = {}) {
        const whereParts = ['company_id = ?'];
        const params = [company_id];

        if (search) {
            whereParts.push('(level_name LIKE ? OR level_code LIKE ?)');
            const kw = `%${search}%`;
            params.push(kw, kw);
        }

        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        const query = `
                        SELECT COUNT(1) AS total
                        FROM m_employee_level
                        ${whereClause}
                    `;

        try {
            const [rows] = await db.query(query, params);
            return rows?.[0]?.total ?? 0;
        } catch (error) {
            console.error('❌ countEmployeeLevel error:', error);
            throw error;
        }
    },


     async findEmployeeLevelById(employee_level_id, company_id) {
        const query = `
            SELECT * 
            FROM m_employee_level 
            WHERE employee_level_id = ? 
            AND company_id = ? 
            ORDER BY created_at ASC
            LIMIT 1
        `;

        try {
            const [rows] = await db.query(query, [employee_level_id, company_id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ findEmployeeLevelById error:', error);
            return { error };
        }
    },

    async existsLevelOrder(company_id, level_order, exclude_employee_level_id = null) {
        const baseSql = `
            SELECT 1
            FROM m_employee_level
            WHERE company_id = ?
            AND level_order = ?
            ${exclude_employee_level_id ? 'AND employee_level_id <> ?' : ''}
            LIMIT 1
        `;
        const params = exclude_employee_level_id
            ? [company_id, level_order, exclude_employee_level_id]
            : [company_id, level_order];

        const [rows] = await db.query(baseSql, params);
        return rows.length > 0;
    },



    async updateEmployeeLevelById(employee_level_id, company_id, level_name, level_code, level_order, is_active) {
        const updateQuery = `
            UPDATE m_employee_level 
            SET 
                level_name = ?,
                level_code = ?,
                level_order = ?,
                is_active = ?,
                updated_at = NOW()
            WHERE 
                employee_level_id = ? AND 
                company_id = ?
        `;

        try {
            const [result] = await db.query(updateQuery, [
                level_name,
                level_code,
                level_order,
                is_active,
                employee_level_id,
                company_id
            ]);

            if (result.affectedRows === 0) return null;
            

            // kembalikan row terbaru
            const [rows] = await db.query(
                `SELECT employee_level_id, level_name, level_code, level_order, is_active, created_at, updated_at
                FROM m_employee_level
                WHERE company_id = ? AND employee_level_id = ?
                LIMIT 1`,
                [company_id, employee_level_id]
            );
            
            return rows.length ? rows[0] : null;

        } catch (error) {
            console.error('❌ updateEmployeeLevelById error:', error);
            return { error };
        }

    }
}

module.exports = EmployeeLevelModel;
