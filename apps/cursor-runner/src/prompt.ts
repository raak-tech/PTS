// @ts-nocheck
import { Agent, Cursor } from "@cursor/sdk";
import { getTargetCwd, loadRepoEnv, preferredModelId, requireCursorApiKey } from "./runtime.js";

async function main() {
  loadRepoEnv();
  const apiKey = requireCursorApiKey();
  const models = await Cursor.models.list({ apiKey });
  const modelId = preferredModelId(models, process.env.CURSOR_MODEL?.trim() || "default");
  const prompt = process.argv.slice(2).join(" ").trim() || process.env.CURSOR_PROMPT?.trim();

  if (!prompt) {
    throw new Error("Pass a prompt as CLI args or set CURSOR_PROMPT.");
  }

  const result = await Agent.prompt(prompt, {
    apiKey,
    model: { id: modelId },
    local: { cwd: getTargetCwd() },
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        modelId,
        runId: result.id,
        status: result.status,
        result: result.result ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
