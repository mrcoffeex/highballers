/**
 * Join every Dav Sur Ballers club member to the "Night Game" event.
 * Uses each member's own auth session (RLS-safe) via known dummy login emails.
 *
 * Usage: node scripts/join-davsur-night-game.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split(
  "\n",
)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.DAVSUR_DUMMY_PASSWORD ?? "DavSurDummy123!";

if (!supabaseUrl || !publishableKey) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env",
  );
  process.exit(1);
}

function davsurEmail(fullName) {
  return `${fullName.toLowerCase().replace(/\s+/g, ".")}.davsur@highballers.test`;
}

async function signIn(email) {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );

  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      body.error_description ?? body.msg ?? `Sign-in failed for ${email}`,
    );
  }

  return body.access_token;
}

async function rest(path, token, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      Prefer: options.prefer ?? "return=minimal",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${options.method ?? "GET"} ${path} failed (${response.status}): ${text}`,
    );
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function main() {
  const bootstrapEmail = davsurEmail("Jomari Santos");
  const bootstrapToken = await signIn(bootstrapEmail);

  const clubs = await rest(
    "clubs?select=id,name&name=eq.Dav Sur Ballers",
    bootstrapToken,
  );
  const club = clubs?.[0];
  if (!club) throw new Error('Club "Dav Sur Ballers" not found.');

  const events = await rest(
    `events?select=id,title,max_players&club_id=eq.${club.id}&title=ilike.*night*game*&order=date_time.desc&limit=1`,
    bootstrapToken,
  );
  const event = events?.[0];
  if (!event)
    throw new Error('Event "Night Game" not found in Dav Sur Ballers.');

  const members = await rest(
    `club_members?select=user_id,profiles(name)&club_id=eq.${club.id}`,
    bootstrapToken,
  );

  if (!members?.length) throw new Error("No members found in Dav Sur Ballers.");

  let joined = 0;
  let alreadyJoined = 0;
  let failed = 0;

  for (const member of members) {
    const name = member.profiles?.name;
    if (!name) {
      failed += 1;
      console.warn(`Skipping member ${member.user_id}: missing profile name`);
      continue;
    }

    try {
      const token = await signIn(davsurEmail(name));
      const existing = await rest(
        `event_participants?select=user_id&event_id=eq.${event.id}&user_id=eq.${member.user_id}`,
        token,
      );

      if (existing?.length) {
        alreadyJoined += 1;
        continue;
      }

      await rest("event_participants", token, {
        method: "POST",
        body: JSON.stringify({ event_id: event.id, user_id: member.user_id }),
      });
      joined += 1;
      console.log(`Joined ${name}`);
    } catch (error) {
      failed += 1;
      console.warn(`Failed for ${name}: ${error.message}`);
    }
  }

  console.log("");
  console.log(`Event: ${event.title} (${event.id})`);
  console.log(`Club members: ${members.length}`);
  console.log(`Newly joined: ${joined}`);
  console.log(`Already joined: ${alreadyJoined}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
