const { hashPassword, generateToken } = require('../../helpers/tokenHelper');
const response = require('../../helpers/response');
const tokenCtrl = require('../tokenCtrl');
const EmployeeLevelModel = require('../../models/superadmin/employeeLevel.model');

const EmployeeLevelCtrl = {
    async  findAllEmployeeLevel(req, res) {
        const token = req.query.token || req.body?.token;

        // Pagination & filter
        const page  = parseInt(req.query.page ?? req.body?.page ?? 1, 10);
        const limit = parseInt(req.query.limit ?? req.body?.limit ?? 10, 10);
        const search = (req.query.search ?? req.body?.search ?? '').trim();

        // Sorting whitelist
        const allowedSortBy = new Set(['created_at', 'level_name', 'level_code', 'level_order']);
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
            const total = await EmployeeLevelModel.countEmployeeLevel(companyId, { search });

            // Ambil data
            const rows = await EmployeeLevelModel.findAllEmployeeLevel(companyId, {
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
            console.error('❌ findAllEmployeeLevel error:', error);
            return response.errorResponse(res, { message: 'Gagal memuat data employee level.' });
        }
    },

    async saveEmployeeLevel(req, res) {
        const { token, level_name, level_code } = req.body;

       if (!token || !level_name || !level_code) {
            return response.errorResponse(res, {  message: 'Semua data wajib di isi',});
       }

        const isValidToken = await tokenCtrl.validateTokenLogin(token);

        if (!isValidToken) {
            return response.errorResponse(res, { message: 'Token tidak valid atau sudah kadaluarsa.' });
        }

        const dataUser = await tokenCtrl.findUserByTokenLogin(token);

        if (!dataUser) {
            return response.errorResponse(res, { message: 'Data tidak tersedia.' });
        }

        if (dataUser.employee_level_code !== "super_admin") {
            return response.errorResponse(res, { message: "Hanya superadmin yang boleh insert employee level",});
        }

        const isExisting = await EmployeeLevelModel.findEmployeeLevelSingle(
            dataUser.employee_company_id,
            level_name,
            level_code
        );

        if (isExisting) {
            return response.errorResponse(res, {message: `EmployeeLevel ${isExisting.level_name} sudah tersedia`,});
        }

        const insertEmployeeLevel = await EmployeeLevelModel.insertEmployeeLevel(
            dataUser.employee_company_id,
            level_name,
            level_code
        );

        if (!insertEmployeeLevel || insertEmployeeLevel.error) {
            return response.errorResponse(res, {message: `Maaf gagal insert EmployeeLevel!`,});
        }

        return response.successResponse(res, {
            status: true,
            message: 'Successfully',
            data: insertEmployeeLevel,
        });

    },

    async editEmployeeLevel(req, res) {
        const { token, employee_level_id, level_name, level_code, level_order, is_active } = req.body;

        // Validasi input minimal
        if (!token || !employee_level_id || !level_name || !level_code || !level_order || !is_active) {
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
            return response.errorResponse(res, { message: 'Hanya superadmin yang boleh edit employee level' });
        }
        
        const companyId = dataUser.employee_company_id;

        // Validasi employee level
       const isExisting= await EmployeeLevelModel.findEmployeeLevelById(
            employee_level_id,
            companyId,
        );

        if (!isExisting || isExisting.error) {
            return response.errorResponse(res, {message: `Employee Level ${level_name} tidak tersedia`,});
        }

        
        // Cek apakah level_order yang diminta sudah dipakai oleh record lain di company yang sama
        const isDup = await EmployeeLevelModel.existsLevelOrder(companyId, level_order, employee_level_id);
        if (isDup) {
            return response.errorResponse(res, { message: 'Employee level order sudah digunakan' });
        }



        // Update
        const updated = await EmployeeLevelModel.updateEmployeeLevelById(employee_level_id, companyId, level_name, level_code, level_order, is_active);

        if (!updated || updated.error) {
            return response.errorResponse(res, { message: 'Gagal mengubah Employee Level' });
        }

        return response.successResponse(res, {
            status: true,
            message: 'Successfully',
            data: updated,
        });
    }

}

module.exports = EmployeeLevelCtrl;
