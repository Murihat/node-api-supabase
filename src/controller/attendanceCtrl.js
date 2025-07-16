const {
  getValidLocations,
  clockInAttendance,
  clockOutAttendance,
  checkClockInToday,
  checkClockOutToday,
  insertClockOut,
  getAttendanceHistory, 
} = require('../models/attendanceModel');
const { successResponse, errorResponse } = require('../helpers/response');
const haversine = require('../helpers/haversine');
const { getEmployeeDetailByToken } = require('../models/employeeModel');

async function attendanceCtrl(req, res) {
  const { token, latitude, longitude, picture, note, type } = req.body;


  // Validasi token
  if (!token) return successResponse(res, {
    code: 200,
    status: false,
    message: 'Unauthorized, token tidak ditemukan',
    data: {}
  });

  // Validasi input wajib
  if (!latitude || !longitude || !type) {
    return successResponse(res, {
      code: 200,
      status: false,
      message: 'Data tidak lengkap',
      data: {}
    });
  }

  if (!picture) {
    return successResponse(res, {
      code: 200,
      status: false,
      message: 'Wajib mengirimkan foto absensi',
      data: {}
    });
  }

  if (type !== 'clock_in' && type !== 'clock_out') {
    return successResponse(res, {
      code: 200,
      status: false,
      message: "Tipe absensi tidak valid (clock_in / clock_out)",
      data: {}
    });
  }

  try {

    // Ambil employee detail dari token
    const { data: employeeData, error } = await getEmployeeDetailByToken(token);

    if (error) return successResponse(res, {
      code: 200,
      status: false,
      message: error,
      data: {}
    });

    const { employee_id, company_id } = employeeData;

    // Ambil lokasi aktif dan validasi radius
    const locations = await getValidLocations(employee_id, company_id);
    if (!locations.length) return successResponse(res, {
      code: 200,
      status: false,
      message: 'Tidak ada lokasi aktif ditemukan',
      data: {}
    });
    
    const validLocation = locations
      .map(loc => ({
        ...loc,
        distance: haversine(+latitude, +longitude, +loc.latitude, +loc.longitude)
      }))
      .filter(loc => loc.distance <= (loc.radius_in_meter || 100))
      .sort((a, b) => a.distance - b.distance)[0];

    if (!validLocation) return successResponse(res, {
      code: 200,
      status: false,
      message: 'Diluar radius lokasi absensi',
      data: {}
    });
    
    if (type === 'clock_in') {
      // Cek sudah clock-in hari ini
      const existingClockIn = await checkClockInToday(employee_id);
      if (existingClockIn) return successResponse(res, {
        code: 200,
        status: false,
        message: 'Clock-in sudah dilakukan hari ini',
        data: {}
      });
      
      await clockInAttendance({
        employee_id,
        company_id,
        attendance_location_id: validLocation.attendance_location_id,
        latitude,
        longitude,
        picture_clockin: picture,
        note
      });

      return successResponse(res, {
        code: 200,
        status: true,
        message: 'Clock-in berhasil',
        data: {
          location: validLocation.location_name,
          distance_meter: parseFloat(validLocation.distance.toFixed(2)),
          type: 'clock_in'
        }
      });

    } else if (type === 'clock_out') {
      // Cek clock-in hari ini
      const clockInRow = await checkClockInToday(employee_id);

      if (clockInRow) {
        // Cek sudah clock-out
        if (clockInRow.clock_out)  return successResponse(res, {
          code: 200,
          status: false,
          message: 'Clock-out sudah dilakukan hari ini',
          data: {}
        });
        
        await clockOutAttendance({
          attendance_id: clockInRow.attendance_id,
          latitude,
          longitude,
          picture_clockout: picture,
          note
        });

        return successResponse(res, {
          code: 200,
          status: false,
          message: 'Clock-out berhasil',
          data: {
            location: validLocation.location_name,
            distance_meter: parseFloat(validLocation.distance.toFixed(2)),
            type: 'clock_out'
          }
        });
      }

      // Jika belum ada clock-in, cek clock-out sudah ada hari ini?
      const clockOutRow = await checkClockOutToday(employee_id);
      if (clockOutRow) return successResponse(res, {
        code: 200,
        status: false,
        message: 'Clock-out sudah dilakukan hari ini',
        data: {}
      });
      
      // Insert clock-out tanpa clock-in
      await insertClockOut({
        employee_id,
        company_id,
        attendance_location_id: validLocation.attendance_location_id,
        latitude,
        longitude,
        picture_clockout: picture,
        note
      });

      return successResponse(res, {
        code: 200,
        status: true,
        message: 'Clock-out berhasil tanpa clock-in',
        data: {
          location: validLocation.location_name,
          distance_meter: parseFloat(validLocation.distance.toFixed(2)),
          type: 'clock_out_no_clockin'
        }
      });
    }

  } catch (err) {
    console.error('Attendance error:', err);
    return errorResponse(res, 500, err.message );
  }
}

async function attendanceHistoryCtrl(req, res) {
  const { token, days } = req.body;
  const daysNumber = days ? parseInt(days) : 20; // default 20 hari

  if (!token) {
    return successResponse(res, {
      code: 200,
      status: false,
      message: 'Unauthorized, token tidak ditemukan',
      data: {}
    });
  }

  try {
    const { data: employeeData, error } = await getEmployeeDetailByToken(token);

    if (error) return successResponse(res, {
      code: 200,
      status: false,
      message: error,
      data: {}
    });

    const { employee_id } = employeeData;

    const history = await getAttendanceHistory(employee_id, daysNumber);

    if (!history || history.length === 0) {
      return successResponse(res, {
        code: 200,
        status: false,
        message: 'Tidak ada riwayat absensi ditemukan',
        data: []
      });
    }

    return successResponse(res, {
      code: 200,
      status: true,
      message: 'Riwayat absensi berhasil diambil',
      data: history
    });
    
  } catch (err) {
    console.error('❌ Error ambil riwayat absensi:', err.message);
    return errorResponse(res, 500, err.message);
  }
}





module.exports = { attendanceCtrl, attendanceHistoryCtrl };
