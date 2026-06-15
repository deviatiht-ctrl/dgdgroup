// @ts-nocheck
// Supabase Edge Function — plop-payment
// Handles PLOP PLOP payment initiation and verification for TRAPOSA donations.
//
// Env vars needed (Supabase Dashboard → Settings → Edge Functions):
//   PLOP_CLIENT_ID       — Merchant client_id from PLOP PLOP (e.g. pp_...)
//   PLOP_CLIENT_SECRET   — Merchant client_secret (64 chars) — NEVER expose to frontend
//   SUPABASE_URL         — Auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — Auto-injected by Supabase (bypasses RLS for writes)
//
// Deploy: supabase functions deploy plop-payment

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLOP_BASE        = "https://plopplop.solutionip.app";
const PLOP_CLIENT_ID   = Deno.env.get("PLOP_CLIENT_ID")   ?? "";
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")      ?? "";
const SUPABASE_SRV_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── PLOP payment methods accepted ─────────────────────────────────────────
const PLOP_METHODS = new Set(["moncash", "natcash", "kashpaw", "all"]);

// ── Helpers ────────────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function genReference(): string {
  const ts   = Date.now();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRP-${ts}-${rand}`;
}

// ── Main handler ──────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!PLOP_CLIENT_ID) {
    return json({ error: "PLOP_CLIENT_ID not configured on server" }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action ?? "initiate");

  // ── Supabase admin client (service-role, bypasses RLS) ───────────────────
  const db = createClient(SUPABASE_URL, SUPABASE_SRV_KEY, {
    auth: { persistSession: false },
  });

  // ════════════════════════════════════════════════════════════════════════
  // ACTION: initiate — create a new PLOP payment transaction
  // ════════════════════════════════════════════════════════════════════════
  if (action === "initiate") {
    const {
      amount,
      payment_method,
      donation_id,
      donor_name,
      donor_email,
    } = body as {
      amount:         number;
      payment_method: string;
      donation_id?:   string;
      donor_name?:    string;
      donor_email?:   string;
    };

    if (!amount || Number(amount) < 20) {
      return json({ error: "Montant invalide (minimum 20 HTG)" }, 400);
    }

    const method = String(payment_method ?? "").toLowerCase();
    if (!PLOP_METHODS.has(method)) {
      return json({ error: `Méthode invalide: ${method}. Acceptés: moncash, natcash, kashpaw, all` }, 400);
    }

    const referenceId = genReference();

    // ── Call PLOP API ────────────────────────────────────────────────────
    let plopData: Record<string, unknown>;
    try {
      const res = await fetch(`${PLOP_BASE}/api/paiement-marchand`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     PLOP_CLIENT_ID,
          refference_id: referenceId,          // PLOP uses double-f spelling
          montant:       Number(amount),
          payment_method: method,
        }),
      });

      plopData = await res.json();

      if (!res.ok || !plopData.status) {
        console.error("PLOP initiate error:", plopData);
        return json({
          error:   plopData.message ?? "Erreur PLOP PLOP lors de la création du paiement",
          details: plopData,
        }, 400);
      }
    } catch (err) {
      console.error("PLOP fetch error:", err);
      return json({ error: "Impossible de joindre l'API PLOP PLOP" }, 503);
    }

    // ── Save to traposa_plop_transactions ────────────────────────────────
    const { data: txn, error: dbErr } = await db
      .from("traposa_plop_transactions")
      .insert([{
        donation_id:    donation_id ?? null,
        reference_id:   referenceId,
        plop_txn_id:    String(plopData.transaction_id ?? ""),
        payment_method: method,
        amount:         Number(amount),
        currency:       "HTG",
        status:         "pending",
        redirect_url:   String(plopData.url ?? ""),
        plop_response:  plopData,
      }])
      .select("id, reference_id, redirect_url, plop_txn_id")
      .single();

    if (dbErr) {
      console.error("DB insert error:", dbErr);
      // Return the redirect URL anyway — payment was created on PLOP side
      return json({
        success:      true,
        url:          plopData.url,
        transaction_id: plopData.transaction_id,
        reference_id: referenceId,
        db_error:     dbErr.message,
      });
    }

    return json({
      success:        true,
      url:            txn.redirect_url,
      transaction_id: txn.plop_txn_id,
      reference_id:   txn.reference_id,
      plop_record_id: txn.id,
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // ACTION: verify — check status of an existing PLOP transaction
  // ════════════════════════════════════════════════════════════════════════
  if (action === "verify") {
    const { reference_id } = body as { reference_id: string };

    if (!reference_id) {
      return json({ error: "reference_id requis" }, 400);
    }

    // ── Call PLOP verify API ─────────────────────────────────────────────
    let plopData: Record<string, unknown>;
    try {
      const res = await fetch(`${PLOP_BASE}/api/paiement-verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     PLOP_CLIENT_ID,
          refference_id: reference_id,
        }),
      });

      plopData = await res.json();

      if (!res.ok || !plopData.status) {
        return json({
          error:   plopData.message ?? "Erreur vérification PLOP",
          details: plopData,
        }, 400);
      }
    } catch (err) {
      console.error("PLOP verify fetch error:", err);
      return json({ error: "Impossible de joindre l'API PLOP PLOP" }, 503);
    }

    // trans_status: "ok" = confirmed, "no" = pending
    const confirmed = String(plopData.trans_status) === "ok";
    const newStatus = confirmed ? "confirmed" : "pending";

    // ── Update traposa_plop_transactions ─────────────────────────────────
    const { data: txn } = await db
      .from("traposa_plop_transactions")
      .update({
        status:        newStatus,
        plop_response: plopData,
        verified_at:   confirmed ? new Date().toISOString() : null,
        updated_at:    new Date().toISOString(),
      })
      .eq("reference_id", reference_id)
      .select("id, donation_id")
      .single();

    // ── If confirmed, update the linked donation status ──────────────────
    if (confirmed && txn?.donation_id) {
      await db
        .from("traposa_donations")
        .update({
          status:     "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", txn.donation_id);
    }

    return json({
      success:        true,
      confirmed,
      trans_status:   plopData.trans_status,
      montant:        plopData.montant,
      method:         plopData.method,
      id_transaction: plopData.id_transaction,
      date:           plopData.date,
      heure:          plopData.heure,
    });
  }

  return json({ error: `Action inconnue: ${action}. Utilisez 'initiate' ou 'verify'.` }, 400);
});
