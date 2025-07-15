const { getEmployeeDetailByToken } = require('../models/employeeModel');
const { successResponse, errorResponse } = require('../helpers/response')

const getEmployeeDetailCtrl = async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) return errorResponse(res, 401, 'Unauthorized, token tidak ditemukan');
  
      const result = await getEmployeeDetailByToken(token);
  
      // Error dari model
      if (result.error) {
        console.warn('⚠️', result.error);
        return errorResponse(res, 403, result.error);
      }
  
      return successResponse(res, 200, 'Data employee ditemukan', result.data);
  
    } catch (error) {
      console.error('❌ Error getEmployeeDetail:', error.message);
      return errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
    }
  };


module.exports = {
    getEmployeeDetailCtrl,
};
