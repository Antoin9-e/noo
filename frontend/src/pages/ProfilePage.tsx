import Header from "@/components/page/Header";
import { useSession } from "@/lib/auth-client";
import { Navigate } from "react-router-dom";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <Navigate to="/signin" replace />;
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Profile Page</h1>
        <p className="text-gray-700">This is the profile page content.</p>
        {session.user.image && (
          <img
            src={session.user.image}
            alt="User Avatar"
            className="w-32 h-32 rounded-full mt-4"
          />
        )}
      </div>
    </div>
  );
}
