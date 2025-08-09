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
     }
}

module.exports = tokenModel;
