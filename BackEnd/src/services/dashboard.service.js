import { api } from "./api";

const dashboardService = {
  getStaff: async () => {
    const res = await api.get("/dashboards/staff");
    return res.data;
  },

  getAdmin: async () => {
    const res = await api.get("/dashboards/admin");
    return res.data;
  },
};

export default dashboardService;
