import { app } from "./src/app.js";
import { env } from "./src/lib/env.js";

app.listen(env.port);

console.log(`🦊 Noo tourne sur http://localhost:${env.port}`);
