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
          {data?.memberships.map((family) => (
            <Link to={`/families/${family.family.id}`} key={family.family.id}>
              <DropdownMenuItem key={family.family.id}>
                <FaHouseChimneyUser className="inline mr-2" size={16} />
                {family.family.name}
              </DropdownMenuItem>
            </Link>
          ))}
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
