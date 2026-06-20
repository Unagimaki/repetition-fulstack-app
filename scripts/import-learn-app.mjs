import { readFile } from "node:fs/promises";

const filePath = process.argv[2];
const backendUrl = process.env.BACKEND_API_URL ?? "http://localhost:14000";

if (!filePath) {
  console.error("Usage: npm run import:learn-app -- <path-to-export.json>");
  process.exit(1);
}

const raw = await readFile(filePath, "utf8");
const payload = JSON.parse(raw);

const response = await fetch(`${backendUrl}/api/import/learn-app`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const body = await response.text();

if (!response.ok) {
  console.error(`Import failed: ${response.status}`);
  console.error(body);
  process.exit(1);
}

console.log(body);
