const { validateTokenModel, updateToken } = require('../models/tokenModel')
const { successResponse, errorResponse } = require('../helpers/response')

async function validateTokenCtrl(req, res) {
  const token = req.body.token

  if (!token) {
    return successResponse(res, {
      code: 200,
      status: false,
      message: 'Token tidak ada',
      data: {}
    });
  }

  try {
    const { data, error } = await validateTokenModel(token)

    if (error || !data) {
      return successResponse(res, {
        code: 200,
        status: false,
        message: 'Token tidak tersedia atau kadaluarsa',
        data: {}
      });
    }

    const expiredAt = new Date(data.token_expired_at)

    if (isNaN(expiredAt) || Date.now() > expiredAt.getTime()) {
      return successResponse(res, {
        code: 200,
        status: false,
        message: 'Token kadaluarsa',
        data: {}
      });
    }

    const remainingDays = Math.floor(
      (expiredAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )


    return successResponse(res, {
      code: 200,
      status: true,
      message: remainingDays <= 3
      ? `⚠️ Token will expire in ${remainingDays} day(s)`
      : '✅ Token is valid',
      data: {
        token,
        expiredAt: expiredAt.toISOString(),
        remainingDays,
        extends: remainingDays <= 3 ? true : false,
      }
    });
  } catch (err) {
    console.error('❌ validateToken error:', err)
    return errorResponse(res, 500, err?.message)
  }
}

async function updateTokenCtrl(req, res) {
    const token = req.body.token
  
    if (!token) {
      return successResponse(res, {
        code: 200,
        status: false,
        message: 'Token tidak ada',
        data: {}
      });
    }
  
    try {
      const { data, error } = await validateTokenModel(token)
  
      if (error || !data) {
        return successResponse(res, {
          code: 200,
          status: false,
          message: 'Token tidak tersedia atau kadaluarsa',
          data: {}
        });
      }
  
      const expiredAt = new Date(data.token_expired_at)
  
      if (isNaN(expiredAt.getTime()) || Date.now() > expiredAt.getTime()) {
        return successResponse(res, {
          code: 200,
          status: false,
          message: 'Token akan kadaluarsa',
          data: {}
        });
      }
  
      const remainingDays = Math.floor(
        (expiredAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
  
      let updated = false
      let message = 'Token masih berlaku'
      
      if (remainingDays > 3) {
        // Jika token masih berlaku lebih dari 3 hari, tidak perlu diperpanjang
        return successResponse(res, {
          code: 200,
          status: false,
          message: message,
          data: {}
        });
      }
      
      // Jika sisa hari 3 atau kurang, perpanjang token
      updated = await updateToken(token)
      
      if (!updated) {
        return successResponse(res, {
          code: 200,
          status: false,
          message: "Gagal perbarui token kadaluarsa",
          data: {}
        });
      }
      
      return successResponse(res, {
        code: 200,
        status: true,
        message: "Token berhasil di perpanjand",
        data: {
          token,
          oldExpiredAt: expiredAt.toISOString(),
          newExpiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 30
        }
      });
      
    } catch (err) {
      console.error('❌ updateToken error:', err)
      return errorResponse(res, 500, err?.message)
    }
}

module.exports = { validateTokenCtrl, updateTokenCtrl }
