import { Elysia, t } from "elysia";
import cloudinary from "../lib/cloudinary.js";
import { readFile } from "node:fs/promises";
import { prisma } from "../lib/prisma.js";

// ----- helper: upload buffer to Cloudinary -----
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: filename, folder: "elysia_demo" },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload failed"));
          resolve(result);
        },
      )
      .end(buffer);
  });
}

// ----- Elysia app -----
export const uploadRoutes = new Elysia({ prefix: "/api" }).post(
  "/upload/avatar",
  async ({ body, set }) => {
    try {
      const file = body.image;
      // Convert to Buffer
      const arrayBuf = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      // Upload to Cloudinary
      const result = await uploadToCloudinary(buffer, file.name);

      // Update user's image in database
      const updatedUser = await prisma.user.update({
        where: { id: body.userId },
        data: { image: result.secure_url },
      });

      return { url: result.secure_url, user: updatedUser };
    } catch (error) {
      set.status = 500;
      return { error: "Upload failed" };
    }
  },
  {
    body: t.Object({
      userId: t.String(),
      image: t.File({
        type: ["image/png", "image/jpeg", "image/webp"],
        maxSize: 5 * 1024 * 1024, // 5MB
      }),
    }),
  },
);
