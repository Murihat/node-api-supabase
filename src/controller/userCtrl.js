const { hashPassword, generateToken } = require('../helpers/tokenHelper');
const response = require('../helpers/response');
const userModel = require('../models/user.model');
const tokenCtrl = require('./tokenCtrl');

const UserCtrl = {
    async findUserByTokenLogin(req, res) {
        const { token } = req.body;

        if (!token) {
            return response.errorResponse(res, { message: 'Token tidak boleh kosong.' });
        }

        // 1. Validasi token lewat tokenCtrl
        const isValidToken = await tokenCtrl.validateTokenLogin(token);

        if (!isValidToken) {
            return response.errorResponse(res, { message: 'Token tidak valid atau sudah kadaluarsa.' });
        }

        const dataUser = await userModel.findUserByTokenLogin(token);

        if (!dataUser) {
            return response.errorResponse(res, { message: 'Data tidak tersedia.' });
        }

        return response.successResponse(res, {
            status: true,
            message: 'Successfully',
            data: dataUser,
        });

    }
}

module.exports = UserCtrl;
