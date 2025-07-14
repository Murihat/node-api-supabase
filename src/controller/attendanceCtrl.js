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

async function attendanceCtrl(req, res) {
  const { employee_id, company_id, latitude, longitude, picture, note, type } = req.body;

  // Validasi input wajib
  if (!employee_id || !latitude || !longitude || !type) {
    return errorResponse(res, 400, 'Data tidak lengkap');
  }

  if (!picture) {
    return errorResponse(res, 400, 'Wajib mengirimkan foto absensi');
  }

  if (type !== 'clock_in' && type !== 'clock_out') {
    return errorResponse(res, 400, 'Tipe absensi tidak valid (clock_in / clock_out)');
  }

  try {
    // Ambil lokasi aktif dan validasi radius
    const locations = await getValidLocations(employee_id, company_id);
    if (!locations.length) return errorResponse(res, 404, 'Tidak ada lokasi aktif ditemukan');

    const validLocation = locations
      .map(loc => ({
        ...loc,
        distance: haversine(+latitude, +longitude, +loc.latitude, +loc.longitude)
      }))
      .filter(loc => loc.distance <= (loc.radius_in_meter || 100))
      .sort((a, b) => a.distance - b.distance)[0];

    if (!validLocation) return errorResponse(res, 403, 'Diluar radius lokasi absensi');

    if (type === 'clock_in') {
      // Cek sudah clock-in hari ini
      const existingClockIn = await checkClockInToday(employee_id);
      if (existingClockIn) return errorResponse(res, 409, 'Clock-in sudah dilakukan hari ini');

      await clockInAttendance({
        employee_id,
        company_id,
        attendance_location_id: validLocation.attendance_location_id,
        latitude,
        longitude,
        picture_clockin: picture,
        note
      });

      return successResponse(res, 200, 'Clock-in berhasil', {
        location: validLocation.location_name,
        distance_meter: parseFloat(validLocation.distance.toFixed(2)),
        type: 'clock_in'
      });

    } else if (type === 'clock_out') {
      // Cek clock-in hari ini
      const clockInRow = await checkClockInToday(employee_id);

      if (clockInRow) {
        // Cek sudah clock-out
        if (clockInRow.clock_out) return errorResponse(res, 409, 'Clock-out sudah dilakukan hari ini');

        await clockOutAttendance({
          attendance_id: clockInRow.attendance_id,
          latitude,
          longitude,
          picture_clockout: picture,
          note
        });

        return successResponse(res, 200, 'Clock-out berhasil', {
          location: validLocation.location_name,
          distance_meter: parseFloat(validLocation.distance.toFixed(2)),
          type: 'clock_out'
        });
      }

      // Jika belum ada clock-in, cek clock-out sudah ada hari ini?
      const clockOutRow = await checkClockOutToday(employee_id);
      if (clockOutRow) return errorResponse(res, 409, 'Clock-out sudah dilakukan hari ini');

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

      return successResponse(res, 200, 'Clock-out berhasil tanpa clock-in', {
        location: validLocation.location_name,
        distance_meter: parseFloat(validLocation.distance.toFixed(2)),
        type: 'clock_out_no_clockin'
      });
    }

  } catch (err) {
    console.error('Attendance error:', err);
    return errorResponse(res, 500, 'Terjadi kesalahan server', { error: err.message });
  }
}

async function attendanceHistoryCtrl(req, res) {
  const { employee_id, days } = req.body;
  const daysNumber = days ? parseInt(days) : 20; // default 20 hari

  if (!employee_id) {
    return errorResponse(res, 400, 'Employee ID diperlukan');
  }

  try {
    const history = await getAttendanceHistory(employee_id, daysNumber);
    return successResponse(res, 200, 'Riwayat absensi berhasil diambil', history);
  } catch (error) {
    console.error('Error ambil riwayat absensi:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan server', { error: error.message });
  }
}



module.exports = { attendanceCtrl, attendanceHistoryCtrl };
