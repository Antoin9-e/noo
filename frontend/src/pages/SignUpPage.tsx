import SignUpForm from "@/components/Auth/SignUpForm";
import { Link } from "react-router-dom";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <SignUpForm />

        {/* Lien vers la connexion */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Déjà un compte ?{" "}
          <Link
            to="/signin"
            className="text-blue-600 hover:underline font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
