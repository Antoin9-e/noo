import { Navigate, useParams } from "react-router-dom";
import Header from "@/components/page/Header";
import { useSession } from "@/lib/auth-client";
import React from "react";
import type { FamilyWithMembers, User } from "@/types";

export default function FamilyDashboard() {
  const { familyId } = useParams();
  const { data: session } = useSession();
  const [family, setFamily] = React.useState<FamilyWithMembers | null>(null);
  const [users, setUsers] = React.useState<Array<User>>([]);

  React.useEffect(() => {
    family?.members.forEach((member) => {
      setUsers((prevUsers) => {
        // Vérifie si l'utilisateur est déjà dans la liste
        if (prevUsers.some((user) => user.id === member.user.id)) {
          return prevUsers; // Ne pas l'ajouter à nouveau
        }
        return [...prevUsers, member.user];
      });
    });
  }, [family]);

  React.useEffect(() => {
    users.forEach((user) => {
      if (!(user.id === session?.user.id)) {
        return <Navigate to="/" replace />;
      }
    });
  }, [users, session]);

  React.useEffect(() => {
    const fetchFamily = async () => {
      // Clear les données avant le fetch
      setFamily(null);
      setUsers([]);

      const response = await fetch(
        `http://localhost:3000/api/families/${familyId}`,
      );
      const data = await response.json();
      if (response.ok) {
        setFamily(data.family);
      }
    };
    fetchFamily();
  }, [familyId]);

  if (!session) {
    return <Navigate to="/signin" replace />;
  }
  return (
    <div>
      <Header />
      <div>Family Dashboard for family {familyId}</div>
      {family && <div>{family.name}</div>}
      {users.map((user) => (
        <div key={user.id}>
          <p>
            {user.name} - {user.email}
          </p>
        </div>
      ))}
    </div>
  );
}
