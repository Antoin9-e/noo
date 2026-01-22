import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignUpForm from "./SignUpForm";
import SignInForm from "./SignInForm";
import { useSession } from "@/lib/auth-client";
import { href, Link } from "react-router";

export default function AuthTab() {
  const { data: session } = useSession();
  if (session) {
    return <div>You are already signed in.</div>;
  }
  return (
    <Tabs defaultValue="sign-in" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sign-in">Sign In</TabsTrigger>
        <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="sign-in">
        <Link to="/signin">Login</Link>
      </TabsContent>
      <TabsContent value="sign-up">
        <Link to="/signup">Register</Link>
      </TabsContent>
    </Tabs>
  );
}
