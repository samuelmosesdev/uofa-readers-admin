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

function makeCandidateId() {
  const yy = String(new Date().getFullYear()).slice(-2);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `UAR-${yy}-${suffix}`;
}

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

function verificationRedirectUrl() {
  return { url: `${window.location.origin}/verify-email` };
}

async function rejectIfSuspended(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists() && snap.data().status === "suspended") {
    await signOut(auth);
    throw { code: "auth/user-disabled" };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        setProfile(null);
        setProfileReady(true);
      } else {
        setProfileReady(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setProfileReady(true);
      },
      () => {
        setProfile(null);
        setProfileReady(true);
      }
    );
    return unsub;
  }, [user]);

  async function signUp(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      name: name || "",
      role: "user",
      status: "active",
      plan: "free",
      subscription: "free",
      selectedCourseIds: [],
      emailVerified: false,
      profileComplete: false,
      uniqueId: null,
      createdAt: serverTimestamp(),
    });
    await sendEmailVerification(cred.user, verificationRedirectUrl());
    return cred.user;
  }

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
    await rejectIfSuspended(cred.user.uid);
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
        status: "active",
        plan: "free",
        subscription: "free",
        selectedCourseIds: [],
        emailVerified: cred.user.emailVerified,
        profileComplete: false,
        uniqueId: null,
        createdAt: serverTimestamp(),
      });
    } else {
      await rejectIfSuspended(cred.user.uid);
    }
    return cred.user;
  }

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
        // Keep existing role (agent/admin); only default to user when creating fresh
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return uniqueId;
  }

  async function logout() {
    await signOut(auth);
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) throw new Error("Not signed in.");
    await sendEmailVerification(auth.currentUser, verificationRedirectUrl());
  }

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
        profileReady,
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