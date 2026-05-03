// @ts-nocheck
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

export const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(__dirname, "../../..");

export function loadRepoEnv() {
  const localEnvPath = resolve(repoRoot, ".env.local");
  if (existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }
}

export function requireCursorApiKey() {
  loadRepoEnv();
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "CURSOR_API_KEY is not set. Add it to /home/satananth/projects/PTS/.env.local or export it before running the runner.",
    );
  }
  return apiKey;
}

export function getTargetCwd() {
  return resolve(process.env.CURSOR_CWD?.trim() || repoRoot);
}

export function preferredModelId(models, preferred = "default") {
  const ids = new Set(models.map((model) => model.id));
  if (ids.has(preferred)) return preferred;
  return models[0]?.id;
}

export function appendJsonl(path, entry) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(entry)}\n`);
}
