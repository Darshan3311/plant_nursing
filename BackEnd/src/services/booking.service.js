import { api } from "./api"; // make sure api.js has your axios instance

const bookingService = {
  create: async (data) => {
    const res = await api.post("/bookings", data);
    return res.data;
  },

  getAll: async (params) => {
    const res = await api.get("/bookings", { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },

  delete: async (id) => {
    await api.delete(`/bookings/${id}`);
  },

  promote: async (id) => {
    const res = await api.post(`/bookings/${id}/status`, { promote: true });
    return res.data;
  },
};

export default bookingService;
