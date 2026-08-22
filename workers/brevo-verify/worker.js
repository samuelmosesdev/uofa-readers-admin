/**
 * Academical — Brevo email verification worker (Cloudflare Workers, free tier)
 *
 * Endpoints:
 *   POST /send   { idToken }           → emails a 6-digit code via Brevo
 *   POST /verify { idToken, code }     → marks user emailVerified in Firestore
 *
 * Secrets (wrangler secret put …):
 *   BREVO_API_KEY
 *   BREVO_SENDER_EMAIL   e.g. verify@yourdomain.com or the free brevo sender
 *   BREVO_SENDER_NAME    e.g. Academical
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (service account private key, newlines as \n)
 */

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    try {
      const body = await request.json();
      if (path.endsWith("/send")) return await handleSend(body, env);
      if (path.endsWith("/verify")) return await handleVerify(body, env);
      return json({ error: "Not found. Use /send or /verify" }, 404);
    } catch (e) {
      return json({ error: e.message || "Server error" }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function handleSend(body, env) {
  const idToken = body.idToken || body.token;
  if (!idToken) return json({ error: "idToken required" }, 400);

  const decoded = await verifyFirebaseIdToken(idToken, env.FIREBASE_PROJECT_ID);
  const uid = decoded.user_id || decoded.sub;
  const email = decoded.email;
  if (!email) return json({ error: "Token has no email" }, 400);

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + CODE_TTL_MS;

  // Store code on user doc via Admin REST
  await firestorePatch(
    env,
    `users/${uid}`,
    {
      fields: {
        emailVerifyCode: { stringValue: code },
        emailVerifyExpiresAt: { integerValue: String(expiresAt) },
        emailVerified: { booleanValue: false },
      },
    },
    ["emailVerifyCode", "emailVerifyExpiresAt"]
  );

  const senderEmail = env.BREVO_SENDER_EMAIL;
  const senderName = env.BREVO_SENDER_NAME || "Academical";
  if (!env.BREVO_API_KEY || !senderEmail) {
    return json({ error: "Brevo is not configured on the worker" }, 500);
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: decoded.name || email }],
      subject: "Your Academical verification code",
      htmlContent: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h1 style="color:#0f9f8a;font-size:22px;margin:0 0 12px">Academical</h1>
          <p style="color:#14201c;font-size:15px;line-height:1.5">
            Use this code to verify your email. It expires in <strong>15 minutes</strong>.
          </p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#0b7a6a;margin:24px 0">
            ${code}
          </p>
          <p style="color:#6b7f76;font-size:13px">
            If you did not create an Academical account, you can ignore this email.
          </p>
        </div>
      `,
      textContent: `Academical verification code: ${code}\n\nExpires in 15 minutes.\nIf you did not sign up, ignore this email.`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return json({ error: `Brevo error: ${errText.slice(0, 200)}` }, 502);
  }

  return json({ ok: true, message: "Code sent" });
}

async function handleVerify(body, env) {
  const idToken = body.idToken || body.token;
  const code = String(body.code || "").trim();
  if (!idToken || !code) return json({ error: "idToken and code required" }, 400);
  if (!/^\d{6}$/.test(code)) return json({ error: "Code must be 6 digits" }, 400);

  const decoded = await verifyFirebaseIdToken(idToken, env.FIREBASE_PROJECT_ID);
  const uid = decoded.user_id || decoded.sub;

  const doc = await firestoreGet(env, `users/${uid}`);
  if (!doc || !doc.fields) return json({ error: "User profile not found" }, 404);

  const stored = doc.fields.emailVerifyCode?.stringValue || "";
  const expiresAt = Number(doc.fields.emailVerifyExpiresAt?.integerValue || 0);

  if (!stored || stored !== code) {
    return json({ error: "Invalid code" }, 400);
  }
  if (!expiresAt || Date.now() > expiresAt) {
    return json({ error: "Code expired. Request a new one." }, 400);
  }

  await firestorePatch(
    env,
    `users/${uid}`,
    {
      fields: {
        emailVerified: { booleanValue: true },
        emailVerifyCode: { nullValue: null },
        emailVerifyExpiresAt: { nullValue: null },
        emailVerifiedAt: { timestampValue: new Date().toISOString() },
      },
    },
    ["emailVerified", "emailVerifyCode", "emailVerifyExpiresAt", "emailVerifiedAt"]
  );

  return json({ ok: true, verified: true });
}

/** Verify Firebase ID token via Google tokeninfo (simple; fine for this volume) */
async function verifyFirebaseIdToken(idToken, projectId) {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) throw new Error("Invalid or expired session. Sign in again.");
  const data = await res.json();
  if (data.aud !== projectId && data.azp !== projectId) {
    // Also accept Web API key audience — check iss
    if (!String(data.iss || "").includes("securetoken.google.com")) {
      throw new Error("Token audience mismatch");
    }
  }
  if (projectId && data.aud && data.aud !== projectId) {
    // Firebase ID tokens have aud = projectId
    if (data.aud !== projectId) {
      // some setups use project number — still require securetoken iss
      if (!String(data.iss || "").includes("securetoken.google.com")) {
        throw new Error("Invalid token issuer");
      }
    }
  }
  return data;
}

async function getGoogleAccessToken(env) {
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  let privateKey = env.FIREBASE_PRIVATE_KEY || "";
  privateKey = privateKey.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Firebase service account not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const b64 = (obj) =>
    btoa(String.fromCharCode(...enc.encode(JSON.stringify(obj))))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsigned = `${b64(header)}.${b64(claim)}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(unsigned)
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const jwt = `${unsigned}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenRes.ok) {
    throw new Error("Failed to auth with Google (service account)");
  }
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function firestoreGet(env, docPath) {
  const accessToken = await getGoogleAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Firestore read failed");
  return res.json();
}

async function firestorePatch(env, docPath, body, fieldPaths) {
  const accessToken = await getGoogleAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  const mask = fieldPaths.map((f) => `updateMask.fieldPaths=${f}`).join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}?${mask}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Firestore write failed: ${t.slice(0, 180)}`);
  }
  return res.json();
}
