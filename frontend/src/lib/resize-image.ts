// Une photo de téléphone fait souvent plusieurs Mo : on la réduit avant l'envoi
// (un avatar n'a pas besoin de plus, et Vercel refuse les corps de plus de 4,5 Mo).
export async function resizeImage(file: File, maxSide = 512, quality = 0.85): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Impossible de préparer l'image");
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}
