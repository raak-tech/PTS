// @ts-nocheck
import { Agent, Cursor } from "@cursor/sdk";
import { getTargetCwd, loadRepoEnv, preferredModelId, requireCursorApiKey } from "./runtime.js";

async function main() {
  loadRepoEnv();
  const apiKey = requireCursorApiKey();
  const models = await Cursor.models.list({ apiKey });
  const modelId = preferredModelId(models, process.env.CURSOR_MODEL?.trim() || "default");
  const me = await Cursor.me({ apiKey });
  const result = await Agent.prompt("Reply with exactly: OK", {
    apiKey,
    model: { id: modelId },
    local: { cwd: getTargetCwd() },
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        apiKeyName: me.apiKeyName,
        userId: me.userId ?? null,
        userEmail: me.userEmail ?? null,
        modelId,
        runId: result.id,
        status: result.status,
        durationMs: result.durationMs ?? null,
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
