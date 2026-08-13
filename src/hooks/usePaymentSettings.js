import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const DEFAULTS = {
  priceLabel: "₦2,500 / semester",
  priceNote: "One-time semester access · cancel anytime by not renewing",
  selarUrl: "",
  remitaUrl: "",
  headline: "Unlock the full campus toolkit",
  subheadline:
    "Pro students practice without limits, open every material, and sit timed exam drills.",
  updatedAt: null,
};

export function usePaymentSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "appSettings", "payments"),
      (snap) => {
        if (snap.exists()) setSettings({ ...DEFAULTS, ...snap.data() });
        else setSettings(DEFAULTS);
        setLoading(false);
      },
      () => {
        setSettings(DEFAULTS);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { settings, loading };
}