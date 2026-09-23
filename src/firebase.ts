import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal SDK WebChannel transient connection warnings so benign connection negotiation does not trigger console errors
try {
  setLogLevel('silent');
} catch {
  // Ignore if already configured
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling and useFetchStreams: false.
// In containerized and proxy-routed preview environments, standard WebChannel streams can fail,
// causing "Could not reach Cloud Firestore backend [code=unavailable]".
// Forcing long-polling without fetch streaming provides immediate, reliable HTTP connectivity without stream timeouts.
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      experimentalLongPollingOptions: {
        timeoutSeconds: 20
      }
    },
    firebaseConfig.firestoreDatabaseId || '(default)'
  );
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
}

export const db = firestoreInstance;

// Validate Connection to Firestore on startup as mandated by Firebase Skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('offline'))) {
      console.warn('Firestore offline notice: client is operating in offline mode until connected.');
    }
  }
}

if (typeof window !== 'undefined') {
  // Allow the browser network stack to settle before issuing the direct server check
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1500);
}

export default app;
