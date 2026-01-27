import { TabsList, TabsTrigger } from "../ui/tabs";

export default function ProfileMenu() {
  return (
    <TabsList className="flex-col h-auto w-[95%] m-auto mt-4">
      <TabsTrigger value="account" className="w-full justify-center ">
        Account
      </TabsTrigger>
      <TabsTrigger value="family" className="w-full justify-center">
        Family
      </TabsTrigger>
      <TabsTrigger value="notifications" className="w-full justify-center">
        Notifications
      </TabsTrigger>
    </TabsList>
  );
}
