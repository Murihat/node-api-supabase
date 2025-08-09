const { hashPassword, generateToken } = require('../helpers/tokenHelper');
const response = require('../helpers/response');
const loginModel = require('../models/login.model');

const LoginCtrl = {
  async loginAction(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return response.errorResponse(res, { message: 'Email atau kata sandi tidak boleh kosong.' });
    }

    try {
      const hashed = hashPassword(password);
      const user = await loginModel.findUserByEmailAndPassword(email, hashed);

      if (!user) {
        return response.errorResponse(res, { message: 'Email atau kata sandi salah.' });
      }


      const getEmployeeLevel = await loginModel.getEmployeeLevel(user.company_id, user.employee_level_id);

      if (!getEmployeeLevel) {
        return response.errorResponse(res, { message: 'Level user tidak di ketahui.' });
      }

      user.employee_level_code = getEmployeeLevel.level_code;
      user.employee_level_order = getEmployeeLevel.level_order;
      user.role = (getEmployeeLevel.level_code.toLowerCase() == 'super_admin') ? 'super_admin' : 'employee';

      // Nonaktifkan token lama jika masih aktif
      const activeToken = await loginModel.getActiveTokenByEmployeeId(user.employee_id);

      // const now = new Date();
      // if (new Date(activeToken.token_expired_at) <= now) {
      //   return response.errorResponse(res, {
      //     message: 'Token telah kedaluwarsa, silakan login kembali.'
      //   });
      // }

      if (activeToken) {
        await loginModel.deactivateTokenByLoginId(activeToken.login_id);
      }

      // Data tambahan dari header
      const token = generateToken();
      const expiredAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 hari
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      const userAgent = req.headers['user-agent'] || '';
      const platform = req.headers['sec-ch-ua-platform'] || '';
      const acceptLang = req.headers['accept-language'] || '';
      const headersJson = JSON.stringify(req.headers);

      // Simpan token beserta informasi tambahan
      const inserted = await loginModel.createLoginTokenWithMeta({
        employee_id: user.employee_id,
        token,
        token_expired_at: expiredAt,
        ip_address: ipAddress,
        user_agent: userAgent,
        platform,
        accept_language: acceptLang,
        headers_json: headersJson,
      });

      if (!inserted) {
        return response.errorResponse(res, { message: 'Gagal menyimpan token login.' });
      }

      return response.successResponse(res, {
        code: 200,
        status: true,
        message: 'Login berhasil.',
        data: {
          token,
          expiredAt: expiredAt.toISOString(),
          role: user.role,
        },
      });
    } catch (err) {
      console.error('❌ Terjadi kesalahan saat login:', err);
      return response.errorResponse(res, { message: 'Terjadi kesalahan di server: ' + err?.message });
    }
  },
};

module.exports = LoginCtrl;
