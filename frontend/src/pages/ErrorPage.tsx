import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <div className="w-full min-h-screen bg-violet-800 flex items-center justify-center">
      <h1 className="text-6xl font-bold text-white">404 - Page Not Found</h1>
      <Link
        to="/"
        className="absolute top-4 left-4 text-white bg-violet-600 px-4 py-2 rounded hover:bg-violet-500"
      >
        Go back !
      </Link>
    </div>
  );
}
