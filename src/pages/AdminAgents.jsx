import { useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useEffect } from "react";
import { Plus, Search, UserCog, Ban, CheckCircle2 } from "lucide-react";
import { db } from "../firebase/config";
import { isAdmin } from "../lib/roles";
import { getDoc } from "firebase/firestore";
import { logActivity } from "../lib/activityLog";
import { useAuth } from "../context/AuthContext";

const fieldClass =
  "w-full rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export default function AdminAgents() {
  const { profile, user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["agent", "alphaAgent"]));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAgents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) =>
      [a.name, a.email].filter(Boolean).some((f) => f.toLowerCase().includes(q))
    );
  }, [agents, search]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim() || !password || password.length < 6) {
      return setError("Email and password (min 6 characters) are required.");
    }

    setSaving(true);
    let secondaryApp = null;
    try {
      // Secondary app so we don't sign the admin out
      secondaryApp = initializeApp(firebaseConfig, "AgentCreator-" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim().toLowerCase(),
        password
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        email: email.trim().toLowerCase(),
        name: name.trim() || email.trim().split("@")[0],
        role: "agent",
        status: "active",
        emailVerified: true,
        profileComplete: true,
        createdAt: serverTimestamp(),
        createdByAdmin: true,
      });

      await signOut(secondaryAuth);
      setSuccess(`Agent account created for ${email.trim().toLowerCase()}. They can sign in now.`);
      setName("");
      setEmail("");
      setPassword("");
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Failed to create agent.");
    } finally {
      setSaving(false);
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch {
          /* ignore */
        }
      }
    }
  }

  async function toggleSuspend(agent) {
    try {
      await updateDoc(doc(db, "users", agent.id), {
        status: agent.status === "suspended" ? "active" : "suspended",
      });
    } catch (err) {
      alert(err.message || "Could not update status.");
    }
  }

  async function promoteToAlpha(agent) {
    if (!isAdmin(profile)) return alert("Only admins can promote agents to Alpha.");
    if (!window.confirm(`Promote ${agent.name || agent.email} to Agent Alpha?`)) return;
    try {
      await updateDoc(doc(db, "users", agent.id), { role: "alphaAgent" });
      await logActivity({
        actorUid: user.uid,
        actorName: profile?.name || user.email,
        action: "role.change",
        targetUid: agent.id,
        targetName: agent.name || agent.email,
        meta: { from: agent.role, to: "alphaAgent" },
      });
      alert("Promoted");
    } catch (e) {
      alert(e.message || "Could not promote");
    }
  }

  async function demoteToAgent(agent) {
    if (!isAdmin(profile)) return alert("Only admins can demote Alpha agents.");
    if (!window.confirm(`Demote ${agent.name || agent.email} to Agent (Beta)?`)) return;
    try {
      await updateDoc(doc(db, "users", agent.id), { role: "agent" });
      await logActivity({
        actorUid: user.uid,
        actorName: profile?.name || user.email,
        action: "role.change",
        targetUid: agent.id,
        targetName: agent.name || agent.email,
        meta: { from: agent.role, to: "agent" },
      });
      alert("Demoted");
    } catch (e) {
      alert(e.message || "Could not demote");
    }
  }

  function PromoteButton({ agent }) {
    if (!isAdmin(profile)) return null;
    if (agent.role === "agent") {
      return (
        <button onClick={() => promoteToAlpha(agent)} className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary" title="Promote to Alpha">Alpha+</button>
      );
    }
    if (agent.role === "alphaAgent") {
      return (
        <button onClick={() => demoteToAgent(agent)} className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary" title="Demote to Agent">Alpha-</button>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Agents</h1>
          <p className="text-sm text-text-secondary">
            Only admins can create agent accounts. Agents can upload documents, courses, and CBT questions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setError("");
            setSuccess("");
          }}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-app hover:bg-accent-strong"
        >
          <Plus size={16} />
          {showForm ? "Cancel" : "Create agent"}
        </button>
      </div>

      {success && (
        <p className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
          {success}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-border-subtle bg-bg-panel p-5"
        >
          <h2 className="text-sm font-semibold text-text-primary">New agent account</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-text-muted">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="Grace Hopper"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="agent@uofa.edu"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Temp password *</label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                placeholder="Min 6 characters"
              />
            </div>
          </div>
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create agent"}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 sm:max-w-xs">
        <Search size={15} className="text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-bg-panel">
        {loading && (
          <div className="px-4 py-6 text-center text-sm text-text-muted">Loading…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            <UserCog size={28} className="mx-auto mb-2 opacity-50" />
            No agents yet. Create one above.
          </div>
        )}
        {filtered.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{a.name || "—"}</p>
              <p className="text-xs text-text-muted">{a.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  a.status === "suspended"
                    ? "bg-status-danger/15 text-status-danger"
                    : "bg-accent-soft text-accent"
                }`}
              >
                {a.status === "suspended" ? "Suspended" : "Active"}
              </span>
              {/** Promote/demote actions (admins only) */}
              {/** eslint-disable-next-line react/jsx-no-bind */}
              <div className="flex items-center gap-1">
                {/** Promote to Alpha */}
                {/** Only admins can change agent <> alpha */}
                <PromoteButton agent={a} />
              </div>
              <button
                type="button"
                onClick={() => toggleSuspend(a)}
                className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                title={a.status === "suspended" ? "Activate" : "Suspend"}
              >
                {a.status === "suspended" ? <CheckCircle2 size={15} /> : <Ban size={15} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
