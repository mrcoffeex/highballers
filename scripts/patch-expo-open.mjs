import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openJsPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@expo",
  "cli",
  "build",
  "src",
  "utils",
  "open.js",
);

const MARKER = "Start-Process";

export function patchExpoOpenForWindows() {
  if (process.platform !== "win32") {
    return { patched: false, reason: "not-windows" };
  }

  if (!fs.existsSync(openJsPath)) {
    return { patched: false, reason: "open.js-missing" };
  }

  const content = fs.readFileSync(openJsPath, "utf8");
  if (content.includes(MARKER)) {
    return { patched: true, reason: "already-patched" };
  }

  const replacement = `async function spawnWindowsStartAsync(target, browserApp, browserArgs) {
    try {
        await (0, _spawnasync().default)('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            'Start-Process ' + JSON.stringify(target)
        ], {
            stdio: 'ignore'
        });
    } catch {
        // Browser open is best-effort; Expo CLI also logs the URL to visit manually.
    }
}`;

  const next = content.replace(
    /async function spawnWindowsStartAsync\(target, browserApp, browserArgs\) \{[\s\S]*?\r?\n\}/,
    replacement,
  );

  if (next === content) {
    return { patched: false, reason: "pattern-not-found" };
  }

  fs.writeFileSync(openJsPath, next);
  return { patched: true, reason: "patched" };
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))
) {
  const result = patchExpoOpenForWindows();
  if (result.patched) {
    console.log(`Expo CLI browser opener: ${result.reason}`);
  } else {
    console.warn(`Expo CLI browser opener not patched (${result.reason})`);
  }
}
