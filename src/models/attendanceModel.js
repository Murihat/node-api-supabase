const { supabase } = require('../config/supabase');

// ✅ Ambil lokasi aktif
async function getValidLocations(employee_id, company_id) {
  const { data, error } = await supabase
    .from('tb_attendance_location')
    .select('*')
    .eq('is_active', true)
    .or(`company_id.eq.${company_id},employee_id.eq.${employee_id}`);

  if (error) throw error;
  return data;
}

// ✅ Cek apakah sudah clock-in hari ini (UTC)
async function checkClockInToday(employee_id) {
  const todayUTC = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from('tb_attendance')
    .select('attendance_id')
    .eq('employee_id', employee_id)
    .gte('clock_in', todayUTC)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data; // null jika belum clock-in
}

// ✅ Simpan clock-in (insert row baru)
async function insertClockIn({
  employee_id,
  company_id,
  attendance_location_id,
  latitude,
  longitude,
  picture_clockin,
  note
}) {
  const now = new Date().toISOString();

  const { error } = await supabase.from('tb_attendance').insert({
    employee_id,
    company_id,
    attendance_location_id,
    clock_in: now,
    latitude,
    longitude,
    picture_clockin,
    note,
    created_at: now
  });

  if (error) throw error;
  return true;
}

// Update clock-in
async function clockInUpdateAttendance({ attendance_id, latitude, longitude, attendance_location_id, picture_clockin, note }) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('tb_attendance')
    .update({
      clock_in: now,
      latitude,
      longitude,
      attendance_location_id,
      picture_clockin,
      note
    })
    .eq('attendance_id', attendance_id);
  if (error) throw error;
  return true;
}


// Cek clock-out hari ini (tanpa clock-in)
async function checkClockOutToday(employee_id) {
  const todayUTC = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('tb_attendance')
    .select('attendance_id')
    .eq('employee_id', employee_id)
    .gte('clock_out', todayUTC)
    .not('clock_out', 'is', null)
    .maybeSingle();

  if (error) throw error;
  return data;
}


// Update clock-out
async function clockOutUpdateAttendance({ attendance_id, latitude, longitude, attendance_location_id_clockout, picture_clockout, note }) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('tb_attendance')
    .update({
      clock_out: now,
      latitude_clockout:latitude,
      longitude_clockout:longitude,
      attendance_location_id_clockout,
      picture_clockout,
      note_clockout:note,
    })
    .eq('attendance_id', attendance_id);
  if (error) throw error;
  return true;
}

// Insert clock-out tanpa clock-in
async function insertClockOut({ employee_id, company_id, attendance_location_id_clockout, latitude, longitude, picture_clockout, note }) {
  const now = new Date().toISOString();
  const { error } = await supabase.from('tb_attendance').insert({
    employee_id,
    company_id,
    clock_out: now,
    latitude_clockout:latitude,
    longitude_clockout:longitude,
    attendance_location_id_clockout,
    picture_clockout,
    note_clockout:note,
    created_at: now
  });
  if (error) throw error;
  return true;
}

async function getAttendanceHistory(employee_id, days = 31) {
  const now = new Date();

  let query = supabase
    .from('tb_attendance')
    .select('*')
    .eq('employee_id', employee_id);

  if (days === 0 || days === 1) {
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const tomorrowStart = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
    query = query.gte('created_at', todayStart).lt('created_at', tomorrowStart);
  } else {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceISO = sinceDate.toISOString();
    query = query.gte('created_at', sinceISO);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  if (!data || data.length === 0) return [];

  function convertToJakartaTime(isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  const convertedData = data.map(item => ({
    ...item,
    clock_in_jakarta: convertToJakartaTime(item.clock_in),
    clock_out_jakarta: convertToJakartaTime(item.clock_out)
  }));

  return convertedData;
}



// Ambil employee detail dari token
const getEmployeeDetailByToken = async (token) => {
  // Step 1: Cek token di m_login_employee
  const { data: loginData, error: loginError } = await supabase
    .from('m_login_employee')
    .select('employee_id')
    .eq('token', token)
    .single();

  if (loginError) return { error: `Token tidak valid: ${loginError.message}` };
  if (!loginData) return { error: 'Token tidak ditemukan' };

  const employee_id = loginData.employee_id;
  if (!employee_id) return { error: 'employee_id tidak ditemukan dalam login' };

  // Step 2: Get employee detail + join
  const { data: employeeData, error: employeeError } = await supabase
    .from('tb_employee')
    .select(`
      *,
      tb_company:company_id (company_id, name, address),
      m_employee_level:employee_level_id (employee_level_id, level_name, level_code)
    `)
    .eq('employee_id', employee_id)
    .single();

  if (employeeError) return { error: `Data employee gagal diambil: ${employeeError.message}` };
  if (!employeeData) return { error: 'Data employee tidak ditemukan' };

  if (!employeeData.is_active) return { error: 'Akun karyawan tidak aktif' };

  const { tb_company, m_employee_level, ...flatEmployee } = employeeData;

  return {
    data: {
      ...flatEmployee,
      company_name: tb_company?.name || null,
      company_address: tb_company?.address || null,
      employee_level_name: m_employee_level?.level_name || null,
      employee_level_code: m_employee_level?.level_code || null,
    }
  };
};


module.exports = {
  getValidLocations,
  checkClockInToday,
  clockInUpdateAttendance,
  checkClockOutToday,
  clockOutUpdateAttendance,
  insertClockIn,
  insertClockOut,
  getAttendanceHistory,
  getEmployeeDetailByToken,
};
