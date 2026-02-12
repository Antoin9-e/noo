import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.getUser(userId!),
    enabled: !!userId, //En gros si pas de userId ca ne lance pas la requête
    staleTime: 1000 * 60 * 5,
  });
}
