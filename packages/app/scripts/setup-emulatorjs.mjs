// Self-host di EmulatorJS in public/emulatorjs/data (same-origin) per evitare ORB/COEP
// sul CDN (vedi gap emulatorjs-real-integration / ADR-004). Rigenerabile: non committare i binari.
//
// Uso:  node scripts/setup-emulatorjs.mjs
// Copia il pacchetto npm @emulatorjs/emulatorjs/data, poi scarica emulator.min.js e i core
// richiesti da cdn.emulatorjs.org (non inclusi nell'npm). I core sono mappati per piattaforma.
import { cp, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(dir, "..");
const DATA = path.join(appRoot, "public/emulatorjs/data");
const CDN = "https://cdn.emulatorjs.org/stable/data";
// Core minimi per il Core web MVP (GB/GBC → gambatte). Aggiungere mgba/fbneo al bisogno.
const CORES = ["gambatte-wasm.data"];

async function dl(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} → HTTP ${res.status}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await pipeline(res.body, createWriteStream(dest));
  console.log("↓", path.relative(appRoot, dest));
}

const npmData = path.join(appRoot, "node_modules/@emulatorjs/emulatorjs/data");
await mkdir(DATA, { recursive: true });
await cp(npmData, DATA, { recursive: true });
console.log("copiato npm data/ →", path.relative(appRoot, DATA));

await dl(`${CDN}/emulator.min.js`, path.join(DATA, "emulator.min.js"));
for (const c of CORES) await dl(`${CDN}/cores/${c}`, path.join(DATA, "cores", c));

console.log("\nFatto. EJS_pathtodata = /emulatorjs/data/ (same-origin).");
console.log("Nota: il runtime del core (EJS_Runtime) deve caricarsi — vedi gap emulatorjs-real-integration.");
