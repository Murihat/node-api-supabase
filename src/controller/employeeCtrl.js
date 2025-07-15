const { getEmployeeDetailByToken } = require('../models/employeeModel');
const { successResponse, errorResponse } = require('../helpers/response')

const getEmployeeDetailCtrl = async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) return successResponse(res, {
        code: 200,
        status: false,
        message: 'Unauthorized, token tidak ditemukan',
        data: {}
      });
  
      const result = await getEmployeeDetailByToken(token);
  
      // Error dari model
      if (result.error) {
        console.warn('⚠️', result.error);
        return successResponse(res, {
            code: 200,
            status: false,
            message: result.error,
            data: {}
          });
      }

      return successResponse(res, {
        code: 200,
        status: true,
        message: 'Data employee ditemukan',
        data: result.data
      });
    
    } catch (error) {
      console.error('❌ Error getEmployeeDetail:', error.message);
      return errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
    }
  };


module.exports = {
    getEmployeeDetailCtrl,
};
