import { api } from "@/api/axios";
import type { newFam } from "@/types";

export const familyService = {
  getAllFamilies: async () => {
    const { data } = await api.get("/api/families");
    return data;
  },
  getFamily: async (id: string) => {
    const { data } = await api.get(`/api/families/${id}`);
    return data;
  },

  createFamily: async (newfam: newFam) => {
    const { data } = await api.post("/api/families/create", newfam);
    return data;
  },
};
