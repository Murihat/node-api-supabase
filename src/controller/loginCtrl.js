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
      return errorResponse(res, 401, 'Invalid email or password')
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
      return errorResponse(res, 500, 'Failed to create token')
    }

    return successResponse(res, 200, 'Login successful', {
      token,
      expiredAt: expiredAt.toISOString()
    })
  } catch (err) {
    console.error('❌ loginCtrl error:', err)
    return errorResponse(res, 500, 'Internal server error', err?.message)
  }
}

module.exports = { loginCtrl }
