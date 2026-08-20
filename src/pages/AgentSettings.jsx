import { useEffect, useMemo, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Save, Loader2, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase/config";
import { FACULTIES, departmentsFor } from "../data/facultyData";

const fieldClass =
  "w-full rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";

export default function AgentSettings() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [prefs, setPrefs] = useState({ canImportAI: true, autoPublish: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const departments = useMemo(() => departmentsFor(faculty), [faculty]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setFaculty(profile.faculty || "");
    setDepartment(profile.department || "");
    setPrefs({
      canImportAI: profile.canImportAI ?? true,
      autoPublish: profile.autoPublish ?? false,
    });
  }, [profile]);

  function setPref(key, val) {
    setPrefs((p) => ({ ...p, [key]: val }));
  }

  async function save(e) {
    e?.preventDefault?.();
    if (!user) return;
    setSaving(true);
    setMsg("");
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        faculty: faculty || null,
        department: department || null,
        canImportAI: !!prefs.canImportAI,
        autoPublish: !!prefs.autoPublish,
        settingsUpdatedAt: serverTimestamp(),
      });
      setMsg("Settings saved.");
    } catch (err) {
      setMsg(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Agent Settings</h1>
        <p className="text-sm text-text-secondary">Account and agent preferences.</p>
      </div>

      <form onSubmit={save} className="rounded-xl border border-border-subtle bg-bg-panel p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Account</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-text-muted">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Faculty</label>
            <select
              value={faculty}
              onChange={(e) => {
                setFaculty(e.target.value);
                setDepartment("");
              }}
              className={fieldClass}
            >
              <option value="">Select faculty</option>
              {FACULTIES.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className={fieldClass} disabled={!faculty}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3 className="mt-6 mb-2 text-sm font-semibold text-text-primary">Agent Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!prefs.canImportAI} onChange={(e) => setPref("canImportAI", e.target.checked)} />
            <span className="text-sm text-text-primary">Allow AI course import</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!prefs.autoPublish} onChange={(e) => setPref("autoPublish", e.target.checked)} />
            <span className="text-sm text-text-primary">Auto-publish uploaded documents</span>
          </label>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg-app hover:bg-accent-strong disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save settings
          </button>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2.5 text-sm text-text-secondary hover:text-status-danger">
            <LogOut size={15} /> Log out
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-teal">{msg}</p>}
      </form>
    </div>
  );
}
