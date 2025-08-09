const superAdminModel = require('../../models/superadmin/superAdmin.model');
const response = require('../../helpers/response');
const { hashPassword } = require('../../helpers/tokenHelper')
const db = require('../../config/mysqli').pool;

const SuperCtrl = {
    async simpanSuperAdmin(req, res) {
        const conn = await db.getConnection();

        try {
            const { company, employee, plan_id } = req.body;

            if (!company || !employee || !plan_id) {
                conn.release();
                return response.errorResponse(res, { message: 'Data harap dilengkapi!' });
            }

            await conn.beginTransaction();

            // Cek apakah company sudah ada
            const { exists, error: checkError } = await superAdminModel.checkCompanyExists(company, conn);

            if (checkError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: `Gagal cek company: ${checkError.message || checkError}` });
            }

            if (exists) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: 'Company sudah terdaftar' });
            }

            // Insert company
            const { data: companyData, error: companyError } = await superAdminModel.createCompany(company, conn);
            if (companyError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: 'Gagal buat Company' });
            }

            // Ambil plan
            const { data: plan, error: planError } = await superAdminModel.getPlanById(plan_id, conn);
            if (planError || !plan) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: 'Plan tidak ditemukan' });
            }

            // Cek subscription aktif
            const { data: existingSub, error: subError } = await superAdminModel.getCompanyActiveSubscription(companyData.company_id, conn);
            if (subError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: `Gagal cek subscription: ${subError.message}` });
            }

            if (existingSub && existingSub.length > 0) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: 'Company sudah memiliki subscription aktif' });
            }

            // Insert subscription
            const formatDate = (date) => date.toISOString().split('T')[0];
            const start_date = new Date();
            const end_date = new Date();
            end_date.setMonth(end_date.getMonth() + 1);

            const planPayload = {
                company_id: companyData.company_id,
                company_plan_id: plan.company_plan_id,
                start_date: formatDate(start_date),
                end_date: formatDate(end_date),
                is_active: true,
                plan_name: plan.plan_name,
                plan_price: plan.price_month,
                plan_discount: plan.discount,
                max_limit: plan.max_user_limit,
            };

            const { data: planData, error: errorPlan } = await superAdminModel.createCompanySubscription(planPayload, conn);
            if (errorPlan) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: `Gagal buat subscription: ${errorPlan.message}` });
            }

            // Cek apakah sudah ada super admin untuk company ini
            const { data: existingSuperAdmin, error: checkSuperAdminError } = await superAdminModel.getCompanySuperAdmin(companyData.company_id, conn);
            if (checkSuperAdminError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, { message: `Gagal cek Super Admin: ${checkSuperAdminError.message}` });
            }

            if (existingSuperAdmin) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, { message: 'Company sudah memiliki Super Admin' });
            }

            // Insert atau ambil level Super Admin
            let { data: levelData, error: levelError } = await superAdminModel.getOrCreateEmployeeLevel({
                company_id: companyData.company_id,
                level_name: 'Super Admin',
                level_code: 'super_admin',
            }, conn);

            if (levelError || !levelData) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, { message: `Gagal ambil/buat level: ${levelError?.message}` });
            }

            // Validasi employee
            if (!employee.name || !employee.phone || !employee.email || !employee.password) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: 'Data employee tidak lengkap' });
            }

            // Insert employee
            const hashed = hashPassword(employee.password);
            const join_date = formatDate(new Date());

            const payload = {
                name: employee.name,
                phone: employee.phone,
                email: employee.email,
                password: hashed,
                company_id: companyData.company_id,
                employee_level_id: levelData.employee_level_id,
                join_date,
            };

            const { data: employeeData, error: employeeError } = await superAdminModel.insertEmployee(payload, conn);
            if (employeeError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res,{ message: `Gagal buat employee: ${employeeError.message}` });
            }

            await conn.commit();
            return response.successResponse(res, {
                message: '✅ Superadmin berhasil ditambahkan',
                data: employeeData,
            });

        } catch (error) {
            await conn.rollback();
            return response.errorResponse(res,{ message: `Transaksi gagal ${error.message}` });
        } finally {
            conn.release();
        }
    },
}

module.exports = SuperCtrl;
