import { api } from "./api";

const farmerService = {
  getAll: async () => {
    const res = await api.get("/farmers");
    return res.data;
  },

  create: async (data) => {
    const res = await api.post("/farmers", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/farmers/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    await api.delete(`/farmers/${id}`);
  },
};

export default farmerService;
