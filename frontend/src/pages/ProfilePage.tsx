import { Link } from "react-router-dom";
import Header from "@/components/page/Header";
import { AvatarPopover } from "@/components/profile/UploadAvatarModal";
import { useMe } from "@/features/me/hooks";

export default function ProfilePage() {
  const { data: me } = useMe();

  return (
    <div className="min-h-dvh bg-gray-100">
      <Header />
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-4">
        {me && (
          <>
            <AvatarPopover imageUrl={me.image ?? ""} />
            <p className="text-xl font-semibold">{me.name}</p>
            <p className="text-gray-600">{me.email}</p>
            <ul className="w-full space-y-2">
              {me.memberships.map(({ family }) => (
                <li key={family.id}>
                  <Link to={`/families/${family.id}`} className="block rounded-xl bg-white p-4">
                    {family.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
