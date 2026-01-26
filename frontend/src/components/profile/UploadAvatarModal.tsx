import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";
import { Toaster, toast } from "sonner";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User } from "lucide-react";

export function AvatarPopover({
  imageUrl,
  userId,
}: {
  imageUrl: string;
  userId: string;
}) {
  const [image, setImage] = React.useState<string>(imageUrl);
  const { refetch } = useSession();

  const handleClick = async () => {
    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append("image", fileInput.files[0]);
      formData.append("userId", userId);

      try {
        const response = await fetch(
          "http://localhost:3000/api/upload/avatar",
          {
            method: "POST",
            body: formData,
          },
        );

        const data = await response.json();
        console.log("Upload successful:", data);
        setImage(data.url);

        // Recharge la session pour mettre à jour partout
        await refetch();

        toast.success("Avatar uploaded successfully!");
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Upload failed. Please try again.");
      }
    }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-0 m-0 border-0 bg-transparent cursor-pointer">
          {(image && (
            <img
              src={image}
              alt="User Avatar"
              className="w-40 h-40 rounded-2xl mt-4 border-4 border-violet-700 object-cover"
            />
          )) || (
            <div className="w-40 h-40 rounded-2xl mt-4 border-4 border-violet-700 bg-gray-100 flex items-center justify-center">
              <User className="w-24 h-24 text-violet-700" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64"
        align="center"
        side="bottom"
        sideOffset={10}
      >
        <PopoverHeader>
          <PopoverTitle>Upload new avatar</PopoverTitle>
          <PopoverDescription>
            Choose a new avatar to represent yourself.
          </PopoverDescription>
        </PopoverHeader>
        <FieldGroup className="gap-4">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="file" className="w-1/2">
              File:
            </FieldLabel>
            <Input id="file" type="file" />
          </Field>
          <Field orientation="horizontal">
            <button
              id="upload-button"
              className="px-4 py-2 bg-violet-700 text-white  m-auto rounded-lg hover:bg-violet-800"
              onClick={handleClick}
            >
              Upload
            </button>
          </Field>
        </FieldGroup>
      </PopoverContent>
      <Toaster position="bottom-right" />
    </Popover>
  );
}
