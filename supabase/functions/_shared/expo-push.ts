import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data: Record<string, string>;
  channelId?: string;
}

export async function sendExpoPushMessages(
  messages: ExpoPushMessage[],
  expoAccessToken: string | undefined,
): Promise<number> {
  if (messages.length === 0 || !expoAccessToken) return 0;

  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let sent = 0;
  for (const chunk of chunks) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        Authorization: `Bearer ${expoAccessToken}`,
      },
      body: JSON.stringify(chunk),
    });

    if (response.ok) {
      sent += chunk.length;
    }
  }

  return sent;
}

export async function fetchMemberPushTokens(
  supabase: SupabaseClient,
  memberIds: string[],
): Promise<string[]> {
  if (memberIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("push_token")
    .in("id", memberIds)
    .not("push_token", "is", null);

  return [
    ...new Set((profiles ?? []).map((row) => row.push_token).filter(Boolean)),
  ] as string[];
}
