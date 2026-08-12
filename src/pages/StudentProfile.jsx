import { useEffect, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Camera, CheckCircle2 } from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { FACULTIES, departmentsFor } from "../data/facultyData";
import { fileToCompressedDataUrl } from "../lib/imageUtils";
import UniqueIdBadge from "../components/UniqueIdBadge";

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate"];
const GENDERS = ["Female", "Male"];

export default function StudentProfile() {
  const { user, profile } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoError, setPhotoError] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setPhone(profile.phone || "");
    setFaculty(profile.faculty || "");
    setDepartment(profile.department || "");
    setLevel(profile.level || "");
    setMatricNumber(profile.matricNumber || "");
    setDob(profile.dob || "");
    setGender(profile.gender || "");
    setBio(profile.bio || "");
    setInterests(profile.interests || "");
    setPhotoDataUrl(profile.photoURL || "");
  }, [profile]);

  const departmentOptions = departmentsFor(faculty);

  function handleFacultyChange(value) {
    setFaculty(value);
    setDepartment("");
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch (err) {
      setPhotoError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        faculty,
        department,
        level,
        matricNumber: matricNumber.trim(),
        dob,
        gender,
        bio: bio.trim(),
        interests: interests.trim(),
        photoURL: photoDataUrl || null,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Couldn't save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border-light bg-surface-light px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-teal focus:outline-none";

  if (!profile) {
    return <p className="text-sm text-ink-muted">Loading your profile…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">My Profile</h1>
        <div className="mt-1">
          <UniqueIdBadge uniqueId={profile.uniqueId} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border-light bg-card-light p-6">
        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor="photo-upload"
            className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border-light bg-surface-light text-ink-muted hover:border-teal hover:text-teal"
          >
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <Camera size={22} />
            )}
          </label>
          <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          <span className="text-xs text-ink-muted">Tap to change photo</span>
          {photoError && <span className="text-xs text-status-danger">{photoError}</span>}
        </div>

        {error && (
          <p className="rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </p>
        )}
        {saved && (
          <p className="flex items-center gap-2 rounded-lg border border-teal/30 bg-teal-soft px-3 py-2 text-sm text-teal">
            <CheckCircle2 size={15} /> Profile saved.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Faculty</label>
            <select value={faculty} onChange={(e) => handleFacultyChange(e.target.value)} className={fieldClass}>
              <option value="">Select faculty</option>
              {FACULTIES.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Department</label>
            <select
              value={department}
              disabled={!faculty}
              onChange={(e) => setDepartment(e.target.value)}
              className={`${fieldClass} disabled:opacity-60`}
            >
              <option value="">Select department</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={fieldClass}>
              <option value="">Select level</option>
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Matric number</label>
            <input value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} className={fieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Date of birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={fieldClass}>
              <option value="">Prefer not to say</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder="A short line about yourself…"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Interests / hobbies</label>
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. football, chess, reading"
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}