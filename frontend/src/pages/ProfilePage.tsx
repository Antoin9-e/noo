import Header from "@/components/page/Header";
import { useSession } from "@/lib/auth-client";
import { Navigate } from "react-router-dom";
import ShowDataLine from "@/components/profile/ShowDataLine";
import { AvatarPopover } from "@/components/profile/UploadAvatarModal";
import React from "react";
import ProfileMenu from "@/components/profile/ProfileMenu";
import ProfileContent from "@/components/profile/ProfileContent";
import { Tabs } from "@/components/ui/tabs";
import type { UserWithRelations } from "@/types";
export default function ProfilePage() {
  const { data: session } = useSession();

  const [familyData, setFamilyData] = React.useState<UserWithRelations | null>(
    null,
  );

  const [familiesMembership, setFamiliesMembership] = React.useState<
    Array<{ id: string; name: string }>
  >([]);

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

  React.useEffect(() => {
    if (familyData?.memberships) {
      const families = familyData.memberships.map(
        (membership) => membership.family,
      );
      setFamiliesMembership(families);
    }
  }, [familyData]);

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-[90%] mx-auto p-6">
        <Tabs defaultValue="family" orientation="vertical" className="w-full">
          <div className="flex w-full gap-6">
            <div
              id="content"
              className="p-4 bg-white rounded-2xl min-h-screen w-[65%]"
            >
              <ProfileContent data={familiesMembership} />
            </div>
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

              <div id="nav" className="h-[70%] bg-white w-full rounded-2xl ">
                <ProfileMenu />
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
