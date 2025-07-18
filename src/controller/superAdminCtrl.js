//   const saveSuperadminCtrl = async (req, res) => {
//      try {
//         const { company, employee, plan_id } = req.body;

//         if (!company || !employee || !plan_id) {
//         return successResponse(res, {
//             code: 200,
//             status: false,
//             message: 'Data harap dilengkapi!',
//             data: {}
//         });
//         }


//         // ✅ Step 1: Cek apakah company sudah ada
//         const { exists, data: existingData, error: checkError } = await checkCompanyExists({
//         identity_company: company.identity_company,
//         name: company.name,
//         email: company.email,
//         identity_owner: company.identity_owner,
//         });

//         if (checkError) {
//         console.error('❌ Cek company error:', checkError);
//         return successResponse(res, {
//             code: 200,
//             status: false,
//             message: `Gagal cek company: ${checkError}`,
//             data: {}
//         });
//         }

//         if (exists) {
//         console.log('❌ Company sudah terdaftar:', existingData);
//         return successResponse(res, {
//             code: 200,
//             status: false,
//             message: 'Company sudah terdaftar',
//             data: existingData || {}
//         });
//         }


//         // 1. Insert company
//         const { data: companyData, error: companyError } = await createCompany(company);
//         if (companyError) {
//         console.error('❌ Company insert error:', companyError);
//         return successResponse(res, { code: 200, status: false, message: 'Gagal buat company', data: {} });
//         }

//         // 2. Get Plan
//         const { data: plan, error: planError } = await planModel.getPlanById(plan_id);
//         if (planError || !plan) {
//         console.error('❌ Plan error:', planError);
//         // rollback company
//         await deleteCompany(companyData.company_id);
//         return successResponse(res, { code: 200, status: false, message: 'Plan tidak ditemukan', data: {} });
//         }

//         // 3. Cek company sudah punya subscription?
//         const { data: existingSub, error: subError } = await planModel.getCompanyActiveSubscription(companyData.company_id);
//         if (subError) {
//         await deleteCompany(companyData.company_id);
//         return successResponse(res, { code: 200, status: false, message: `Gagal cek subscription: ${subError.message}`, data: {} });
//         }

//         if (existingSub && existingSub.length > 0) {
//         await deleteCompany(companyData.company_id);
//         return successResponse(res, { code: 200, status: false, message: 'Company sudah memiliki subscription aktif', data: {} });
//         }

//         // 4. Insert subscription
//         const start_date = new Date();
//         const end_date = new Date();
//         end_date.setMonth(end_date.getMonth() + 1);

//         const formatDate = (date) => date.toISOString().split('T')[0];

//         const planPayload = {
//         company_id: companyData.company_id,
//         company_plan_id: plan.company_plan_id,
//         start_date: formatDate(start_date),
//         end_date: formatDate(end_date),
//         is_active: true,
//         plan_name: plan.plan_name,
//         plan_price: plan.price_month,
//         plan_discount: plan.discount,
//         max_limit: plan.max_user_limit
//         };

//         const { data: planData, error: errorPlan } = await planModel.createCompanySubscription(planPayload);
//         if (errorPlan) {
//         await deleteCompany(companyData.company_id);
//         return successResponse(res, { code: 200, status: false, message: `Gagal buat subscription: ${errorPlan.message}`, data: {} });
//         }

//         // 5. Validasi Employee
//         if (!employee.name || !employee.phone || !employee.email || !employee.password) {
//         await deleteCompany(companyData.company_id);
//         return successResponse(res, { code: 200, status: false, message: 'Data employee tidak lengkap', data: {} });
//         }

//         const hashed = hashPassword(employee.password);
//         const join_date = formatDate(new Date());

//         const payload = {
//         name: employee.name,
//         phone: employee.phone,
//         email: employee.email,
//         password: hashed,
//         company_id: companyData.company_id,
//         employee_level_id: 7,
//         join_date
//         };

//         // 6. Insert Employee
//         const { data: employeeData, error: employeeError } = await insertEmployee(payload);
//         if (employeeError) {
//         console.error('❌ Employee insert error:', employeeError.message);
//         // rollback semua
//         await planModel.deleteCompanySubscription(companyData.company_id);
//         await deleteCompany(companyData.company_id);
//         return successResponse(res, { code: 200, status: false, message: `Gagal buat employee: ${employeeError.message}`, data: {} });
//         }

//         return successResponse(res, {
//         code: 200,
//         status: true,
//         message: '✅ Superadmin berhasil ditambahkan',
//         data: employeeData
//         });
//   } catch (error) {
//     console.error('❌ Fatal error:', error.message);
//     return errorResponse(res, 500, 'Terjadi kesalahan server', error.message);
//   }
// }