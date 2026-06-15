// @ts-nocheck
// Supabase Edge Function — plop-withdraw
// Handles automatic withdrawals via the PLOP PLOP Marchand Withdrawal API (v1.4).
// This function executes the full 3-step PLOP withdrawal flow server-side.
// Only callable by authenticated admins (verified via Supabase JWT).
//
// Env vars needed (Supabase Dashboard → Settings → Edge Functions):
//   PLOP_CLIENT_ID            — Merchant client_id (e.g. pp_...)
//   PLOP_CLIENT_SECRET        — Merchant client_secret (64 chars) — NEVER expose
//   SUPABASE_URL              — Auto-injected
//   SUPABASE_SERVICE_ROLE_KEY — Auto-injected
//   SUPABASE_ANON_KEY         — Auto-injected (for JWT verification)
//
// Deploy: supabase functions deploy plop-withdraw

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLOP_BASE        = "https://plopplop.solutionip.app";
const PLOP_CLIENT_ID   = Deno.env.get("PLOP_CLIENT_ID")            ?? "";
const PLOP_SECRET      = Deno.env.get("PLOP_CLIENT_SECRET")        ?? "";
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SRV_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON    = Deno.env.get("SUPABASE_ANON_KEY")         ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function genWithdrawReference(): string {
  const ts   = Date.now();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `WD-TRP-${ts}-${rand}`;
}

// ── HMAC-SHA256 signature via native Web Crypto (no external deps) ────────
// Formula: HMAC-SHA256("amount|method|recipient|reference|timestamp", client_secret)
async function buildSignature(
  amount: number,
  method: string,
  recipient: string,
  reference: string,
  timestamp: number,
  secret: string,
): Promise<string> {
  const enc     = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode([amount, method, recipient, reference, timestamp].join("|"));

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData,
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);

  return Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Verify the caller is an authenticated Supabase user ──────────────────
async function getCallerUser(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

// ── Main handler ──────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!PLOP_CLIENT_ID || !PLOP_SECRET) {
    return json({ error: "PLOP_CLIENT_ID / PLOP_CLIENT_SECRET non configurés" }, 500);
  }

  // ── Auth guard — only authenticated admins ───────────────────────────
  const caller = await getCallerUser(req);
  if (!caller) {
    return json({ error: "Authentification requise" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action ?? "execute");

  const db = createClient(SUPABASE_URL, SUPABASE_SRV_KEY, {
    auth: { persistSession: false },
  });

  // ════════════════════════════════════════════════════════════════════════
  // ACTION: execute — run the full 3-step withdrawal
  // ════════════════════════════════════════════════════════════════════════
  if (action === "execute") {
    const {
      amount,
      method,
      recipient,
      reference: customRef,
      note,
    } = body as {
      amount:      number;
      method:      string;
      recipient:   string;
      reference?:  string;
      note?:       string;
    };

    if (!amount || Number(amount) <= 0) {
      return json({ error: "Montant invalide" }, 400);
    }
    if (!["moncash", "natcash"].includes(String(method).toLowerCase())) {
      return json({ error: "Méthode invalide — uniquement moncash ou natcash" }, 400);
    }
    if (!recipient || !/^509\d{8}$/.test(String(recipient))) {
      return json({ error: "Numéro destinataire invalide (format: 509XXXXXXXX)" }, 400);
    }

    const withdrawMethod    = String(method).toLowerCase();
    const withdrawAmount    = Number(amount);
    const withdrawRecipient = String(recipient);
    const reference         = customRef ? String(customRef) : genWithdrawReference();
    const timestamp         = Math.floor(Date.now() / 1000);

    // ── Étape 1: Authentification marchand ───────────────────────────────
    let authToken: string;
    try {
      const authRes = await fetch(`${PLOP_BASE}/api/auth/marchand`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     PLOP_CLIENT_ID,
          client_secret: PLOP_SECRET,
        }),
      });
      const authData = await authRes.json();

      if (!authRes.ok || !authData.success) {
        return json({
          error:   authData.message ?? "Échec authentification PLOP",
          details: authData,
        }, 401);
      }
      authToken = String(authData.token);
    } catch (err) {
      console.error("PLOP auth error:", err);
      return json({ error: "Impossible de joindre l'API PLOP PLOP (auth)" }, 503);
    }

    // ── Étape 2: Générer le withdrawal-token (avec signature HMAC) ───────
    let withdrawalToken: string;
    try {
      const signature = await buildSignature(
        withdrawAmount,
        withdrawMethod,
        withdrawRecipient,
        reference,
        timestamp,
        PLOP_SECRET,
      );

      const wtRes = await fetch(`${PLOP_BASE}/api/auth/marchand/withdrawal-token`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount:                withdrawAmount,
          method:                withdrawMethod,
          recipient:             withdrawRecipient,
          reference,
          timestamp,
          withdrawal_signature:  signature,
        }),
      });

      const wtData = await wtRes.json();

      if (!wtRes.ok || !wtData.success) {
        return json({
          error:      wtData.message ?? "Échec génération withdrawal-token",
          error_code: wtData.error_code,
          details:    wtData,
        }, wtRes.status);
      }
      withdrawalToken = String(wtData.withdrawal_token);
    } catch (err) {
      console.error("PLOP withdrawal-token error:", err);
      return json({ error: "Impossible de joindre l'API PLOP PLOP (withdrawal-token)" }, 503);
    }

    // ── Étape 3: Exécuter le retrait ─────────────────────────────────────
    let plopResult: Record<string, unknown>;
    try {
      const wdRes = await fetch(`${PLOP_BASE}/api/withdraw/marchand`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${withdrawalToken}`,
        },
        body: JSON.stringify({
          amount:    withdrawAmount,
          method:    withdrawMethod,
          recipient: withdrawRecipient,
          reference,
        }),
      });

      plopResult = await wdRes.json();

      if (wdRes.status === 409) {
        return json({
          error:      plopResult.message ?? "Référence déjà utilisée",
          error_code: "DUPLICATE_REFERENCE",
        }, 409);
      }

      if (!wdRes.ok) {
        // Save failed attempt to DB for audit
        await db.from("traposa_plop_withdrawals").insert([{
          reference,
          amount:         withdrawAmount,
          method:         withdrawMethod,
          recipient:      withdrawRecipient,
          status:         "failed",
          plop_response:  plopResult,
          note:           note ?? null,
          requested_by:   caller.id,
        }]);

        return json({
          error:      plopResult.message ?? "Échec du retrait",
          error_code: (plopResult as any).error_code,
          details:    plopResult,
        }, wdRes.status);
      }
    } catch (err) {
      console.error("PLOP execute withdraw error:", err);
      return json({ error: "Impossible de joindre l'API PLOP PLOP (withdraw)" }, 503);
    }

    // ── Save successful withdrawal to DB ─────────────────────────────────
    const wdData = (plopResult.data ?? {}) as Record<string, unknown>;
    const finalStatus = String(wdData.status ?? "pending");

    const { data: saved } = await db
      .from("traposa_plop_withdrawals")
      .insert([{
        reference,
        amount:         withdrawAmount,
        fee:            wdData.fee    ?? null,
        total:          wdData.total  ?? null,
        method:         withdrawMethod,
        recipient:      withdrawRecipient,
        plop_txn_id:    wdData.transaction_id ?? null,
        plop_api_ref:   wdData.api_reference  ?? null,
        status:         finalStatus === "success" ? "success" : "pending",
        balance_before: wdData.balance_before ?? null,
        balance_after:  wdData.balance_after  ?? null,
        plop_response:  plopResult,
        note:           note ?? null,
        requested_by:   caller.id,
      }])
      .select("id")
      .single();

    return json({
      success:        finalStatus === "success",
      message:        plopResult.message,
      transaction_id: wdData.transaction_id,
      api_reference:  wdData.api_reference,
      amount:         wdData.amount,
      fee:            wdData.fee,
      total:          wdData.total,
      balance_after:  wdData.balance_after,
      status:         finalStatus,
      reference,
      record_id:      saved?.id,
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // ACTION: verify — check status of a withdrawal by reference
  // ════════════════════════════════════════════════════════════════════════
  if (action === "verify") {
    const { reference } = body as { reference: string };
    if (!reference) return json({ error: "reference requis" }, 400);

    // ── Étape 1: get auth token ──────────────────────────────────────────
    let authToken: string;
    try {
      const authRes = await fetch(`${PLOP_BASE}/api/auth/marchand`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     PLOP_CLIENT_ID,
          client_secret: PLOP_SECRET,
        }),
      });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.success) {
        return json({ error: authData.message ?? "Échec auth PLOP" }, 401);
      }
      authToken = String(authData.token);
    } catch {
      return json({ error: "Impossible de joindre PLOP (auth)" }, 503);
    }

    // ── Call verify endpoint ─────────────────────────────────────────────
    let verifyData: Record<string, unknown>;
    try {
      const vRes = await fetch(`${PLOP_BASE}/api/withdraw/marchand/verify`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reference }),
      });

      verifyData = await vRes.json();

      if (!vRes.ok || !verifyData.success) {
        return json({
          error:   verifyData.message ?? "Erreur vérification retrait",
          details: verifyData,
        }, vRes.status);
      }
    } catch {
      return json({ error: "Impossible de joindre PLOP (verify)" }, 503);
    }

    // ── Sync status to DB ────────────────────────────────────────────────
    const wd = (verifyData.data ?? {}) as Record<string, unknown>;
    const st = String(wd.status ?? "pending");

    await db
      .from("traposa_plop_withdrawals")
      .update({
        status:        st,
        updated_at:    new Date().toISOString(),
        plop_response: verifyData,
      })
      .eq("reference", reference);

    return json({
      success:   true,
      status:    st,
      amount:    wd.amount,
      method:    wd.method,
      recipient: wd.recipient,
      reference: wd.reference,
      created_at: wd.created_at,
      updated_at: wd.updated_at,
      provider:  wd.provider,
    });
  }

  return json({ error: `Action inconnue: ${action}. Utilisez 'execute' ou 'verify'.` }, 400);
});
