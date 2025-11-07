import { api } from "./api";

const invoiceService = {
  getByBookingId: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}/invoice`);
    return res.data;
  },

  downloadPDF: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}/invoice`, {
      responseType: "blob",
      params: { format: "pdf" },
    });
    return res.data;
  },
};

export default invoiceService;
