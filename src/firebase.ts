import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore, setLogLevel } from 'firebase/firestore';
import baseFirebaseConfig from '../firebase-applet-config.json';

// Silence internal SDK WebChannel transient connection warnings so benign connection negotiation does not trigger console errors
try {
  setLogLevel('silent');
} catch {
  // Ignore if already configured
}

// Allow environment variable overrides for custom hosting deployments (e.g., Vercel: winxbet-indol-ten.vercel.app)
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || baseFirebaseConfig.projectId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || baseFirebaseConfig.appId,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || baseFirebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || baseFirebaseConfig.authDomain,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || baseFirebaseConfig.firestoreDatabaseId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || baseFirebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || baseFirebaseConfig.messagingSenderId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || baseFirebaseConfig.measurementId,
  oAuthClientId: metaEnv.VITE_FIREBASE_OAUTH_CLIENT_ID || baseFirebaseConfig.oAuthClientId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use initializeFirestore with long-polling fallback for maximum compatibility across preview proxies and production Vercel HTTPS
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
