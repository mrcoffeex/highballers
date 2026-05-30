import { createClient } from "npm:@supabase/supabase-js@2";

import {
  fetchMemberPushTokens,
  sendExpoPushMessages,
  type ExpoPushMessage,
} from "../_shared/expo-push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messageId } = await req.json();
    if (!messageId || typeof messageId !== "string") {
      return new Response(JSON.stringify({ error: "messageId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: message, error: messageError } = await supabase
      .from("club_chat_messages")
      .select("id, club_id, user_id, body")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError || !message) {
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: club }, { data: sender }, { data: members }] =
      await Promise.all([
        supabase
          .from("clubs")
          .select("name")
          .eq("id", message.club_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("name, nickname")
          .eq("id", message.user_id)
          .maybeSingle(),
        supabase
          .from("club_members")
          .select("user_id")
          .eq("club_id", message.club_id),
      ]);

    const memberIds = (members ?? [])
      .map((row) => row.user_id as string)
      .filter((userId) => userId !== message.user_id);

    const tokens = await fetchMemberPushTokens(supabase, memberIds);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: !expoAccessToken }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const senderName = sender?.nickname ?? sender?.name ?? "Someone";
    const clubName = club?.name ?? "Club chat";
    const preview = message.body.startsWith("hb-gif:")
      ? "GIF"
      : message.body.length > 120
        ? `${message.body.slice(0, 117)}...`
        : message.body;

    const pushMessages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: clubName,
      body: `${senderName}: ${preview}`,
      sound: "default",
      channelId: "club-chat",
      data: {
        clubId: message.club_id,
        url: `/chats/${message.club_id}`,
      },
    }));

    const sent = await sendExpoPushMessages(pushMessages, expoAccessToken);

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
