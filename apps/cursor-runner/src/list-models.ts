// @ts-nocheck
import { Cursor } from "@cursor/sdk";
import { loadRepoEnv, requireCursorApiKey } from "./runtime.js";

async function main() {
  loadRepoEnv();
  const apiKey = requireCursorApiKey();
  const models = await Cursor.models.list({ apiKey });
  console.log(
    JSON.stringify(
      models.map((model) => ({
        id: model.id,
        displayName: model.displayName,
        description: model.description ?? null,
      })),
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
