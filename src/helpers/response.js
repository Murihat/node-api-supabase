function successResponse(res, {code = 200, message = 'Success', data = {}}) {
    return res.status(code).json({
      status: true,
      code,
      message,
      data
    })
  }
  
  function errorResponse(res,{code = 200, message = 'Internal Server Error', data = {}}) {
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
  