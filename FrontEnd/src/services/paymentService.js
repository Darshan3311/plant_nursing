// ===== Frontend: src/services/paymentService.js =====
import axios from '../lib/axios';
export const addPayment = (data) => axios.post('/payment', data);
export const fetchMonthlyPayments = (laborId, month, year) =>
  axios.get(`/payment/${laborId}/${month}/${year}`);