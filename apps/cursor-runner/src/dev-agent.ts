// @ts-nocheck
import { Agent, Cursor } from "@cursor/sdk";
import { appendJsonl, getTargetCwd, loadRepoEnv, preferredModelId, requireCursorApiKey } from "./runtime.js";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  loadRepoEnv();
  const apiKey = requireCursorApiKey();
  const prompt = process.argv.slice(2).join(" ").trim() || process.env.CURSOR_TASK?.trim();
  if (!prompt) {
    throw new Error("Pass a task as CLI args or set CURSOR_TASK.");
  }

  const cwd = getTargetCwd();
  const models = await Cursor.models.list({ apiKey });
  const modelId = preferredModelId(models, process.env.CURSOR_MODEL?.trim() || "default");
  const logDir = resolve(cwd, "apps/cursor-runner/data");
  const logPath = resolve(logDir, "cursor-dev-agent.jsonl");

  mkdirSync(logDir, { recursive: true });
  appendJsonl(logPath, {
    event: "start",
    at: new Date().toISOString(),
    cwd,
    modelId,
    prompt,
  });

  const agent = await Agent.create({
    apiKey,
    model: { id: modelId },
    local: {
      cwd,
      settingSources: ["project", "user", "team", "plugins"],
      ...(process.env.CURSOR_SANDBOX === "1" ? { sandboxOptions: { enabled: true } } : {}),
    },
    name: process.env.CURSOR_AGENT_NAME?.trim() || "PTS dev agent",
  });

  let stepCount = 0;
  let deltaCount = 0;

  const run = await agent.send(prompt, {
    onStep: ({ step }) => {
      stepCount += 1;
      appendJsonl(logPath, {
        event: "step",
        at: new Date().toISOString(),
        stepCount,
        step,
      });
    },
    onDelta: ({ update }) => {
      deltaCount += 1;
      appendJsonl(logPath, {
        event: "delta",
        at: new Date().toISOString(),
        deltaCount,
        update,
      });
    },
  });

  const result = await run.wait();
  const gitStatus = execSync("git status --short", { cwd, encoding: "utf8" }).trim();
  const gitDiffStat = execSync("git diff --stat", { cwd, encoding: "utf8" }).trim();

  appendJsonl(logPath, {
    event: "finish",
    at: new Date().toISOString(),
    runId: result.id,
    status: result.status,
    durationMs: result.durationMs ?? null,
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        cwd,
        modelId,
        agentId: agent.agentId,
        runId: result.id,
        status: result.status,
        durationMs: result.durationMs ?? null,
        steps: stepCount,
        deltas: deltaCount,
        gitStatus: gitStatus || null,
        gitDiffStat: gitDiffStat || null,
        logPath,
      },
      null,
      2,
    ),
  );

  await agent.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
