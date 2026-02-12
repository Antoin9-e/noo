import { useSession } from "@/lib/auth-client";
import Header from "@/components/page/Header";
import CreateFamilyForm from "@/components/families/CreateFamilyForm";

export default function CreateFamilyPage() {
  const { data: session } = useSession();

  return (
    <div>
      <Header />
      <div className="w-full flex  flex-col items-center">
        <p>Bienvenue : {session?.user.name}</p>
        <CreateFamilyForm />
      </div>
    </div>
  );
}
