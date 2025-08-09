const db = require('../config/mysqli').pool;

const planModel = {
    async findAllPlan() {

        
        const query = `
                    SELECT * FROM tb_company_plan 
                    WHERE is_active = 1 
                    ORDER BY created_at ASC
                `;

        try {
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error('❌ findAllPlan error:', err);
            return { error };
        }
    }
}

module.exports = planModel;
