import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const SETTINGS_REF = doc(db, "settings", "platform");

export const DEFAULT_SETTINGS = {
  appName: "UofA Readers",
  tagline: "Learn smarter. Read better.",
  supportEmail: "support@uofa.edu",
  timezone: "Africa/Lagos",
  maintenanceMode: false,
  maintenanceMessage: "We're performing scheduled maintenance. Please check back shortly.",

  allowEmailPassword: true,
  allowGoogle: true,
  forceEmailVerification: true,
  requireProfileCompletion: true,
  minPasswordLength: 8,
  defaultRole: "user",
  uniqueIdPrefix: "UAR",

  freeTrialDays: 7,
  gracePeriodDays: 3,
  plans: [
    { id: "free", name: "Free", price: 0, interval: "forever" },
    { id: "monthly", name: "Monthly", price: 2500, interval: "month" },
    { id: "annual", name: "Annual", price: 20000, interval: "year" },
  ],

  modules: {
    readingHub: true,
    cbtBuilder: true,
    agents: true,
    announcements: true,
    payments: true,
  },
  maxUploadMb: 25,
  allowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  adminEmailNotifications: true,
  studentWelcomeEmail: true,
  paymentFailedEmail: true,

  accentColor: "#2fd9a8",
  density: "comfortable",
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      SETTINGS_REF,
      (snap) => {
        if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
        else setSettings(DEFAULT_SETTINGS);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  async function saveSettings(partial) {
    setSaving(true);
    try {
      const next = { ...settings, ...partial, updatedAt: new Date() };
      await setDoc(SETTINGS_REF, next, { merge: true });
      setSettings(next);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }

  return { settings, loading, saving, saveSettings };
}