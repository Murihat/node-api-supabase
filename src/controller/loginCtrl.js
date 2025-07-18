const { hashPassword, generateToken } = require('../helpers/tokenHelper')
const response = require('../helpers/response')
const loginModel = require('../models/loginModel')


async function loginAction(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return response.errorResponse(res, 400, 'Missing email or password')
  }

  try {
    const hashed = hashPassword(password)
    const user = await loginModel.findUserByEmailAndPassword(email, hashed)

    if (!user) {
        return response.successResponse(res, {
            code: 200,
            status: false,
            message: 'Invalid email or password',
            data: {}
        });
    }

     // ✅ Ambil data employee dari database
    const result = await loginModel.getEmployeeRoleByEmail(email);

    // ✅ Handle error dari model
    if (result.error) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: result.error,
        data: {}
      });
    }

    const employeeId = user.employee_id

    // 🔍 Check existing active token
    const activeToken = await loginModel.getActiveTokenByEmployeeId(employeeId)
    if (activeToken) {
      await loginModel.deactivateTokenByLoginId(activeToken.login_id)
    }

    // 🆕 Generate new token
    const token = generateToken()
    const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const inserted = await loginModel.createLoginToken(employeeId, token, expiredAt)
    if (!inserted) {
        return response.successResponse(res, {
            code: 200,
            status: false,
            message: 'Failed to create token',
            data: {}
        });
    }

    

    return response.successResponse(res, {
        code: 200,
        status: true,
        message: 'Berhasil Login',
        data: {
            token,
            expiredAt: expiredAt.toISOString(),
            role: result.data.employee_level_code,
        }
    });
  } catch (err) {
    console.error('❌ loginCtrl error:', err)
    return response.errorResponse(res, 500, err?.message)
  }
}

module.exports = { loginAction }
