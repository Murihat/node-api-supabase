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
                return response.successResponse(res, {
                    code: 200,
                    status: false,
                    message: 'Data harap dilengkapi!',
                    data: {},
                });
            }

            await conn.beginTransaction();

            // Cek apakah company sudah ada
            const { exists, error: checkError } = await superAdminModel.checkCompanyExists(company, conn);

            if (checkError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, `Gagal cek company: ${checkError.message || checkError}`);
            }

            if (exists) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, 'Company sudah terdaftar');
            }

            // Insert company
            const { data: companyData, error: companyError } = await superAdminModel.createCompany(company, conn);
            if (companyError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, 'Gagal buat Company');
            }

            // Ambil plan
            const { data: plan, error: planError } = await superAdminModel.getPlanById(plan_id, conn);
            if (planError || !plan) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, 'Plan tidak ditemukan');
            }

            // Cek subscription aktif
            const { data: existingSub, error: subError } = await superAdminModel.getCompanyActiveSubscription(companyData.company_id, conn);
            if (subError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, `Gagal cek subscription: ${subError.message}`);
            }

            if (existingSub && existingSub.length > 0) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, 'Company sudah memiliki subscription aktif');
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
                return response.errorResponse(res, 200, `Gagal buat subscription: ${errorPlan.message}`);
            }

            // Validasi employee
            if (!employee.name || !employee.phone || !employee.email || !employee.password) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, 'Data employee tidak lengkap');
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
                user_status_id: 1,
                join_date,
            };

            const { data: employeeData, error: employeeError } = await superAdminModel.insertEmployee(payload, conn);
            if (employeeError) {
                await conn.rollback();
                conn.release();
                return response.errorResponse(res, 200, `Gagal buat employee: ${employeeError.message}`);
            }

            await conn.commit();
            return response.successResponse(res, {
                code: 200,
                status: true,
                message: '✅ Superadmin berhasil ditambahkan',
                data: employeeData,
            });

        } catch (error) {
            await conn.rollback();
            console.error('❌ Transaksi gagal:', error.message);
            return response.errorResponse(res, 500, 'Transaksi gagal', error.message);
        } finally {
            conn.release();
        }
    },


    // ✅ Get List Superadmin (Optional)
    async getSuperadminList(req, res) {
        try {
            const { data, error } = await superAdminModel.getAllSuperadmins();
            if (error) throw error;

            if (!data || data.length === 0) {
            return response.successResponse(res, {
                code: 200,
                status: true,
                message: 'Data tidak ditemukan',
                data: [],
            });
            }

            return response.successResponse(res, {
            code: 200,
            status: true,
            message: 'Berhasil ambil data',
            data,
            });
        } catch (error) {
            return response.errorResponse(res, 500, 'Gagal ambil data superadmin', error.message);
        }
    },

  // ✅ Get Detail by ID (Example)
  async getSuperadminById(req, res) {
    try {
      const id = req.params.id;
      const { data, error } = await superAdminModel.getSuperadminById(id);
      if (error || !data) throw new Error('Superadmin tidak ditemukan');
      return response.successResponse(res, { code: 200, status: true, message: 'Detail ditemukan', data });
    } catch (error) {
      return response.errorResponse(res, 404, 'Gagal ambil detail', error.message);
    }
  },

  // ✅ Update Superadmin
  async updateSuperadmin(req, res) {
    try {
      const id = req.params.id;
      const { body } = req;
      const { data, error } = await superAdminModel.updateSuperadminById(id, body);
      if (error) throw error;
      return response.successResponse(res, { code: 200, status: true, message: 'Berhasil update', data });
    } catch (error) {
      return response.errorResponse(res, 500, 'Gagal update data', error.message);
    }
  },

  // ✅ Delete Superadmin
  async deleteSuperadmin(req, res) {
    try {
      const id = req.params.id;
      const { error } = await superAdminModel.deleteSuperadminById(id);
      if (error) throw error;
      return response.successResponse(res, { code: 200, status: true, message: 'Berhasil dihapus', data: {} });
    } catch (error) {
      return response.errorResponse(res, 500, 'Gagal hapus data', error.message);
    }
  }
};

module.exports = SuperCtrl;
