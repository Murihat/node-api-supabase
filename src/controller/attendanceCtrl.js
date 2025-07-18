const attendanceModel = require('../models/attendanceModel');
const haversine = require('../helpers/haversine');
const { getEmployeeDetailByToken } = require('../models/employeeModel');
const response = require('../helpers/response');


async function attendanceSave(req, res) {
  const { token, latitude, longitude, picture, note, type } = req.body;

  // Validasi token
  if (!token) return response.successResponse(res, {
    code: 200,
    status: false,
    message: 'Unauthorized, token tidak ditemukan',
    data: {}
  });

  // Validasi input wajib
  if (!latitude || !longitude || !type) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'Data tidak lengkap',
      data: {}
    });
  }

  if (!picture) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'Wajib mengirimkan foto absensi',
      data: {}
    });
  }

  if (type !== 'clock_in' && type !== 'clock_out') {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: "Tipe absensi tidak valid (clock_in / clock_out)",
      data: {}
    });
  }

  try {

    // Ambil employee detail dari token
    const { data: employeeData, error } = await attendanceModel.getEmployeeDetailByToken(token);

    if (error) return response.successResponse(res, {
      code: 200,
      status: false,
      message: error,
      data: {}
    });

    const { employee_id, company_id } = employeeData;

    // Ambil lokasi aktif dan validasi radius
    const locations = await attendanceModel.getValidLocations(employee_id, company_id);

    if (!locations.length) return response.successResponse(res, {
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

    if (!validLocation) return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'Diluar radius lokasi absensi',
      data: {}
    });
    
    if (type === 'clock_in') {
      // Cek sudah clock-in hari ini
      const existingClockIn = await attendanceModel.checkClockInToday(employee_id);

      if (existingClockIn) return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Clock-in sudah dilakukan hari ini',
        data: {}
      });


      const clockoutInRow = await attendanceModel.checkClockOutToday(employee_id);

      if (clockoutInRow)  return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Clock-out sudah dilakukan hari ini',
        data: {}
      });
     
      await attendanceModel.insertClockIn({
        employee_id,
        company_id,
        attendance_location_id: validLocation.attendance_location_id,
        latitude,
        longitude,
        picture_clockin: picture,
        note
      });
      

      return response.successResponse(res, {
        code: 200,
        status: true,
        message: 'Clock-in berhasil',
        data: {
          location: validLocation.location_name,
          distance_meter: parseFloat(validLocation.distance.toFixed(2)),
          type: 'clock_in'
        }
      });

    } 
    
    
    if (type === 'clock_out') {
      // Cek clock-in hari ini
      const clockInRow = await attendanceModel.checkClockInToday(employee_id);

      if (clockInRow) {
        // Cek sudah clock-out
        const clockoutInRow = await attendanceModel.checkClockOutToday(employee_id);
        if (clockoutInRow)  return response.successResponse(res, {
          code: 200,
          status: false,
          message: 'Clock-out sudah dilakukan hari ini',
          data: {}
        });
        
        await attendanceModel.clockOutUpdateAttendance({
          attendance_id: clockInRow.attendance_id,
          attendance_location_id_clockout: validLocation.attendance_location_id,
          latitude,
          longitude,
          picture_clockout: picture,
          note
        });

        return response.successResponse(res, {
          code: 200,
          status: true,
          message: 'Clock-out berhasil',
          data: {
            location: validLocation.location_name,
            distance_meter: parseFloat(validLocation.distance.toFixed(2)),
            type: 'clock_out'
          }
        });
      }
      
      // Insert clock-out tanpa clock-in
      await attendanceModel.insertClockOut({
        employee_id,
        company_id,
        attendance_location_id_clockout: validLocation.attendance_location_id,
        latitude,
        longitude,
        picture_clockout: picture,
        note
      });

      return response.successResponse(res, {
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


    return response.successResponse(res, {
      code: 200,
      status: true,
      message: 'type absensi tidak tersedia',
      data: {}
    });

  } catch (err) {
    console.error('Attendance error:', err);
    return response.errorResponse(res, 500, err.message );
  }
}

async function attendanceHistoryCtrl(req, res) {
  const { token, days } = req.body;
  const daysNumber = days ? parseInt(days) : 31;

  if (!token) {
    return response.successResponse(res, {
      code: 200,
      status: false,
      message: 'Unauthorized, token tidak ditemukan',
      data: {}
    });
  }

  try {
    const { data: employeeData, error } = await attendanceModel.getEmployeeDetailByToken(token);

    if (error) return response.successResponse(res, {
      code: 200,
      status: false,
      message: error,
      data: {}
    });

    const { employee_id } = employeeData;

    const history = await attendanceModel.getAttendanceHistory(employee_id, daysNumber);

    if (!history || history.length === 0) {
      return response.successResponse(res, {
        code: 200,
        status: false,
        message: 'Tidak ada riwayat absensi ditemukan',
        data: []
      });
    }

    return response.successResponse(res, {
      code: 200,
      status: true,
      message: 'Riwayat absensi berhasil diambil',
      data: history
    });
    
  } catch (err) {
    console.error('❌ Error ambil riwayat absensi:', err.message);
    return response.errorResponse(res, 500, err.message);
  }
}


module.exports = { attendanceSave, attendanceHistoryCtrl };
