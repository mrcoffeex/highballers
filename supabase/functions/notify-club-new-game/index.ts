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

function formatEventWhen(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

    const { eventId } = await req.json();
    if (!eventId || typeof eventId !== "string") {
      return new Response(JSON.stringify({ error: "eventId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, club_id, title, location, date_time, created_by")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: club }, { data: creator }, { data: members }] =
      await Promise.all([
        supabase
          .from("clubs")
          .select("name")
          .eq("id", event.club_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("name, nickname")
          .eq("id", event.created_by)
          .maybeSingle(),
        supabase
          .from("club_members")
          .select("user_id")
          .eq("club_id", event.club_id),
      ]);

    const memberIds = (members ?? [])
      .map((row) => row.user_id as string)
      .filter((userId) => userId !== event.created_by);

    const tokens = await fetchMemberPushTokens(supabase, memberIds);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: !expoAccessToken }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const clubName = club?.name ?? "Your club";
    const creatorName = creator?.nickname ?? creator?.name ?? "Someone";
    const when = formatEventWhen(event.date_time);
    const location = event.location?.trim() || "TBD";

    const pushMessages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: `${clubName} · New game`,
      body: `${creatorName} posted ${event.title} · ${when} · ${location}`,
      sound: "default",
      channelId: "club-games",
      data: {
        eventId: event.id,
        clubId: event.club_id,
        url: `/event/${event.id}`,
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
