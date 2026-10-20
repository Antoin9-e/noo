import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { isIOS, isStandalone } from "@/features/install/useInstall";

export type PushState =
  | "unsupported" // navigateur sans push
  | "needs-install" // iPhone : uniquement dans la PWA installée (iOS ≥ 16.4)
  | "disabled" // serveur sans clés VAPID
  | "denied"
  | "off"
  | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export function usePush() {
  const [state, setState] = useState<PushState>("off");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!supported()) return setState(isIOS() && !isStandalone() ? "needs-install" : "unsupported");
    if (Notification.permission === "denied") return setState("denied");
    const { enabled } = await api<{ enabled: boolean }>("/push/public-key").catch(() => ({ enabled: false }));
    if (!enabled) return setState("disabled");
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    setState(sub ? "on" : "off");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");
      const { publicKey } = await api<{ publicKey: string }>("/push/public-key");
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const json = sub.toJSON();
      await api("/push/subscribe", { method: "POST", body: { endpoint: json.endpoint, keys: json.keys } });
      setState("on");
      return true;
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api("/push/subscribe", { method: "DELETE", body: { endpoint: sub.endpoint } }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  };

  const test = () => api("/push/test", { method: "POST" });

  return { state, busy, enable, disable, test };
}
