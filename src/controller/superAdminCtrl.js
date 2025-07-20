const { hashPassword } = require('../helpers/tokenHelper')
const superAdminModel = require('../models/superAdminModel')
const response = require('../helpers/response')


const getEmployeeLevelsCtrl = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'token tidak ditemukan',
      data: {}
    });
  }

    const { data: employeeData, error: employeeError } = await superAdminModel.getEmployeeDetailByToken(token);

    if (employeeError) {
        return response.successResponse(res, {
            code: 200,
            status: false,
            message: employeeError,
            data: {}
        });
    }

    const { company_id, user_status_code } = employeeData;

        if (user_status_code !== "super_admin") {
            return response.successResponse(res, {
            code: 200,
            status: false,
            message: "Hanya superadmin yang boleh lihat employee level",
            data: {}
        });
    }

  const { data, error } = await superAdminModel.getEmployeeLevelsByCompany(company_id);

  if (error) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: error.message,
      data: {}
    });
  }

  return response.successResponse(res, {
    code: 200,
    status: true,
    message: '✅ List employee level berhasil diambil',
    data
  });
};

const insertEmployeeLevelCtrl = async (req, res) => {
  try {
    const { token, level_name, level_code, level_order } = req.body;

    if (!token || !level_name || !level_code || level_order === undefined) {
      return successResponse(res, {
        code: 200,
        status: false,
        message: 'Semua data wajib diisi',
        data: {}
      });
    }

    const { data: employeeData, error: employeeError } = await superAdminModel.getEmployeeDetailByToken(token);

    if (employeeError) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: employeeError,
        data: {}
      });
    }

    const { company_id, user_status_code } = employeeData;

     if (user_status_code !== "super_admin") {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: "Hanya superadmin yang boleh insert employee level",
        data: {}
      });
    }

     // ✅ Step cek level sudah ada
    const { data: existsLevel, error: existsError } = await superAdminModel.checkEmployeeLevelExists({
      company_id,
      level_code,
      level_order
    });

    if (existsError) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: existsError.message,
        data: {}
      });
    }

    if (existsLevel) {
        const levelMessage = 
    existsLevel.level_code === level_code
      ? `Level code '${level_code}' sudah dipakai di company ini`
      : `Level order '${level_order}' sudah dipakai di company ini`;

      return response.successResponse(res, {
        code: 200,
        status: false,
        message: levelMessage,
        data: {}
      });
    }

    const { data, error } = await superAdminModel.insertEmployeeLevel({
      company_id,
      level_name,
      level_code,
      level_order
    });

    if (error) {
      console.error('❌ Error insertEmployeeLevel:', error.message);
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: error.message,
        data: {}
      });
    }

    return response.successResponse(res, {
      code: 200,
      status: true,
      message: '✅ Employee level berhasil ditambahkan',
      data
    });

  } catch (err) {
    console.error('❌ Server Error:', err.message);
    return response.errorResponse(res, 500, 'Internal server error', err.message);
  }
};

const getDepartmentsCtrl = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'Token tidak ditemukan',
      data: {}
    });
  }

  // ✅ Cek employee dari token
  const { data: employeeData, error: employeeError } = await superAdminModel.getEmployeeDetailByToken(token);

  if (employeeError) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: employeeError,
      data: {}
    });
  }

  const { company_id, user_status_code } = employeeData;

  if (user_status_code !== "super_admin") {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: "Hanya superadmin yang boleh lihat daftar department",
      data: {}
    });
  }

  // ✅ Ambil data department
  const { data, error } = await superAdminModel.getDepartmentByCompany(company_id);

  if (error) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: error.message,
      data: {}
    });
  }

  if (!data || data.length === 0) {
    return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'List department tidak tersedia',
        data: []
    });
    }

  return response.successResponse(res, {
    code: 200,
    status: true,
    message: '✅ List department berhasil diambil',
    data
  });
};


const insertDepartmentCtrl = async (req, res) => {
  try {
    const { token, department_name, department_code } = req.body;

    if (!token || !department_name || !department_code) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Semua data wajib diisi',
        data: {}
      });
    }

    // ✅ Step 1: Get Employee Data dari token
    const { data: employeeData, error: employeeError } = await superAdminModel.getEmployeeDetailByToken(token);

    if (employeeError) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: employeeError,
        data: {}
      });
    }

    const { company_id, user_status_code } = employeeData;

    if (user_status_code !== "super_admin") {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: "Hanya superadmin yang boleh insert department",
        data: {}
      });
    }

    // ✅ Step 2: Cek Department sudah ada
    const { data: existsDepartment, error: existsError } = await superAdminModel.checkDepartmentExists(
      company_id,
      department_code
    );

    if (existsError) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: existsError.message,
        data: {}
      });
    }

    if (existsDepartment) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: `Department code '${department_code}' sudah terdaftar di company ini`,
        data: {}
      });
    }

    // ✅ Step 3: Insert ke m_department
    const { data, error } = await superAdminModel.insertDepartment({
      company_id,
      department_name,
      department_code
    });

    if (error) {
      console.error('❌ Error insertDepartment:', error.message);
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: error.message,
        data: {}
      });
    }

    return response.successResponse(res, {
      code: 200,
      status: true,
      message: '✅ Department berhasil ditambahkan',
      data
    });

  } catch (err) {
    console.error('❌ Server Error:', err.message);
    return response.errorResponse(res, 500, 'Internal server error', err.message);
  }
};


const saveSuperadminCtrl = async (req, res) => {
    try {
        const { company, employee, plan_id } = req.body;

        if (!company || !employee || !plan_id) {
            return response.successResponse(res, {
                code: 200,
                status: false,
                message: 'Data harap dilengkapi!',
                data: {}
            });
        }

        // ✅ Step 1: Cek apakah company sudah ada
        const { exists, data: existingData, error: checkError } = await superAdminModel.checkCompanyExists({
            identity_company: company.identity_company,
            name: company.name,
            email: company.email,
            identity_owner: company.identity_owner,
        });

        if (checkError) {
            console.error('❌ Cek company error:', checkError);
            return response.successResponse(res, {
                code: 200,
                status: false,
                message: `Gagal cek company: ${checkError}`,
                data: {}
            });
        }

        if (exists) {
            console.log('❌ Company sudah terdaftar:', existingData);
            return response.successResponse(res, {
                code: 200,
                status: false,
                message: 'Company sudah terdaftar',
                data: {}
            });
        }


        // 1. Insert company
        const { data: companyData, error: companyError } = await superAdminModel.createCompany(company);

        if (companyError) {
            console.error('❌ Company insert error:', companyError);
            return response.successResponse(res, { code: 200, status: false, message: 'Gagal buat company', data: {} });
        }

        // 2. Cek Get Plan
        const { data: plan, error: planError } = await superAdminModel.getPlanById(plan_id);
        if (planError || !plan) {
            console.error('❌ Plan error:', planError);
            return response.successResponse(res, { code: 200, status: false, message: 'Plan tidak ditemukan', data: {} });
        }

        // 3. Cek company sudah punya subscription?
        const { data: existingSub, error: subError } = await superAdminModel.getCompanyActiveSubscription(companyData.company_id);
        if (subError) {
            return response.successResponse(res, { code: 200, status: false, message: `Gagal cek subscription: ${subError.message}`, data: {} });
        }

        if (existingSub && existingSub.length > 0) {
            return response.successResponse(res, { code: 200, status: false, message: 'Company sudah memiliki subscription aktif', data: {} });
        }

        // 4. Insert subscription
        const start_date = new Date();
        const end_date = new Date();
        end_date.setMonth(end_date.getMonth() + 1);

        const formatDate = (date) => date.toISOString().split('T')[0];

        const planPayload = {
            company_id: companyData.company_id,
            company_plan_id: plan.company_plan_id,
            start_date: formatDate(start_date),
            end_date: formatDate(end_date),
            is_active: true,
            plan_name: plan.plan_name,
            plan_price: plan.price_month,
            plan_discount: plan.discount,
            max_limit: plan.max_user_limit
        };

        const { data: planData, error: errorPlan } = await superAdminModel.createCompanySubscription(planPayload);
        if (errorPlan) {
            return response.successResponse(res, { code: 200, status: false, message: `Gagal buat subscription: ${errorPlan.message}`, data: {} });
        }

        // 5. Validasi Employee
        if (!employee.name || !employee.phone || !employee.email || !employee.password) {
            return response.successResponse(res, { code: 200, status: false, message: 'Data employee tidak lengkap', data: {} });
        }

        const hashed = hashPassword(employee.password);
        const join_date = formatDate(new Date());

        const payload = {
            name: employee.name,
            phone: employee.phone,
            email: employee.email,
            password: hashed,
            company_id: companyData.company_id,
            user_status: 1, // 1 superadmin or 2 employee
            join_date
        };

        // 6. Insert Employee
        const { data: employeeData, error: employeeError } = await superAdminModel.insertEmployee(payload);

        if (employeeError) {
            console.error('❌ Employee insert error:', employeeError.message);
            // rollback semua
            await deleteCompanySubscription(companyData.company_id);
            await deleteCompany(companyData.company_id);
            return response.successResponse(res, { code: 200, status: false, message: `Gagal buat employee: ${employeeError.message}`, data: {} });
        }

        return response.successResponse(res, {
            code: 200,
            status: true,
            message: '✅ Superadmin berhasil ditambahkan',
            data: employeeData
        });

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    return response.errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
  }
}

// 🔹 Hapus Company berdasarkan ID
const deleteCompany = async (company_id) => {
  try {
    const { error } = await superAdminModel.deleteCompanyById(company_id);
    if (error) {
      console.error(`❌ Gagal hapus company (id: ${company_id}):`, error.message);
    } else {
      console.log(`✅ Company berhasil dihapus (id: ${company_id})`);
    }
  } catch (err) {
    console.error(`❌ Fatal error hapus company (id: ${company_id}):`, err.message);
  }
};

// 🔹 Hapus Subscription aktif berdasarkan company_id
const deleteCompanySubscription = async (company_id) => {
  try {
    const { error } = await superAdminModel.deleteActiveSubscriptionByCompany(company_id);
    if (error) {
      console.error(`❌ Gagal hapus subscription (company_id: ${company_id}):`, error.message);
    } else {
      console.log(`✅ Subscription berhasil dihapus (company_id: ${company_id})`);
    }
  } catch (err) {
    console.error(`❌ Fatal error hapus subscription (company_id: ${company_id}):`, err.message);
  }
};



const insertEmployeeCtrl = async (req, res) => {
  try {

    const { token, employee } = req.body;
    console.log(req.body);

    if (!token || !employee) {
        return response.successResponse(res, {
            code: 200,
            status: false,
            message: 'Data harap dilengkapi!',
            data: {}
        });
    }


    if (!employee.name || !employee.email || !employee.password || !employee.employee_level_id || !employee.department_id || !employee.job_title) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Semua data wajib diisi kecuali image',
        data: {}
      });
    }

    // ✅ Get superadmin detail
    const { data: employeeData, error: employeeError } = await superAdminModel.getEmployeeDetailByToken(token);

    if (employeeError) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: employeeError,
        data: {}
      });
    }

    const { company_id, user_status_code } = employeeData;

    if (user_status_code !== "super_admin") {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: "Hanya superadmin yang boleh insert employee",
        data: {}
      });
    }

   const email = employee.email;

    // ✅ Cek email sudah digunakan
    const { data: existsEmployee, error: existsError } = await superAdminModel.checkEmployeeExistsByEmail({
        company_id,
        email
    });

    if (existsError) {
        return response.successResponse(res, {
            code: 200,
            status: false,
            message: existsError.message,
            data: {}
        });
    }

    if (existsEmployee) {
        return response.successResponse(res, {
            code: 200,
            status: false,
            message: `Email '${email}' sudah digunakan di company ini`,
            data: {}
        });
    }

    const hashed = hashPassword(employee.password)

    // ✅ Insert employee
    const { data, error } = await superAdminModel.insertEmployee({
      company_id,
      name: employee.name,
      email: employee.email,
      password: hashed,
      employee_level_id: employee.employee_level_id,
      department_id: employee.department_id,
      job_title: employee.job_title,
      user_status_id: 2, //2 for employee
      image_base64: employee.picture || null,
      is_active: true,
    });

    if (error) {
      console.error('❌ Error insertEmployee:', error.message);
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: error.message,
        data: {}
      });
    }

    return response.successResponse(res, {
      code: 200,
      status: true,
      message: '✅ Employee berhasil ditambahkan',
      data
    });

  } catch (err) {
    console.error('❌ Server Error:', err.message);
    return response.errorResponse(res, 500, 'Internal server error', err.message);
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
    const { data: employeeData, error: employeeError } = await superAdminModel.getEmployeeDetailByToken(token);

    if (employeeError) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: employeeError,
        data: []
      });
    }

    const { company_id, user_status_code } = employeeData;

    if (user_status_code !== "super_admin") {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: "Hanya superadmin yang boleh melihat data employee",
        data: []
      });
    }

    // ✅ Ambil list employee berdasarkan company_id
    const { data: employeeList, error } = await superAdminModel.getEmployeeListByCompany(company_id);

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
    saveSuperadminCtrl,
    insertEmployeeLevelCtrl, 
    getEmployeeLevelsCtrl,
    insertDepartmentCtrl,
    getDepartmentsCtrl,
    insertEmployeeCtrl,
    getEmployeeListCtrl,
}
