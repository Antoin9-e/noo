import LeftPageDesign from "@/components/Auth/LeftPageDesign";
import SignUpForm from "@/components/Auth/SignUpForm";
import { Link } from "react-router-dom";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center j bg-gray-100">
      <LeftPageDesign />
      <div className="w-[50%] max-w-md m-auto">
        <SignUpForm />

        {/* Lien vers la connexion */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account ?{" "}
          <Link
            to="/signin"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
