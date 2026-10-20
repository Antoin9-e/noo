import { useParams } from "react-router-dom";
import Header from "@/components/page/Header";
import { useFamily } from "@/features/me/hooks";

export default function FamilyDashboard() {
  const { familyId } = useParams();
  const { data: family, error } = useFamily(familyId);

  return (
    <div>
      <Header />
      <main className="p-4">
        {error && <p>{error.message}</p>}
        {family && (
          <>
            <h1 className="text-2xl font-bold">{family.name}</h1>
            <ul className="mt-4 space-y-2">
              {family.memberships.map((m) => (
                <li key={m.user.id}>
                  {m.user.name} · {m.color}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
