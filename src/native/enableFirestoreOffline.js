/**
 * Call once after Firebase is initialized (e.g. bottom of firebase/config.js):
 *
 *   import { enableFirestoreOffline } from "../native/enableFirestoreOffline";
 *   enableFirestoreOffline();
 *
 * Keeps a local cache so previously loaded data can show offline.
 * Writes queue until the device is back online.
 */
import { enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";
// If you already export `db` from getFirestore(app), persistence must be enabled
// BEFORE other Firestore use. Prefer this pattern in config.js instead:

/**
 * Recommended in src/firebase/config.js:
 *
 * import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
 *
 * export const db = initializeFirestore(app, {
 *   localCache: persistentLocalCache({
 *     tabManager: persistentMultipleTabManager(),
 *   }),
 * });
 *
 * Older API (still works on many SDK builds):
 *   import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
 *   export const db = getFirestore(app);
 *   enableIndexedDbPersistence(db).catch(() => {});
 */

export function enableFirestoreOffline(db) {
  if (!db) return;
  try {
    // Legacy helper — safe no-op if already using persistentLocalCache
    enableIndexedDbPersistence?.(db)?.catch?.(() => {});
  } catch {
    /* multi-tab or unsupported */
  }
}
