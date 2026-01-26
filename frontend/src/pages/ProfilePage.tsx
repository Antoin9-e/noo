import Header from "@/components/page/Header";
import { useSession } from "@/lib/auth-client";
import { Navigate } from "react-router-dom";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <Navigate to="/signin" replace />;
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-[80%] mx-auto p-6">
        <div className="flex w-full gap-6">
          <div
            id="content"
            className="p-4 bg-white rounded-2xl min-h-screen w-[65%]"
          >
            <form
              action="http://localhost:3000/api/upload/avatar"
              method="POST"
              encType="multipart/form-data"
              className="flex flex-col gap-4"
            >
              <h2 className="text-2xl font-semibold mb-4">Upload Avatar</h2>
              <input type="file" name="image" />
              <input type="text" name="userId" value={session.user.id} hidden />
              <button type="submit">Upload</button>
            </form>
          </div>
          <div
            id="profile-info"
            className="bg-white rounded-2xl w-[30%]  flex flex-col items-center py-10"
          >
            <h2 className="text-2xl font-semibold ">My profile</h2>
            {(session.user.image && (
              <img
                src={session.user.image}
                alt="User Avatar"
                className="w-48 h-48 rounded-full mt-4 border-4 border-violet-700"
              />
            )) || (
              <div className="w-48 h-48 rounded-full mt-4 border-4 border-violet-700 bg-gray-100 flex items-center justify-center">
                <User className="w-32 h-32 text-violet-700" />
              </div>
            )}
            <p className="text-gray-700 mt-5">{session.user.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
