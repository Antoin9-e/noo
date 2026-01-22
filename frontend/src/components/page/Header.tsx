import AuthTab from "../Auth/AuthTab";

export default function Header() {
  return (
    <header className="w-full flex  justify-around items-center sticky top-0 py-6 bg-white shadow">
      <div>
        <h1>Noo</h1>
      </div>
      <AuthTab />
    </header>
  );
}
