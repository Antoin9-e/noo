import { LogIn, FileUser, LogOut, User } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { Link, useNavigate } from "react-router-dom";
import { DropdownFamilies } from "../families/DropdownFamilies";

export default function AuthTab() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut();
    navigate("/signin", { replace: true });
  };

  if (session) {
    return (
      <div className=" flex space-x-4 mr-6 items-center">
        <div>
          <DropdownFamilies />
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
