import { Link } from "react-router-dom";
import AuthTab from "../Auth/AuthTab";
import ColorLogo from "./ColorLogo";

export default function Header() {
  return (
    <header className="w-full flex  justify-around items-center sticky top-0  bg-white shadow">
      <div>
        <Link to="/">
          <ColorLogo />
        </Link>
      </div>
      <AuthTab />
    </header>
  );
}
