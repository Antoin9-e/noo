import { FaGoogle, FaApple } from "react-icons/fa";
import { authClient } from "@/lib/auth-client";

export default function SocialProviders() {
  const HandleGoogleSignIn = async () => {
    const data = await authClient.signIn.social({
      provider: "google",
      callbackURL: "http://localhost:5173/",
    });
  };
  return (
    <div className="w-full flex flex-col">
      <div className="w-full border-2 border-gray-200"></div>
      <div>
        <p className="text-center text-gray-500 text-sm my-4">
          Join Noo with your favorite Social Media
        </p>
        <div className="flex gap-x-2 items-center justify-center">
          <div className="flex items-center justify-center flex-col">
            <FaGoogle
              onClick={() => {
                HandleGoogleSignIn();
              }}
              className="w-10 h-10 p-2 border-2 border-gray-200 rounded-lg cursor-pointer text-orange-500 hover:bg-gray-100"
            />
            <p className="text-sm text-gray-500">Google</p>
          </div>
          <div className="flex items-center justify-center flex-col">
            <FaApple className="w-10 h-10 p-2 border-2 border-gray-200 rounded-lg cursor-pointer text-black hover:bg-gray-100" />
            <p className="text-sm text-gray-500">Apple</p>
          </div>
        </div>
      </div>
    </div>
  );
}
