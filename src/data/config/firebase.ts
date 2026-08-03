import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  // @ts-ignore - Expo/React Native bundler exports getReactNativePersistence
  getReactNativePersistence,
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
// @ts-ignore - AsyncStorage module type resolution in IDE editor context
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Environment Detection ──────────────────────────────────────────────────────
// Determines which Firebase project the app connects to.
// Values: 'production' | 'test' | 'backup'
const APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV || 'test') as
  | 'production'
  | 'test'
  | 'backup';

// Access environment variables securely from process.env (Expo loads .env / EXPO_PUBLIC_ variables)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bovix-demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'bovix-demo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bovix-demo.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:demo',
};

// ── Environment Startup Log ────────────────────────────────────────────────────
// Logs which Firestore database the app is connected to on init.
const ENV_LABELS: Record<string, string> = {
  production: '🟢 PRODUCTION',
  test: '🟡 TEST / DEV',
  backup: '🔵 BACKUP',
};
console.log(
  `[Bovix DB] Connected to Firestore: ${firebaseConfig.projectId} (${ENV_LABELS[APP_ENV] || APP_ENV})`
);

// ── Production Write Guard ─────────────────────────────────────────────────────
// Safety net: if the app is built as a test build but accidentally points to
// production credentials, this will warn on startup. The guard does NOT block
// writes (repositories are unchanged) — it only raises visibility.
if (APP_ENV === 'production' && __DEV__) {
  console.warn(
    '[Bovix DB] ⚠️  WARNING: Running in __DEV__ mode against PRODUCTION database!\n' +
      'This is likely a misconfiguration. Switch to .env.test for local development.'
  );
}

if (APP_ENV === 'backup') {
  console.warn(
    '[Bovix DB] ⚠️  WARNING: App is connected to the BACKUP database.\n' +
      'The backup project should only be accessed by admin scripts, not the client app.'
  );
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with React Native persistence via AsyncStorage
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

// Initialize Firestore
const db: Firestore = getFirestore(app);

export { app, auth, db, firebaseConfig, APP_ENV };
