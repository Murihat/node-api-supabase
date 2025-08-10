const db = require('../../config/mysqli').pool;

const DepartmentModel = {
    async findDepartmentSingle(company_id, department_name, department_code ) {
        const query = `
            SELECT * 
            FROM m_department 
            WHERE company_id = ? 
            AND department_name = ? 
            AND department_code = ?  
            ORDER BY created_at ASC
            LIMIT 1
        `;

        try {
            const [rows] = await db.query(query, [company_id, department_name, department_code]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ findDepartmentSingle error:', error);
            return { error };
        }
    },

    async insertDepartment(company_id, department_name, department_code) {
        const insertQuery = `
            INSERT INTO m_department (company_id, department_name, department_code, is_active, created_at)
            VALUES (?, ?, ?, 1, NOW())
        `;

        try {
            // 1. Insert data baru
            const [result] = await db.query(insertQuery, [
                company_id,
                department_name,
                department_code,
            ]);

            // 2. Ambil data yang baru diinsert
            const [newData] = await db.query(
                `SELECT * FROM m_department WHERE department_id = ? LIMIT 1`,
                [result.insertId]
            );

            return newData.length > 0 ? newData[0] : null;
        } catch (error) {
            console.error('❌ insertDepartment error:', error);
            return { error };
        }
    },

    async findAllDepartment(company_id, { search = '', sortBy = 'created_at', sortDir = 'ASC', limit = 10, offset = 0 } = {}) {
        // Build WHERE
        const whereParts = ['company_id = ?'];
        const params = [company_id];

        if (search) {
            whereParts.push('(department_name LIKE ? OR department_code LIKE ?)');
            const kw = `%${search}%`;
            params.push(kw, kw);
        }

        // Whitelist sortBy handled in controller; sortDir already sanitized (ASC/DESC)
        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        const query = `
                        SELECT 
                            department_id,
                            department_name,
                            department_code,
                            is_active,
                            created_at
                        FROM m_department
                        ${whereClause}
                        ORDER BY ${sortBy} ${sortDir}
                        LIMIT ? OFFSET ?
                    `;

        params.push(Number(limit), Number(offset));

        try {
            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            console.error('❌ DepartmentModel.findAllDepartment error:', error);
            throw error;
        }
    },

    async countDepartment(company_id, { search = '' } = {}) {
        const whereParts = ['company_id = ?'];
        const params = [company_id];

        if (search) {
            whereParts.push('(department_name LIKE ? OR department_code LIKE ?)');
            const kw = `%${search}%`;
            params.push(kw, kw);
        }

        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        const query = `
                        SELECT COUNT(1) AS total
                        FROM m_department
                        ${whereClause}
                    `;

        try {
            const [rows] = await db.query(query, params);
            return rows?.[0]?.total ?? 0;
        } catch (error) {
            console.error('❌ DepartmentModel.countDepartment error:', error);
            throw error;
        }
    },


     async findDepartmentById(department_id, company_id) {
        const query = `
            SELECT * 
            FROM m_department 
            WHERE department_id = ? 
            AND company_id = ? 
            ORDER BY created_at ASC
            LIMIT 1
        `;

        try {
            const [rows] = await db.query(query, [department_id, company_id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('❌ findDepartmentSingle error:', error);
            return { error };
        }
    },


    async updateDepartmentById(department_id, company_id, department_name, department_code, is_active) {
        const updateQuery = `
            UPDATE m_department 
            SET 
                department_name = ?,
                department_code = ?,
                is_active = ?,
                updated_at = NOW()
            WHERE 
                department_id = ? AND 
                company_id = ?
        `;

        try {
            const [result] = await db.query(updateQuery, [
                department_name,
                department_code,
                is_active,
                department_id,
                company_id
            ]);

            if (result.affectedRows === 0) return null;
            

            // kembalikan row terbaru
            const [rows] = await db.query(
                `SELECT department_id, department_code, department_name, is_active, created_at, updated_at
                FROM m_department
                WHERE company_id = ? AND department_id = ?
                LIMIT 1`,
                [company_id, department_id]
            );
            
            return rows.length ? rows[0] : null;

        } catch (error) {
            console.error('❌ updateDepartmentById error:', error);
            return { error };
        }

    }
}

module.exports = DepartmentModel;
