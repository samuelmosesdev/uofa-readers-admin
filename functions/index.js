/**
 * Cloud Functions — UofA Readers
 *
 * - paystackWebhook: verifies x-paystack-signature (HMAC SHA-512), activates Pro
 * - verifyPaystackReference: admin-only manual verify (Firebase ID token required)
 *
 * Setup:
 *   cd functions && npm install
 *   firebase functions:config:set paystack.secret="sk_test_..."   # or sk_live_...
 *   firebase deploy --only functions,firestore:rules,storage
 *
 * Paystack Dashboard → Settings → API & Webhooks:
 *   URL: https://<region>-<project-id>.cloudfunctions.net/paystackWebhook
 *   Events: charge.success
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

function getPaystackSecret() {
  const fromConfig = functions.config().paystack?.secret;
  return fromConfig || process.env.PAYSTACK_SECRET_KEY || "";
}

/** HMAC-SHA512 + timing-safe compare (Paystack standard). */
function verifyPaystackSignature(rawBody, signature, secret) {
  if (!secret || !signature || !rawBody) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
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

/**
 * Upgrade user to Pro. Prefer metadata.userId; fall back to exact email match only.
 * Does NOT scan the entire users collection (cost + privacy).
 */
async function activatePro({ userId, email, planId, reference, amount, raw }) {
  let uid = userId;

  if (!uid && email) {
    const snap = await db
      .collection("users")
      .where("email", "==", email)
      .limit(5)
      .get();
    if (snap.empty) {
      return { ok: false, reason: "no_user_for_email", email };
    }
    uid = snap.docs[0].id;
  }

  if (!uid) return { ok: false, reason: "missing_user" };

  const batch = db.batch();
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

  const claims = await db
    .collection("paymentClaims")
    .where("userId", "==", uid)
    .limit(30)
    .get();
  claims.docs.forEach((d) => {
    if (d.data().status === "activated") return;
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

/** Require a valid Firebase ID token belonging to an admin user. */
async function requireAdmin(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error("Missing Authorization Bearer token");
    err.status = 401;
    throw err;
  }
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(match[1]);
  } catch {
    const err = new Error("Invalid token");
    err.status = 401;
    throw err;
  }
  const userSnap = await db.collection("users").doc(decoded.uid).get();
  if (!userSnap.exists || userSnap.data().role !== "admin") {
    const err = new Error("Admin only");
    err.status = 403;
    throw err;
  }
  return decoded;
}

// ── Paystack webhook ─────────────────────────────────────────
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
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

  // Prefer rawBody (Buffer) so HMAC matches what Paystack signed
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
    event = typeof req.body === "object" && req.body !== null
      ? req.body
      : JSON.parse(rawBody);
  } catch {
    res.status(400).send("Invalid JSON");
    return;
  }

  const eventType = event.event;
  const data = event.data || {};

  if (eventType !== "charge.success" && eventType !== "subscription.create") {
    res.status(200).json({ received: true, handled: false, event: eventType });
    return;
  }

  // Idempotency
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
  const amount = typeof data.amount === "number" ? data.amount / 100 : null;

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

// ── Admin-only manual verify ─────────────────────────────────
exports.verifyPaystackReference = functions.https.onRequest(async (req, res) => {
  // CORS for admin dashboard calls (same origin or locked down later)
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    await requireAdmin(req);
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
    return;
  }

  const secret = getPaystackSecret();
  if (!secret) {
    res.status(500).json({ error: "Secret not set" });
    return;
  }

  const reference = (req.query.reference || req.body?.reference || "")
    .toString()
    .trim();
  if (!reference) {
    res.status(400).json({ error: "reference required" });
    return;
  }

  try {
    const resp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
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
