const { validateTokenModel, updateToken } = require('../models/tokenModel')
const { successResponse, errorResponse } = require('../helpers/response')

async function validateTokenCtrl(req, res) {
  const token = req.body.token

  if (!token) {
    return errorResponse(res, 400, 'Missing token')
  }

  try {
    const { data, error } = await validateTokenModel(token)

    if (error || !data) {
      return errorResponse(res, 401, 'Invalid or expired token')
    }

    const expiredAt = new Date(data.token_expired_at)

    if (isNaN(expiredAt) || Date.now() > expiredAt.getTime()) {
      return errorResponse(res, 401, 'Token expired')
    }

    const remainingDays = Math.floor(
      (expiredAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    return successResponse(
      res,
      200,
      remainingDays <= 3
        ? `⚠️ Token will expire in ${remainingDays} day(s)`
        : '✅ Token is valid',
      {
        token,
        expiredAt: expiredAt.toISOString(),
        remainingDays,
      }
    )
  } catch (err) {
    console.error('❌ validateToken error:', err)
    return errorResponse(res, 500, 'Internal server error', err?.message)
  }
}

async function updateTokenCtrl(req, res) {
    const token = req.body.token
  
    if (!token) {
      return errorResponse(res, 400, 'Missing token')
    }
  
    try {
      const { data, error } = await validateTokenModel(token)
  
      if (error || !data) {
        return errorResponse(res, 401, 'Invalid or expired token')
      }
  
      const expiredAt = new Date(data.token_expired_at)
  
      if (isNaN(expiredAt.getTime()) || Date.now() > expiredAt.getTime()) {
        return errorResponse(res, 401, 'Token already expired')
      }
  
      const remainingDays = Math.floor(
        (expiredAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
  
      let updated = false
      let message = 'Token is still valid'
      
      if (remainingDays > 3) {
        // Jika token masih berlaku lebih dari 3 hari, tidak perlu diperpanjang
        return errorResponse(res, 400, message)
      }
      
      // Jika sisa hari 3 atau kurang, perpanjang token
      updated = await updateToken(token)
      
      if (!updated) {
        return errorResponse(res, 500, 'Failed to extend token expiration')
      }
      
      message = 'Token expiration extended successfully'
      
      return successResponse(res, 200, message, {
        token,
        oldExpiredAt: expiredAt.toISOString(),
        newExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        remainingDays: 30
      })
      
    } catch (err) {
      console.error('❌ updateToken error:', err)
      return errorResponse(res, 500, 'Internal server error', err?.message)
    }
}

module.exports = { validateTokenCtrl, updateTokenCtrl }
