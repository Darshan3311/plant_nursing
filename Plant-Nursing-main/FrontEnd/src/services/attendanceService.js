// ===== Frontend: src/services/attendanceService.js =====
import axios from '../lib/axios';
export const addAttendance = (data) => axios.post('/attendance', data);
export const fetchMonthlyAttendance = (laborId, month, year) =>
  axios.get(`/attendance/${laborId}/${month}/${year}`);
