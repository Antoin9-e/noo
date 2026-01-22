import LeftPageDesign from "@/components/Auth/LeftPageDesign";
import SignInForm from "@/components/Auth/SignInForm";
import { Link } from "react-router-dom";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center bg-gray-100 w-full">
      <LeftPageDesign />
      <div className="w-[50%] max-w-md m-auto">
        <SignInForm />

        {/* Lien vers l'inscription */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Pas encore de compte ?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
