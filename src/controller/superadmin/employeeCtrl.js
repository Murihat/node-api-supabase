const { hashPassword, generateToken } = require('../../helpers/tokenHelper');
const response = require('../../helpers/response');
const tokenCtrl = require('../tokenCtrl');
const EmployeeModel = require('../../models/superadmin/employee.model');
const { saveEmployeeImageBuffer } = require('../imageUploadCtrl');

const EmployeeCtrl = {
    async  findAllEmployee(req, res) {
        const token = req.query.token || req.body?.token;

        // Pagination & filter
        const page  = parseInt(req.query.page ?? req.body?.page ?? 1, 10);
        const limit = parseInt(req.query.limit ?? req.body?.limit ?? 10, 10);
        const search = (req.query.search ?? req.body?.search ?? '').trim();

        // Sorting whitelist
        const allowedSortBy = new Set(['created_at', 'employee_level_id', 'department_id']);
        const sort_by = (req.query.sort_by ?? req.body?.sort_by ?? 'created_at').toString();
        const sort_dir_raw = (req.query.sort_dir ?? req.body?.sort_dir ?? 'DESC').toString().toUpperCase();
        const sort_dir = sort_dir_raw === 'DESC' ? 'DESC' : 'ASC';
        const sortBy = allowedSortBy.has(sort_by) ? sort_by : 'created_at';

        if (!token) {
            return response.errorResponse(res, {message: 'Token wajib diisi',});
        }

        // Validasi token
        const isValidToken = await tokenCtrl.validateTokenLogin(token);
        if (!isValidToken) {
            return response.errorResponse(res, { message: 'Token tidak valid atau sudah kadaluarsa.' });
        }

        // Ambil data user dari token
        const dataUser = await tokenCtrl.findUserByTokenLogin(token);
        if (!dataUser) {
            return response.errorResponse(res, { message: 'Data user tidak ditemukan.' });
        }

        // Scope by company
        const companyId = dataUser.employee_company_id;

        try {
            // Hitung total
            const total = await EmployeeModel.countEmployee(companyId, { search });

            // Ambil data
            const rows = await EmployeeModel.findAllEmployee(companyId, {
                search,
                sortBy,
                sortDir: sort_dir,
                limit,
                offset: (page - 1) * limit,
            });

            return response.successResponse(res, {
                status: true,
                message: 'Successfully',
                data: {
                    items: rows,
                    pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / (limit || 1)),
                    },
                    meta: {
                    search,
                    sort_by: sortBy,
                    sort_dir,
                    },
                },
            });
        } catch (error) {
            console.error('❌ findAllEmployee error:', error);
            return response.errorResponse(res, { message: 'Gagal memuat data employee.' });
        }
    },

    async saveEmployee(req, res) {
        const {
        token,
        name,
        phone,
        email,
        password,
        join_date,
        employee_level_id,
        department_id,
        job_title,
        } = req.body;

        if (!token || !email || !name || !phone || !password || !employee_level_id || !department_id || !job_title || !join_date) {
            return response.errorResponse(res, { message: "Semua data wajib diisi" });
        }

        try {
        // 1) Validasi token & role
        const isValidToken = await tokenCtrl.validateTokenLogin(token);
        if (!isValidToken) {
            return response.errorResponse(res, {
                message: "Token tidak valid atau sudah kadaluarsa.",
            });
        }

        const dataUser = await tokenCtrl.findUserByTokenLogin(token);

        if (!dataUser) {
            return response.errorResponse(res, { message: "Data tidak tersedia." });
        }

        if (dataUser.employee_level_code !== "super_admin") {
            return response.errorResponse(res, {
                message: "Hanya superadmin yang boleh insert employee",
            });
        }

        // 2) Cek existing email (per company)
        const isExistingEmployee = await EmployeeModel.findEmployeeSingle(
            dataUser.employee_company_id,
            { email: email }
        );

        if (isExistingEmployee) {
            return response.errorResponse(res, {
                message: `Employee ${isExistingEmployee.email} sudah tersedia`,
            });
        }

        if(dataUser.employee_level_id == employee_level_id){
            return response.errorResponse(res, {
                message: `Employee super admin sudah tersedia`,
            });
        }

        // 3) Insert employee (tanpa gambar dulu)
        const insertEmployee = await EmployeeModel.insertEmployee(
            dataUser.employee_company_id,
            {
                name,
                phone,
                email,
                password: await hashPassword(password),
                join_date,
                employee_level_id,
                department_id,
                job_title,
                picture: null, 
            }
        );

        if (!insertEmployee || insertEmployee.error) {
            return response.errorResponse(res, { message: "Maaf gagal insert employee!" });
        }

        const createdEmployeeId = insertEmployee.employee_id;
        let savedImage = null;
        
        // 4) Jika ada file gambar, simpan ke folder per company + nama file per employee
        if (req.file?.buffer && req.file?.mimetype) {
            try {
                savedImage = await saveEmployeeImageBuffer({
                    req,
                    buffer: req.file.buffer,
                    mime: req.file.mimetype,
                    companyId: dataUser.employee_company_id,
                    employeeId: createdEmployeeId,
                });

                // 5) Update kolom picture (pakai URL publik agar gampang diakses front-end)
                await EmployeeModel.updateEmployeeById(
                    createdEmployeeId,
                    dataUser.employee_company_id,
                    { picture: savedImage.publicUrl }
                );

                // opsional: juga update di objek response
                if (insertEmployee.picture !== undefined) {
                    insertEmployee.picture = savedImage.publicUrl;
                }
            } catch (imgErr) {
                // Gagal simpan foto → employee tetap ada, tapi balikan warning
                console.error("Gagal simpan foto employee:", imgErr);
            }
        }

            return response.successResponse(res, {
                status: true,
                message: "Successfully inserted employee",
                data: {
                    ...insertEmployee,
                },
            });
        } catch (err) {
            console.error("❌ saveEmployee error:", err);
            return response.errorResponse(res, {
                message:  err.message,
            });
        }
    },


    async editEmployee(req, res) {
        const { token, department_id, department_name, department_code, is_active } = req.body;

        // Validasi input minimal
        if (!token || !department_id || !department_name || !department_code) {
            return response.errorResponse(res, { message: 'Data tidak boleh kosong' });
        }

        // Validasi token
        const isValidToken = await tokenCtrl.validateTokenLogin(token);
        if (!isValidToken) {
            return response.errorResponse(res, { message: 'Token tidak valid atau sudah kadaluarsa.' });
        }

        // Ambil user
        const dataUser = await tokenCtrl.findUserByTokenLogin(token);
        if (!dataUser) {
            return response.errorResponse(res, { message: 'Data user tidak ditemukan.' });
        }

        // Hak akses
        if (dataUser.employee_level_code !== 'super_admin') {
            return response.errorResponse(res, { message: 'Hanya superadmin yang boleh edit department' });
        }
        
        const companyId = dataUser.employee_company_id;

        // Validasi department
       const isExisting = await DepartmentModel.findDepartmentById(
            department_id,
            companyId,
        );

        if (!isExisting || isExisting.error) {
            return response.errorResponse(res, {message: `Department ${department_name} tidak tersedia`,});
        }

        // Update
        const updated = await DepartmentModel.updateDepartmentById(department_id, companyId, department_name, department_code, is_active);

        if (!updated || updated.error) {
            return response.errorResponse(res, { message: 'Gagal mengubah department' });
        }

        return response.successResponse(res, {
            status: true,
            message: 'Successfully',
            data: updated,
        });
    }
}

module.exports = EmployeeCtrl;
