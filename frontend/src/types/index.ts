export type PersonColor = "VIOLET" | "ORANGE";
export type Role = "ADMIN" | "MEMBER";

export interface FamilySummary {
  id: string;
  name: string;
  timezone: string;
}

export interface Me {
  id: string;
  name: string;
  email: string;
  image: string | null;
  memberships: Array<{ role: Role; color: PersonColor; family: FamilySummary }>;
}

export interface Member {
  role: Role;
  color: PersonColor;
  user: { id: string; name: string; image: string | null };
}

export interface Family extends FamilySummary {
  memberships: Member[];
}
