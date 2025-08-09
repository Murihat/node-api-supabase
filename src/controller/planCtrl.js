const { hashPassword, generateToken } = require('../helpers/tokenHelper');
const response = require('../helpers/response');
const planModel = require('../models/plan.model');

const planCtrl = {
    async getAllPlan(req, res) {
        const dataPlan = await planModel.findAllPlan();

        if (!dataPlan) {
            return response.errorResponse(res, { message: 'Subscription plan tidak tersedia.' });
        }

        return response.successResponse(res, { status: true, data: dataPlan });
    }
}

module.exports = planCtrl;
