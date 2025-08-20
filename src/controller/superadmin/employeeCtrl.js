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

            // Mapping picture jadi absolute URL
            const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

            const mappedRows = rows.map(emp => ({
            ...emp,
            picture: emp.picture 
                ? `${BASE_URL}/${emp.picture}` 
                : null,
            }));

            return response.successResponse(res, {
                status: true,
                message: 'Successfully',
                data: {
                    items: mappedRows,
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
        const {
            token,
            employee_id,           
            name,
            phone,
            email,
            password,              
            join_date,
            employee_level_id,
            department_id,
            job_title,
        } = req.body;

        if (!token || !employee_id) {
            return response.errorResponse(res, { message: "Token dan employee_id wajib diisi" });
        }

        try {
            // 1) Validasi token & role
            const isValidToken = await tokenCtrl.validateTokenLogin(token);
            if (!isValidToken) {
                return response.errorResponse(res, { message: "Token tidak valid atau sudah kadaluarsa." });
            }

            const dataUser = await tokenCtrl.findUserByTokenLogin(token);
            if (!dataUser) {
                return response.errorResponse(res, { message: "Data user tidak ditemukan." });
            }

            if (dataUser.employee_level_code !== "super_admin") {
                return response.errorResponse(res, { message: "Hanya superadmin yang boleh mengedit employee." });
            }

            // 2) Ambil data employee yang akan diedit (harus dalam company yang sama)
            const existingEmployee = await EmployeeModel.findEmployeeById(
                employee_id,
                dataUser.employee_company_id
            );

            if (!existingEmployee) {
                return response.errorResponse(res, { message: "Employee tidak ditemukan." });
            }

            // 3) Jika email diubah, cek sudah dipakai atau belum (unik per company)
            if (email && email !== existingEmployee.email) {
                const emailTaken = await EmployeeModel.findEmployeeSingle(
                    dataUser.employee_company_id,
                    { email }
                );

                if (emailTaken) {
                    return response.errorResponse(res, { message: `Email ${email} sudah digunakan.` });
                }
            }

            // 4) Siapkan payload update (hanya field yang dikirim)
            const updatePayload = {};
            if (typeof name !== "undefined") updatePayload.name = name;
            if (typeof phone !== "undefined") updatePayload.phone = phone;
            if (typeof email !== "undefined") updatePayload.email = email;
            if (typeof join_date !== "undefined") updatePayload.join_date = join_date;
            if (typeof employee_level_id !== "undefined") updatePayload.employee_level_id = employee_level_id;
            if (typeof department_id !== "undefined") updatePayload.department_id = department_id;
            if (typeof job_title !== "undefined") updatePayload.job_title = job_title;

            // 5) Password: jika dikirim, cek sama/tidak dengan yang lama
            if (typeof password !== "undefined" && password !== null && String(password).trim() !== "") {
                // compare dengan hash lama
                const isSame = await comparePassword(password, existingEmployee.password); // pastikan ada helper comparePassword(bcrypt.compare)
                if (!isSame) {
                    updatePayload.password = await hashPassword(password);
                }
                // jika sama → tidak set password (biarkan kosong agar tidak mengubah)
            }

            // 6) Picture: jika ada file baru → simpan & replace
            let savedImage = null;
            if (req.file?.buffer && req.file?.mimetype) {
                try {
                    savedImage = await saveEmployeeImageBuffer({
                    req,
                    buffer: req.file.buffer,
                    mime: req.file.mimetype,
                    companyId: dataUser.employee_company_id,
                    employeeId: existingEmployee.employee_id,
                    });
                    updatePayload.picture = savedImage.publicUrl;
                } catch (imgErr) {
                    console.error("Gagal mengganti foto employee:", imgErr);
                    // Tidak gagal total; lanjutkan tanpa update picture
                }
            }

            // Jika tidak ada field yang berubah sama sekali
            if (Object.keys(updatePayload).length === 0) {
                return response.successResponse(res, {
                    status: true,
                    message: "Tidak ada perubahan data.",
                    data: existingEmployee,
                });
            }

            // 7) Eksekusi update
            const updated = await EmployeeModel.updateEmployeeById(
                existingEmployee.employee_id,
                dataUser.employee_company_id,
                updatePayload
            );

            if (!updated || updated.error) {
                return response.errorResponse(res, { message: "Maaf gagal update data employee!" });
            }

            // Buat respons final (gabungkan yang lama + perubahan)
            const result = {
                ...existingEmployee,
                ...updatePayload,
            };

            return response.successResponse(res, {
                        status: true,
                        message: "Successfully updated employee",
                        data: result,
                    });
        } catch (err) {
            console.error("❌ editEmployee error:", err);
            return response.errorResponse(res, {
                message: err.message || "Terjadi kesalahan saat update employee.",
            });
        }
    }

}

module.exports = EmployeeCtrl;
