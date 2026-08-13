/**
 * Paystack webhook → auto-activate Pro on successful charge.
 *
 * Setup:
 * 1. firebase functions:config:set paystack.secret="sk_live_xxx"
 *    (or set env PAYSTACK_SECRET_KEY when using secrets)
 * 2. Deploy: firebase deploy --only functions
 * 3. In Paystack Dashboard → Settings → API Keys & Webhooks
 *    URL: https://<region>-<project-id>.cloudfunctions.net/paystackWebhook
 *    Events: charge.success, subscription.create (optional)
 *
 * Matching: customer email on the charge is matched to users.email (case-insensitive).
 * If multiple users share an email (shouldn't), the first match is upgraded.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

function getPaystackSecret() {
  // Prefer functions config, then process.env
  const fromConfig = functions.config().paystack?.secret;
  return fromConfig || process.env.PAYSTACK_SECRET_KEY || "";
}

function verifyPaystackSignature(rawBody, signature, secret) {
  if (!secret || !signature || !rawBody) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  // timing-safe compare
  try {
    const a = Buffer.from(hash, "utf8");
    const b = Buffer.from(String(signature), "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractEmail(eventData) {
  const d = eventData || {};
  return (
    d.customer?.email ||
    d.email ||
    d.authorization?.email ||
    d.metadata?.email ||
    d.metadata?.customer_email ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();
}

function extractUserId(eventData) {
  const m = eventData?.metadata || {};
  return (m.userId || m.user_id || m.uid || "").toString().trim();
}

function extractPlanId(eventData) {
  const m = eventData?.metadata || {};
  const ref = (eventData?.reference || "").toString().toLowerCase();
  if (m.planId || m.plan_id) return String(m.planId || m.plan_id);
  if (ref.includes("weekly")) return "weekly";
  if (ref.includes("monthly")) return "monthly";
  if (ref.includes("annual") || ref.includes("year")) return "annual";
  return "annual";
}

async function activatePro({ userId, email, planId, reference, amount, raw }) {
  const batch = db.batch();
  let uid = userId;

  if (!uid && email) {
    const snap = await db.collection("users").where("email", "==", email).limit(5).get();
    // also try case variants if stored mixed
    let docs = snap.docs;
    if (docs.length === 0) {
      const all = await db.collection("users").where("role", "==", "user").get();
      docs = all.docs.filter((d) => (d.data().email || "").toLowerCase() === email);
    }
    if (docs.length === 0) {
      return { ok: false, reason: "no_user_for_email", email };
    }
    uid = docs[0].id;
  }

  if (!uid) return { ok: false, reason: "missing_user" };

  const userRef = db.collection("users").doc(uid);
  batch.set(
    userRef,
    {
      plan: "pro",
      subscription: "pro",
      subscriptionPlanId: planId || "annual",
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      planUpdatedBy: "paystack_webhook",
      lastPaymentReference: reference || null,
      lastPaymentAmount: amount ?? null,
    },
    { merge: true }
  );

  // Log payment
  const payRef = db.collection("payments").doc();
  batch.set(payRef, {
    userId: uid,
    email: email || null,
    planId: planId || "annual",
    reference: reference || null,
    amount: amount ?? null,
    source: "paystack_webhook",
    status: "success",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    rawSummary: {
      channel: raw?.channel || null,
      paid_at: raw?.paid_at || null,
      currency: raw?.currency || null,
    },
  });

  // Close open claims for this user
  const claims = await db
    .collection("paymentClaims")
    .where("userId", "==", uid)
    .limit(30)
    .get();
  claims.docs.forEach((d) => {
    const st = d.data().status;
    if (st === "activated") return;
    batch.update(d.ref, {
      status: "activated",
      activatedAt: admin.firestore.FieldValue.serverTimestamp(),
      activatedBy: "paystack_webhook",
      reference: reference || null,
    });
  });

  await batch.commit();
  return { ok: true, userId: uid, email, planId };
}

exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  // Paystack only uses POST
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const secret = getPaystackSecret();
  if (!secret) {
    console.error("PAYSTACK secret not configured");
    res.status(500).send("Server misconfigured");
    return;
  }

  // Firebase provides rawBody as Buffer for signature verification
  const rawBody = req.rawBody
    ? req.rawBody.toString("utf8")
    : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body);

  const signature = req.headers["x-paystack-signature"];
  if (!verifyPaystackSignature(rawBody, signature, secret)) {
    console.warn("Invalid Paystack signature");
    res.status(401).send("Invalid signature");
    return;
  }

  let event;
  try {
    event = typeof req.body === "object" ? req.body : JSON.parse(rawBody);
  } catch (e) {
    res.status(400).send("Invalid JSON");
    return;
  }

  const eventType = event.event;
  const data = event.data || {};

  // Acknowledge quickly for non-success events
  if (eventType !== "charge.success" && eventType !== "subscription.create") {
    res.status(200).json({ received: true, handled: false, event: eventType });
    return;
  }

  // Idempotency: skip if we already processed this reference
  const reference = data.reference || data.subscription_code || null;
  if (reference) {
    const existing = await db
      .collection("payments")
      .where("reference", "==", reference)
      .limit(1)
      .get();
    if (!existing.empty) {
      res.status(200).json({ received: true, duplicate: true, reference });
      return;
    }
  }

  const email = extractEmail(data);
  const userId = extractUserId(data);
  const planId = extractPlanId(data);
  const amount = typeof data.amount === "number" ? data.amount / 100 : null; // kobo → naira

  try {
    const result = await activatePro({
      userId,
      email,
      planId,
      reference,
      amount,
      raw: data,
    });

    if (!result.ok) {
      console.warn("Paystack success but could not activate", result);
      // Still 200 so Paystack does not retry forever for unknown emails —
      // store orphan for admin
      await db.collection("paymentOrphans").add({
        reason: result.reason,
        email: email || null,
        reference: reference || null,
        amount,
        planId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        event: eventType,
      });
      res.status(200).json({ received: true, activated: false, ...result });
      return;
    }

    console.log("Pro activated via Paystack", result);
    res.status(200).json({ received: true, activated: true, ...result });
  } catch (err) {
    console.error("Webhook handler error", err);
    res.status(500).send("Handler error");
  }
});

/**
 * Optional: admin-callable style HTTP to verify a reference manually (protect with admin check later).
 * GET/POST ?reference=xxx using Paystack verify API.
 */
exports.verifyPaystackReference = functions.https.onRequest(async (req, res) => {
  const secret = getPaystackSecret();
  if (!secret) {
    res.status(500).json({ error: "Secret not set" });
    return;
  }
  const reference = (req.query.reference || req.body?.reference || "").toString().trim();
  if (!reference) {
    res.status(400).json({ error: "reference required" });
    return;
  }

  try {
    const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const json = await resp.json();
    if (!json.status || json.data?.status !== "success") {
      res.status(200).json({ verified: false, paystack: json });
      return;
    }

    const data = json.data;
    const email = extractEmail(data);
    const userId = extractUserId(data);
    const planId = extractPlanId(data);
    const amount = typeof data.amount === "number" ? data.amount / 100 : null;

    const result = await activatePro({
      userId,
      email,
      planId,
      reference: data.reference,
      amount,
      raw: data,
    });
    res.status(200).json({ verified: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
