import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  resendVerificationEmail: async () => {},
  refreshEmailVerified: async () => false,
  completeProfile: async () => {},
  logout: async () => {},
});

// UAR-<2-digit year>-<4 random digits>, e.g. "UAR-26-8831"
function makeCandidateId() {
  const yy = String(new Date().getFullYear()).slice(-2);
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `UAR-${yy}-${suffix}`;
}

// Generates a uniqueId and reserves it in the public `idLookup` collection
// (used to resolve a Unique ID -> email at login time, before the user is
// authenticated). Retries a few times in the unlikely event of a collision.
async function generateUniqueId(uid, email) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = makeCandidateId();
    const lookupRef = doc(db, "idLookup", candidate);
    const existing = await getDoc(lookupRef);
    if (!existing.exists()) {
      await setDoc(lookupRef, { uid, email, createdAt: serverTimestamp() });
      return candidate;
    }
  }
  throw new Error("Could not generate a unique ID. Please try again.");
}

// Where Firebase's hosted verification page sends the user back to after
// they click the link in their email.
function verificationRedirectUrl() {
  return { url: `${window.location.origin}/verify-email` };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsub;
  }, [user]);

  async function signUp(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      name: name || "",
      role: "user", // default role for anyone signing up normally
      emailVerified: false,
      profileComplete: false,
      uniqueId: null,
      createdAt: serverTimestamp(),
    });
    await sendEmailVerification(cred.user, verificationRedirectUrl());
    return cred.user;
  }

  // Accepts either an email address or a previously-generated Unique ID.
  async function signInWithEmail(identifier, password) {
    let email = identifier.trim();

    if (!email.includes("@")) {
      const lookupRef = doc(db, "idLookup", email.toUpperCase());
      const lookupSnap = await getDoc(lookupRef);
      if (!lookupSnap.exists()) {
        throw { code: "auth/user-not-found" };
      }
      email = lookupSnap.data().email;
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signInWithGoogle() {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const ref = doc(db, "users", cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: cred.user.email,
        name: cred.user.displayName || "",
        role: "user",
        // Google already verifies the underlying email address, so there's
        // no need to make them go through the OTP step too.
        emailVerified: cred.user.emailVerified,
        profileComplete: false,
        uniqueId: null,
        createdAt: serverTimestamp(),
      });
    }
    return cred.user;
  }

  // Called from the "Complete your profile" page shown right after signup.
  // Writes faculty/department/level (+ any extra fields), generates the
  // Unique ID, and marks the profile complete.
  async function completeProfile(details) {
    if (!auth.currentUser) throw new Error("Not signed in.");
    const uid = auth.currentUser.uid;
    const email = auth.currentUser.email;

    const uniqueId = await generateUniqueId(uid, email);

    await setDoc(
      doc(db, "users", uid),
      {
        ...details,
        uniqueId,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return uniqueId;
  }

  async function logout() {
    await signOut(auth);
  }

  // Re-sends the Firebase verification link (e.g. if the first email got lost).
  async function resendVerificationEmail() {
    if (!auth.currentUser) throw new Error("Not signed in.");
    await sendEmailVerification(auth.currentUser, verificationRedirectUrl());
  }

  // Firebase only updates `user.emailVerified` locally after a manual reload —
  // it doesn't push the change automatically once the link is clicked. Call
  // this (e.g. on a poll or a "I've verified" button) to check + sync it.
  async function refreshEmailVerified() {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    if (verified) {
      await setDoc(doc(db, "users", auth.currentUser.uid), { emailVerified: true }, { merge: true });
    }
    return verified;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signInWithEmail,
        signInWithGoogle,
        completeProfile,
        resendVerificationEmail,
        refreshEmailVerified,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}