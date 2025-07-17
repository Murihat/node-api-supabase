const {
    checkCompanyExists,
    createCompany,
    checkCompanySubscriptionExists,
    createCompanySubscription
  } = require('../models/companyModel');
  
  const { getPlanById } = require('../models/planModel');
  const { successResponse } = require('../helpers/response');
  
  // ✅ CREATE COMPANY ONLY
  const createCompanyController = async (req, res) => {
    const company  = req.body;
  
    // Step 1: Cek company sudah ada
    const { exists, data: existingData, error: checkError } = await checkCompanyExists({
      identity_company: company.identity_company,
      name: company.name,
      email: company.email,
    });
  
    if (checkError) {
      console.error('Cek company error:', checkError);
      return successResponse(res, {
        code: 200, status: false, message: checkError, data: {}
      });
    }
  
    if (exists) {
      return successResponse(res, {
        code: 200, status: false, message: 'Company sudah terdaftar', data: {}
      });
    }
  
    // Step 2: Insert company
    const { data, error } = await createCompany(company);
    if (error) {
      console.error('Company insert error:', error);
      return successResponse(res, {
        code: 200, status: false, message: error.message, data: {}
      });
    }
  
    return successResponse(res, {
      code: 200, status: true, message: 'Company created successfully', data
    });
  };
  
  // ✅ CEK SUBSCRIPTION BERDASARKAN COMPANY_ID
  const checkCompanySubscriptionController = async (req, res) => {
    const { company_id } = req.params;
  
    if (!company_id) {
      return successResponse(res, {
        code: 400, status: false, message: 'company_id wajib diisi', data: {}
      });
    }
  
    const { exists, data, error } = await checkCompanySubscriptionExists(company_id);
  
    if (error) {
      console.error('Cek subscription error:', error);
      return successResponse(res, {
        code: 500, status: false, message: error, data: {}
      });
    }
  
    if (!exists) {
      return successResponse(res, {
        code: 200, status: false, message: 'Tidak ditemukan subscription aktif untuk company ini', data: {}
      });
    }
  
    return successResponse(res, {
      code: 200, status: true, message: 'Subscription aktif ditemukan', data
    });
  };
  
  // ✅ CREATE SUBSCRIPTION ONLY
  const createSubscriptionController = async (req, res) => {
    const { company_id, company_plan_id, start_date, end_date } = req.body;
  
    // Step 1: Cek plan valid
    const { data: plan, error: planError } = await getPlanById(company_plan_id);
    if (planError || !plan) {
      return successResponse(res, {
        code: 200, status: false, message: 'Plan not found', data: {}
      });
    }
  
    // Step 2: Insert subscription
    const payload = {
      company_id,
      company_plan_id,
      start_date,
      end_date,
      is_active: true,
      plan_name: plan.plan_name,
      plan_price: plan.price_month,
      plan_discount: plan.discount,
      max_limit: plan.max_user_limit
    };
  
    const { data, error } = await createCompanySubscription(payload);
    if (error) {
      return successResponse(res, {
        code: 200, status: false, message: error.message, data: {}
      });
    }
  
    return successResponse(res, {
      code: 200, status: true, message: 'Company subscription created', data: data[0]
    });
  };
  
  // ✅ EXPORT
  module.exports = {
    createCompanyController,
    checkCompanySubscriptionController,
    createSubscriptionController
  };
  