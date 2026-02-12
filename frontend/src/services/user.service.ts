import { api } from "../api/axios";
import type { UserWithRelations } from "@/types";

export const userService = {
  getUser: async (id: string): Promise<{ user: UserWithRelations }> => {
    const { data } = await api.get(`/api/users/${id}`);
    return data;
  },
};
