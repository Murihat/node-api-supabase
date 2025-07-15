function successResponse(res, {code = 200, status, message = 'Success', data = {}}) {
    return res.status(code).json({
      status: status,
      code,
      message,
      data
    })
  }
  
  function errorResponse(res, code = 500, message = 'Internal Server Error', data = {}) {
    return res.status(code).json({
      status: false,
      code,
      message,
      data
    })
  }
  
  module.exports = {
    successResponse,
    errorResponse
  }
  