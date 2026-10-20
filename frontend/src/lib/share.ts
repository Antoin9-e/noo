import { toast } from "sonner";

// Feuille de partage native (WhatsApp, SMS…) ; sinon copie dans le presse-papiers
export async function shareLink(data: { title: string; text: string; url: string }) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  await copyText(data.url);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Lien copié 📋");
  } catch {
    toast.error("Impossible de copier le lien");
  }
}
