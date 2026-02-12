import { LogIn, FileUser, LogOut, User } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { Link, useNavigate } from "react-router-dom";
import { DropdownFamilies } from "../families/DropdownFamilies";
import type { UserWithRelations } from "@/types";
import React from "react";

export default function AuthTab() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [familyData, setFamilyData] = React.useState<UserWithRelations | null>(
    null,
  );

  React.useEffect(() => {
    const fetchFamilyData = async () => {
      if (session) {
        const response = await fetch(
          `http://localhost:3000/api/users/${session.user.id}`,
        );
        const data = await response.json();
        setFamilyData(data.user);
      }
    };
    fetchFamilyData();
  }, [session]);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut();
    navigate("/signin", { replace: true });
  };

  if (session) {
    return (
      <div className=" flex space-x-4 mr-6 items-center">
        <div>
          <DropdownFamilies data={familyData} />
        </div>
        <div>
          <Link to="/profile">
            {" "}
            <User className="inline mr-2 mb-1" size={16} />
            {session.user?.name}
          </Link>
        </div>
        <button onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="inline mr-2 mb-1" size={16} />
          Logout
        </button>
      </div>
    );
  }
  return (
    <div className=" flex space-x-4 mr-6">
      <div>
        <Link to="/signin">
          {" "}
          <LogIn className="inline mr-2 mb-1" size={16} />
          Login
        </Link>
      </div>

      <Link to="/signup">
        <FileUser className="inline mr-2 mb-1" size={16} />
        Register
      </Link>
    </div>
  );
}
