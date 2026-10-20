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

export interface NooEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  note: string | null;
  isCountdown: boolean;
  createdById: string;
  participantIds: string[];
}

export type WishCategory = "MOVIE" | "SERIES" | "RESTAURANT" | "OUTING" | "TRIP" | "GIFT" | "OTHER";
export type Vote = "YES" | "NO";

export interface Wish {
  id: string;
  category: WishCategory;
  title: string;
  note: string | null;
  url: string | null;
  imageUrl: string | null;
  externalId: string | null;
  year: number | null;
  forUserId: string | null;
  status: "OPEN" | "DONE";
  doneAt: string | null;
  createdById: string;
  createdAt: string;
  votes: Array<{ userId: string; vote: Vote | null; rating: number | null }>;
  yesBy: string[];
  myVote: Vote | null;
  isMatch: boolean;
}

export interface MovieResult {
  externalId: string;
  category: "MOVIE" | "SERIES";
  title: string;
  year: number | null;
  imageUrl: string | null;
  overview: string;
}
