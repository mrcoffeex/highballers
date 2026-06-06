#!/usr/bin/env node
/**
 * Push EXPO_PUBLIC_* vars from .env to EAS preview + production (Windows-safe).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envFile = [".env", ".env.local", "env.local"].find((name) =>
  fs.existsSync(path.join(root, name)),
);

if (!envFile) {
  console.error("Missing .env — see .env.example");
  process.exit(1);
}

function runEas(args) {
  const result = spawnSync("npx", ["--yes", "eas-cli@16.17.4", ...args], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return result.status ?? 1;
}

console.log(`Using env file: ${envFile}`);

for (const environment of ["preview", "production"]) {
  console.log(`Pushing env to EAS environment: ${environment}`);
  const status = runEas(["env:push", environment, "--path", envFile]);
  if (status !== 0) {
    process.exit(status);
  }
}

console.log("Done. Verify at https://expo.dev → Project → Environment variables");
