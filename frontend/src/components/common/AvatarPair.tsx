import type { Member } from "@/types";
import { toneOf } from "@/lib/person-color";
import { Avatar } from "./Avatar";

// Avatars qui se chevauchent, comme les formes du logo
export function AvatarPair({ members, size = "xs" }: { members: Member[]; size?: "xs" | "sm" }) {
  return (
    <span className="flex -space-x-2">
      {members.map((m) => (
        <Avatar key={m.user.id} name={m.user.name} image={m.user.image} tone={toneOf(m.color)} size={size} />
      ))}
    </span>
  );
}
