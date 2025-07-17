const { getEmployeeDetailByToken, getEmployeeByEmail } = require('../models/employeeModel');
const { successResponse, errorResponse } = require('../helpers/response')
const { hashPassword } = require('../helpers/tokenHelper')



const cekEmployeeCtrl = async (req, res) => {
    try {
    const { email } = req.body;

    // ✅ Validasi input
    if (!email) {
      return successResponse(res, {
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
      return successResponse(res, {
        code: 200,
        status: false,
        message: 'Format email tidak valid',
        data: {}
      });
    }

    // ✅ Ambil data employee dari database
    const result = await getEmployeeByEmail(email);

    // ✅ Handle error dari model
    if (result.error) {
      return successResponse(res, {
        code: 200,
        status: false,
        message: result.error,
        data: {}
      });
    }

    // ✅ Sukses
    return successResponse(res, {
      code: 200,
      status: true,
      message: 'Data employee tersedia',
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error cekEmployeeByEmail:', error.message);
    return errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
  }
};

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


  const insertSuperadminCtrl = async (req, res) => {
  try {
    const { name, phone, email, password, company_id } = req.body;

    // ✅ Validasi input sederhana
    if (!name || !phone || !email || !password || !company_id) {
      return successResponse(res, {
        code: 200,
        status: false,
        message: 'Semua field wajib diisi',
        data: {}
      });
    }

    // ✅ Format join_date
    const join_date = new Date().toISOString().split('T')[0]; // format YYYY-MM-DD

    const hashed = hashPassword(password)


    // ✅ Payload insert
    const payload = {
      name,
      phone,
      email,
      password: hashed,
      company_id,
      employee_level_id: 7, //superadmin
      join_date
    };

    // ✅ Insert ke database
    const { data, error } = await model.insertEmployee(payload);

    if (error) {
      console.error('❌ Error insert employee:', error.message);
      return successResponse(res, {
        code: 200,
        status: false,
        message: error.message,
        data: {}
      });
    }

    return successResponse(res, {
      code: 200,
      status: true,
      message: '✅ Employee berhasil ditambahkan',
      data
    });

  } catch (error) {
    console.error('❌ Error insertEmployee:', error.message);
    return errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
  }
};



module.exports = {
    cekEmployeeCtrl,
    getEmployeeDetailCtrl,
    insertSuperadminCtrl,
};
