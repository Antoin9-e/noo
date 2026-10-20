import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Avatar } from "@/components/common/Avatar";
import { useMe } from "@/features/me/hooks";
import { firstName, fmt, greeting } from "@/lib/dates";

export default function TodayPage() {
  const { data: me } = useMe();

  return (
    <>
      <PageHeader
        subtitle={fmt(new Date(), "EEEE d MMMM")}
        title={`${greeting()}${me ? ` ${firstName(me.name)}` : ""}`}
        right={
          me && (
            <Link to="/moi" aria-label="Mon profil" className="pressable">
              <Avatar name={me.name} image={me.image} tone="violet" />
            </Link>
          )
        }
      />
      <div className="px-4">
        <EmptyState emoji="🌤️" title="Rien de prévu aujourd'hui">
          Touche + pour ajouter un moment à deux.
        </EmptyState>
      </div>
    </>
  );
}
