import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { patchExpoOpenForWindows } from "./patch-expo-open.mjs";

patchExpoOpenForWindows();

function resolveAdbPath() {
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Local", "Android", "Sdk")
      : path.join(os.homedir(), "Library", "Android", "sdk"),
  ].filter(Boolean);

  for (const sdkRoot of sdkRoots) {
    const adb = path.join(
      sdkRoot,
      "platform-tools",
      process.platform === "win32" ? "adb.exe" : "adb",
    );
    if (fs.existsSync(adb)) return adb;
  }
  return null;
}

/** Maps emulator 127.0.0.1:8081 → host Metro (required for --localhost on Android). */
function setupAndroidPortReverse() {
  const adb = resolveAdbPath();
  if (!adb) return false;

  const ports = [8081, 8082, 19000, 19001];
  let ok = true;
  for (const port of ports) {
    const result = spawnSync(adb, ["reverse", `tcp:${port}`, `tcp:${port}`], {
      encoding: "utf8",
    });
    if (result.status !== 0) ok = false;
  }
  return ok;
}

const auth = spawnSync(process.execPath, ["scripts/ensure-expo-auth.mjs"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

if (auth.status !== 0) {
  process.exit(auth.status ?? 1);
}

const whoami = spawnSync("npx", ["expo", "whoami"], {
  encoding: "utf8",
  shell: true,
});

const useTunnel =
  process.env.EXPO_ANDROID_TUNNEL === "1" || process.argv.includes("--tunnel");
const forceLocalhost = process.env.EXPO_ANDROID_USE_LOCALHOST === "1";

let hostMode = "lan";
if (useTunnel) {
  hostMode = "tunnel";
} else if (forceLocalhost) {
  const adbReverseOk = setupAndroidPortReverse();
  if (!adbReverseOk) {
    console.warn(
      "EXPO_ANDROID_USE_LOCALHOST=1 but adb reverse failed — falling back to LAN.",
    );
    hostMode = "lan";
  } else {
    hostMode = "localhost";
  }
}

const expoArgs = ["expo", "start", "--android", `--${hostMode}`];
if (whoami.status !== 0) {
  console.log("Starting Metro in offline mode (no Expo account session).");
  expoArgs.push("--offline");
}

console.log(`Metro host: ${hostMode}`);

const child = spawn("npx", expoArgs, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    EXPO_PUBLIC_EXPO_GO_GESTURE_STUB: "1",
    EXPO_PUBLIC_OAUTH_PREFER_LOCALHOST:
      hostMode === "localhost" ? "true" : "false",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
