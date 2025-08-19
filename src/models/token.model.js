const db = require('../config/mysqli').pool;

const tokenModel = {
    async isValidToken(token) {
        const query = `
                        SELECT * FROM m_login_token 
                        WHERE token = ? AND is_active = 1 
                        LIMIT 1                
                    `;
        try {
            const [rows] = await db.query(query, [token]);
            return rows[0] || null;
        } catch (err) {
            console.error('❌ isValidToken error:', err);
            return null;
        }
    },

    async findUserByTokenLogin(token) {
        const query = `
                        SELECT 
                            mlt.token                   AS token_login,
                            mlt.token_expired_at,
                            mlt.employee_id,

                            emp.employee_code,
                            emp.name                    AS employee_name,
                            emp.email                   AS employee_email,
                            emp.phone                   AS employee_phone,
                            emp.job_title               AS employee_job_title,
                            emp.picture                 AS employee_picture,

                            edp.department_name,
                            
                            eml.employee_level_id        AS employee_level_id,
                            eml.level_name              AS employee_level_name,
                            eml.level_code              AS employee_level_code,
                            eml.level_order             AS employee_level_order,

                            cmpny.company_id            AS employee_company_id,
                            cmpny.name                  AS employee_company
                        FROM m_login_token AS mlt
                        LEFT JOIN tb_employee           AS emp      ON emp.employee_id = mlt.employee_id
                        LEFT JOIN m_department          AS edp      ON edp.department_id = emp.department_id
                        LEFT JOIN m_employee_level      AS eml      ON eml.employee_level_id = emp.employee_level_id
                        LEFT JOIN tb_company            AS cmpny    ON cmpny.company_id = emp.company_id
                        WHERE mlt.token = ? 
                        AND mlt.is_active = 1
                        LIMIT 1
                    `;
        try {
            const [rows] = await db.query(query, [token]);
            return rows[0] || null;
        } catch (err) {
            console.error('❌ TokenModel findUserByTokenLogin error:', err);
            return null;
        }
    },
}

module.exports = tokenModel;
