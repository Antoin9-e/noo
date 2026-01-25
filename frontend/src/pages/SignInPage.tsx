import LeftPageDesign from "@/components/Auth/LeftPageDesign";
import SignInForm from "@/components/Auth/SignInForm";
import { Link } from "react-router-dom";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center  w-full">
      <LeftPageDesign />
      <div className="w-[50%] max-w-md m-auto">
        <SignInForm />

        {/* Lien vers l'inscription */}
        <p className="text-center text-sm text-gray-600 mt-4">
          No account yet ?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
