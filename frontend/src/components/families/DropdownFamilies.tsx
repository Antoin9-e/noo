import { MdFamilyRestroom } from "react-icons/md";
import { FaHouseChimneyUser } from "react-icons/fa6";
import { HiPlusSm } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { UserWithRelations } from "@/types";
import { Link } from "react-router-dom";

export function DropdownFamilies({ data }: { data: UserWithRelations | null }) {
  const memberships = data?.memberships ?? [];
  console.log("Données reçues par le Dropdown:", data);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="mr-4 ">
          <MdFamilyRestroom className="inline " size={16} /> Families
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Families</DropdownMenuLabel>
          {memberships.length > 0 ? (
            memberships.map((m) => (
              <Link to={`/families/${m.family.id}`} key={m.family.id}>
                <DropdownMenuItem className="cursor-pointer">
                  <FaHouseChimneyUser className="inline mr-2" size={16} />
                  {m.family.name}
                </DropdownMenuItem>
              </Link>
            ))
          ) : (
            <div className="px-2 py-1 text-xs text-gray-500">
              No families found
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Create Family</DropdownMenuLabel>
        <Link to={"/families/create"}>
          <DropdownMenuItem>
            {" "}
            <HiPlusSm className="inline mr-2" size={16} /> New
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Management space</DropdownMenuLabel>
        <DropdownMenuItem> families</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
