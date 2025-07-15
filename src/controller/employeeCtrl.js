const { getEmployeeDetailByToken } = require('../models/employeeModel');
const { successResponse, errorResponse } = require('../helpers/response')

const getEmployeeDetailCtrl = async (req, res) => {
    try {
      const token = req.query.token;
  
      if (!token) {
        return errorResponse(res, 401, 'Unauthorized, token tidak ditemukan');
      }
  
      const employeeData = await getEmployeeDetailByToken(token);
  
      return successResponse(res, 200, 'Data employee ditemukan', employeeData);
  
    } catch (error) {
      console.error('Error getEmployeeDetail:', error.message);
      return errorResponse(res, 500, error.message);
    }
};


module.exports = {
    getEmployeeDetailCtrl,
};
