import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import fallbackConfig from '../../firebase-applet-config.json';
import { AuditLog } from '../types';

// Dynamic App URL resolution for Local, Preview (*.vercel.app), and Production
export const getAppUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  return import.meta.env.VITE_APP_URL || 'https://integritas360.vercel.app';
};

// Flexible config resolution supporting Vercel env variables and AI Studio applet config
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  firestoreDatabaseId: fallbackConfig.firestoreDatabaseId || '(default)',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const OWNER_EMAIL = 'susidewiyuliyanti@gmail.com';
export const OWNER_EMAILS = [
  'susidewiyuliyanti@gmail.com',
  'molitravel.purwakarta@gmail.com'
];

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return OWNER_EMAILS.some((e) => e.toLowerCase() === email.toLowerCase());
};

// ==========================================
// REAL FIREBASE AUTH PROVISIONING (SECONDARY APP)
// Allows Owner / Admin to create actual Auth accounts without logging out
// ==========================================
export const getSecondaryAuth = () => {
  const existing = getApps().find((a) => a.name === 'SecondaryAuthProvisioner');
  const secondaryApp = existing || initializeApp(firebaseConfig, 'SecondaryAuthProvisioner');
  return getAuth(secondaryApp);
};

export const createFirebaseAuthUser = async (email: string, password: string): Promise<string> => {
  const secAuth = getSecondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(secAuth, email.trim(), password);
    const uid = cred.user.uid;
    // Sign out secondary auth instance immediately to keep it pristine
    await signOut(secAuth);
    return uid;
  } catch (err: any) {
    await signOut(secAuth);
    if (err.code === 'auth/email-already-in-use') {
      // Email is already in Auth - generate a deterministic UID reference if needed or throw clear error
      console.warn('Firebase Auth user already exists for:', email);
      throw new Error(`Email "${email}" sudah terdaftar di sistem.`);
    }
    throw err;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

// ==========================================
// AUDIT LOGGING HELPER
// Records all critical actions to Firestore `audit_logs` collection
// ==========================================
export const logAuditEvent = async (event: Omit<AuditLog, 'audit_log_id' | 'timestamp'>) => {
  try {
    const audit_log_id = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await addDoc(collection(db, 'audit_logs'), {
      ...event,
      audit_log_id,
      timestamp: serverTimestamp(),
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to record audit log:', err);
  }
};

// ==========================================
// TENANT ID GENERATOR (e.g. CMP-000001)
// ==========================================
export const generateCompanyId = async (): Promise<string> => {
  try {
    const snap = await getDocs(collection(db, 'companies'));
    const nextNum = snap.size + 1;
    const formattedNum = String(nextNum).padStart(6, '0');
    return `CMP-${formattedNum}`;
  } catch (err) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `CMP-${randomSuffix}`;
  }
};

// Error handling helper as per skill requirements
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

