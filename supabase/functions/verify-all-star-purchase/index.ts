import { createClient } from "npm:@supabase/supabase-js@2";

const ALL_STAR_PRODUCT_ID =
  Deno.env.get("ALL_STAR_PRODUCT_ID") ?? "com.highballers.app.all_star_monthly";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PurchasePayload {
  productId?: string;
  transactionId?: string;
  purchaseToken?: string | null;
  platform?: string;
  transactionDate?: number;
  restored?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as PurchasePayload;
    const productId = body.productId?.trim();
    const transactionId = body.transactionId?.trim();
    const platform = body.platform === "ios" || body.platform === "android"
      ? body.platform
      : "unknown";

    if (!productId || productId !== ALL_STAR_PRODUCT_ID) {
      return new Response(JSON.stringify({ error: "Invalid product" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!transactionId) {
      return new Response(JSON.stringify({ error: "Missing transaction" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const transactionDate = body.transactionDate
      ? new Date(body.transactionDate).toISOString()
      : new Date().toISOString();

    const { error: receiptError } = await admin.from("subscription_receipts")
      .upsert(
        {
          user_id: user.id,
          product_id: productId,
          transaction_id: transactionId,
          purchase_token: body.purchaseToken ?? null,
          platform,
          transaction_date: transactionDate,
          restored: Boolean(body.restored),
        },
        { onConflict: "platform,transaction_id" },
      );

    if (receiptError) {
      return new Response(JSON.stringify({ error: receiptError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: tierError } = await admin
      .from("profiles")
      .update({ subscription_tier: "all_star" })
      .eq("id", user.id);

    if (tierError) {
      return new Response(JSON.stringify({ error: tierError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, tier: "all_star" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
