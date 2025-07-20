const { hashPassword } = require('../helpers/tokenHelper')
const response = require('../helpers/response')
const employeeModel = require('../models/employeeModel')

const cekEmployeeCtrl = async (req, res) => {
    try {
    const { email } = req.body;

    // ✅ Validasi input
    if (!email) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Email tidak ditemukan dalam request',
        data: {}
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedExtensions = ['.com', '.id', '.co.id', '.ac.id', '.my.id', '.sch.id', '.net.id', '.org.id'];
    const validExtension = allowedExtensions.some(ext => email.endsWith(ext));
    const isValidFormat = emailRegex.test(email);


    if (!isValidFormat || !validExtension) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Format email tidak valid',
        data: {}
      });
    }

    // ✅ Ambil data employee dari database
    const result = await employeeModel.getEmployeeByEmail(email);

    // ✅ Handle error dari model
    if (result.error) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: result.error,
        data: {}
      });
    }

    // ✅ Sukses
    return response.successResponse(res, {
      code: 200,
      status: true,
      message: 'Data employee tersedia',
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error cekEmployeeByEmail:', error.message);
    return response.errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
  }
};

const getEmployeeDetailCtrl = async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Unauthorized, token tidak ditemukan',
        data: {}
      });
  
      const result = await employeeModel.getEmployeeDetailByToken(token);
  
      // Error dari model
      if (result.error) {
        console.warn('⚠️', result.error);
        return response.successResponse(res, {
            code: 200,
            status: false,
            message: result.error,
            data: {}
          });
      }

      return response.successResponse(res, {
        code: 200,
        status: true,
        message: 'Data employee ditemukan',
        data: result.data
      });
    
    } catch (error) {
      console.error('❌ Error getEmployeeDetail:', error.message);
      return response.errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
    }
  };

const getEmployeeListCtrl = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Token wajib diisi',
        data: []
      });
    }

    // ✅ Ambil data superadmin dari token
    const { data: employeeData, error: employeeError } = await employeeModel.getEmployeeDetailByToken(token);

    if (employeeError) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: employeeError,
        data: []
      });
    }

    const { company_id } = employeeData;

    // ✅ Ambil list employee berdasarkan company_id
    const { data: employeeList, error } = await employeeModel.getEmployeeListByCompany(company_id);

    if (error) {
      console.error('❌ Error getEmployeeList:', error.message);
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: error.message,
        data: []
      });
    }

    return response.successResponse(res, {
      code: 200,
      status: true,
      message: '✅ List employee berhasil diambil',
      data: employeeList
    });

  } catch (err) {
    console.error('❌ Server Error:', err.message);
    return response.errorResponse(res, 500, 'Internal server error', err.message);
  }
};


module.exports = {
    cekEmployeeCtrl,
    getEmployeeDetailCtrl,
    getEmployeeListCtrl,
};
