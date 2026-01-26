import Header from "@/components/page/Header";
import { useSession } from "@/lib/auth-client";
import { Navigate } from "react-router-dom";
import ShowDataLine from "@/components/profile/ShowDataLine";
import { AvatarPopover } from "@/components/profile/UploadAvatarModal";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <Navigate to="/signin" replace />;
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-[90%] mx-auto p-6">
        <div className="flex w-full gap-6">
          <div
            id="content"
            className="p-4 bg-white rounded-2xl min-h-screen w-[65%]"
          ></div>
          <div
            id="profile-info"
            className="w-[30%] flex flex-col items-center gap-y-6"
          >
            <div className="bg-white rounded-2xl flex flex-col items-center w-full pb-6 overflow-visible">
              <h2 className="text-2xl font-semibold text-gray-600 mt-4 ">
                My profile
              </h2>
              <AvatarPopover
                imageUrl={session.user.image || ""}
                userId={session.user.id}
              />
              <ShowDataLine label="Name" value={session.user.name} />
              <ShowDataLine label="Email" value={session.user.email} />
            </div>

            <div
              id="nav"
              className="h-[70%] bg-white w-full rounded-2xl "
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
