const { hashPassword, generateToken } = require('../helpers/tokenHelper');
const response = require('../helpers/response');
const tokenModel = require('../models/token.model');

const tokenCtrl = {
    async validateTokenLogin(token) {
        if (!token) {
            return response.errorResponse(res, { message: 'Token tidak boleh kosong.' });
        }

        const validToken = await tokenModel.isValidToken(token);

        if(!validToken){
            return false;
        }
       
        return true;
    }
}

module.exports = tokenCtrl;
