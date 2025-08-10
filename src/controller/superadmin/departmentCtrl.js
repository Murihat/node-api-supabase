const { hashPassword, generateToken } = require('../../helpers/tokenHelper');
const response = require('../../helpers/response');
const tokenCtrl = require('../tokenCtrl');
const DepartmentModel = require('../../models/superadmin/department.model');

const DepartmentCtrl = {
    async  findAllDepartment(req, res) {
        const token = req.query.token || req.body?.token;

        // Pagination & filter
        const page  = parseInt(req.query.page ?? req.body?.page ?? 1, 10);
        const limit = parseInt(req.query.limit ?? req.body?.limit ?? 10, 10);
        const search = (req.query.search ?? req.body?.search ?? '').trim();

        // Sorting whitelist
        const allowedSortBy = new Set(['created_at', 'department_name', 'department_code']);
        const sort_by = (req.query.sort_by ?? req.body?.sort_by ?? 'created_at').toString();
        const sort_dir_raw = (req.query.sort_dir ?? req.body?.sort_dir ?? 'ASC').toString().toUpperCase();
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
            const total = await DepartmentModel.countDepartment(companyId, { search });

            // Ambil data
            const rows = await DepartmentModel.findAllDepartment(companyId, {
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
            console.error('❌ findAllDepartment error:', error);
            return response.errorResponse(res, { message: 'Gagal memuat data department.' });
        }
    },

    async saveDepartment(req, res) {
        const { token, department_name, department_code } = req.body;

       if (!token || !department_name || !department_code) {
            return response.errorResponse(res, {  message: 'Semua data wajib diisi',});
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
            return response.errorResponse(res, { message: "Hanya superadmin yang boleh insert department",});
        }

        const isExistingDepartment = await DepartmentModel.findDepartmentSingle(
            dataUser.employee_company_id,
            department_code,
            department_name
        );

        if (isExistingDepartment) {
            return response.errorResponse(res, {message: `Department ${isExistingDepartment.department_name} sudah tersedia`,});
        }

        const insertDepartment = await DepartmentModel.insertDepartment(
            dataUser.employee_company_id,
            department_name,
            department_code
        );

        if (!insertDepartment) {
            return response.errorResponse(res, {message: `Maaf gagal insert department!`,});
        }

        return response.successResponse(res, {
            status: true,
            message: 'Successfully',
            data: insertDepartment,
        });

    }
}

module.exports = DepartmentCtrl;
