import webpush from "web-push";

// Génère une paire de clés VAPID à coller dans .env (ou les variables Railway)
const { publicKey, privateKey } = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}`);
