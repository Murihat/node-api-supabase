const { successResponse, errorResponse } = require('../helpers/response')
const { hashPassword, generateToken } = require('../helpers/tokenHelper')
const { findUserByEmailAndPassword, getActiveTokenByEmployeeId, deactivateTokenByLoginId, createLoginToken } = require('../models/loginModel')

async function loginCtrl(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return errorResponse(res, 400, 'Missing email or password')
  }

  try {
    const hashed = hashPassword(password)
    const user = await findUserByEmailAndPassword(email, hashed)

    if (!user) {
        return successResponse(res, {
            code: 200,
            status: false,
            message: 'Invalid email or password',
            data: {}
        });
    }

    const employeeId = user.employee_id

    // 🔍 Check existing active token
    const activeToken = await getActiveTokenByEmployeeId(employeeId)
    if (activeToken) {
      await deactivateTokenByLoginId(activeToken.login_id)
    }

    // 🆕 Generate new token
    const token = generateToken()
    const expiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const inserted = await createLoginToken(employeeId, token, expiredAt)
    if (!inserted) {
        return successResponse(res, {
            code: 200,
            status: false,
            message: 'Failed to create token',
            data: {}
        });
    }


    return successResponse(res, {
        code: 200,
        status: true,
        message: 'Berhasil Login',
        data: {
            token,
            expiredAt: expiredAt.toISOString()
        }
    });
  } catch (err) {
    console.error('❌ loginCtrl error:', err)
    return errorResponse(res, 500, err?.message)
  }
}

module.exports = { loginCtrl }
