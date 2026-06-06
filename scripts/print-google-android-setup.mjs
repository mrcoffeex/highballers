#!/usr/bin/env node
/**
 * Print Google Cloud Android OAuth setup for native Google Sign-In (DEVELOPER_ERROR fix).
 */
import fs from "node:fs";
import path from "node:path";

const PACKAGE = "com.highballers.app";
const PROJECT_ID = "d8bdb9a0-8b35-4786-b51f-c5b57f808720";
const ACCOUNT = "kentjohngo";
const SLUG = "highballers";

function readEnv(name) {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return "";
  const line = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((row) => row.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : "";
}

async function expoGraphql(token, query) {
  const response = await fetch("https://api.expo.dev/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  return response.json();
}

async function fetchSha1FromExpo(token) {
  const query = `query {
    app {
      byId(appId: "${PROJECT_ID}") {
        androidAppCredentials(filter: { applicationIdentifier: "${PACKAGE}" }) {
          applicationIdentifier
          androidAppBuildCredentialsList {
            name
            isDefault
            androidKeystore {
              sha1CertificateFingerprint
              sha256CertificateFingerprint
            }
          }
        }
      }
    }
  }`;

  const json = await expoGraphql(token, query);
  if (json.errors?.length) {
    throw new Error(json.errors.map((entry) => entry.message).join("; "));
  }

  const credentials =
    json.data?.app?.byId?.androidAppCredentials?.find(
      (entry) => entry.applicationIdentifier === PACKAGE,
    ) ?? json.data?.app?.byId?.androidAppCredentials?.[0];

  const buildProfiles = credentials?.androidAppBuildCredentialsList ?? [];
  const preferred =
    buildProfiles.find((entry) => entry.isDefault) ?? buildProfiles[0];
  const sha1 = preferred?.androidKeystore?.sha1CertificateFingerprint;

  return {
    sha1: sha1 ? sha1.replace(/:/g, "").toUpperCase() : null,
    sha1Formatted: sha1 ?? null,
    profileName: preferred?.name ?? null,
  };
}

const token = process.env.EXPO_TOKEN || readEnv("EXPO_TOKEN");
const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  readEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");

console.log("Google Sign-In — Android preview APK setup");
console.log("============================================");
console.log(`Package name: ${PACKAGE}`);
console.log(
  `Web client ID (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID): ${webClientId || "(missing)"}`,
);
console.log("");

if (!webClientId) {
  console.log("Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env — must be a");
  console.log("Google Cloud OAuth client of type Web application (NOT Android).");
  console.log("");
}

let shaInfo = { sha1: null, sha1Formatted: null, profileName: null };
if (token) {
  try {
    shaInfo = await fetchSha1FromExpo(token);
  } catch (error) {
    console.log(`Could not fetch SHA-1 via Expo API: ${error.message}`);
  }
} else {
  console.log("Set EXPO_TOKEN in .env to auto-fetch SHA-1.");
  console.log("");
}

if (shaInfo.sha1) {
  console.log(
    `EAS keystore SHA-1 (${shaInfo.profileName ?? "default"} profile):`,
  );
  console.log(shaInfo.sha1);
  console.log(`Formatted: ${shaInfo.sha1Formatted}`);
  console.log("");
} else {
  console.log("Get SHA-1 manually:");
  console.log(
    `  https://expo.dev/accounts/${ACCOUNT}/projects/${SLUG}/credentials`,
  );
  console.log("  → Android → com.highballers.app → SHA-1 fingerprint");
  console.log("");
}

console.log("Google Cloud Console → APIs & Services → Credentials:");
console.log("1. Web application client");
console.log("   - Client ID → EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID + Supabase Google provider");
console.log("   - Do NOT use the Android client ID here");
console.log("2. Android client (create if missing)");
console.log(`   - Package name: ${PACKAGE}`);
console.log(`   - SHA-1: ${shaInfo.sha1 ?? "(copy from Expo credentials above)"}`);
console.log("");
console.log("Supabase → Auth → Providers → Google:");
console.log("- Client ID = Web client ID above");
console.log("- Client secret = Web client secret");
console.log("- Enable Skip Nonce Check");
console.log("");
console.log("After saving in Google Cloud, wait 5–10 minutes and retry sign-in.");
console.log("No APK rebuild needed.");
