// Types de base
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  expires: string;
}

export interface Family {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface IsMember {
  userId: string;
  familyId: string;
  createdAt: string;
  updatedAt: string;
  family: Family;
}

export interface IsResponsible {
  userId: string;
  familyId: string;
  createdAt: string;
  updatedAt: string;
  family: Family;
}

// User avec ses relations
export interface UserWithRelations extends User {
  memberships: IsMember[];
  responsibleFor: IsResponsible[];
}

// Réponse API pour un user
export interface UserResponse {
  user: UserWithRelations;
}

// Family avec ses membres
export interface FamilyWithMembers extends Family {
  members: Array<{
    user: User;
    userId: string;
    familyId: string;
  }>;
  responsibles: Array<{
    user: User;
    userId: string;
    familyId: string;
  }>;
}

// Réponse API pour une famille
export interface FamilyResponse {
  family: FamilyWithMembers;
}

export interface AllFamiliesResponse {
  families: FamilyWithMembers[];
}

//type pour creer une famille

export interface newFam {
  name: string;
  userId: string;
}
