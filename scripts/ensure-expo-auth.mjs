import { spawnSync } from "node:child_process";

import { patchExpoOpenForWindows } from "./patch-expo-open.mjs";

const PROJECT_OWNER = "kentjohngo";

function npx(args, options = {}) {
  return spawnSync("npx", args, {
    encoding: "utf8",
    shell: true,
    ...options,
  });
}

patchExpoOpenForWindows();

if (process.env.EXPO_TOKEN) {
  console.log("Using EXPO_TOKEN for Expo CLI authentication.");
  process.exit(0);
}

const whoami = npx(["expo", "whoami"]);
if (whoami.status === 0) {
  const username = whoami.stdout.trim();
  console.log(`Expo CLI logged in as ${username}`);
  if (username !== PROJECT_OWNER) {
    console.warn(
      `Project owner is "${PROJECT_OWNER}". Log in as that account to avoid Expo Go verification prompts.`,
    );
  }
  process.exit(0);
}

console.log("Expo CLI is not logged in. Opening browser to sign in...");
const login = npx(["expo", "login", "-b"], { stdio: "inherit" });
if (login.status !== 0) {
  console.warn(
    "Expo login did not complete. Dev server will still start in offline mode.",
  );
  process.exit(0);
}

const verify = npx(["expo", "whoami"]);
if (verify.status === 0) {
  console.log(`Expo CLI logged in as ${verify.stdout.trim()}`);
}

process.exit(0);
