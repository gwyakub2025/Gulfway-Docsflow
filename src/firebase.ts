import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  query,
  orderBy,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { DocumentRecord, AuditLog } from './types/index.js';

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
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Read config from environment or fallback
function getFirebaseConfig(): Record<string, any> | null {
  const env = ((import.meta as any).env as Record<string, string | undefined>) || {};
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
      firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || '(default)',
    };
  }

  // Check window.__FIREBASE_CONFIG__ if injected
  if (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__) {
    return (window as any).__FIREBASE_CONFIG__;
  }

  return null;
}

export function initializeFirebase(): { app: FirebaseApp | null; db: Firestore | null; auth: Auth | null } {
  if (db && auth) {
    return { app, db, auth };
  }

  const config = getFirebaseConfig();
  if (!config) {
    console.info('[Firebase] Configuration not detected yet; local durable persistence active.');
    return { app: null, db: null, auth: null };
  }

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
    console.log('[Firebase] Realtime Firestore initialized successfully for project:', config.projectId);
  } catch (err) {
    console.warn('[Firebase] Initialization notice:', err);
  }

  return { app, db, auth };
}

export function isFirebaseConfigured(): boolean {
  return !!db;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
  };

  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test
export async function testConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Firestore client is offline.');
      return false;
    }
    return true;
  }
}

// Realtime synchronizers
export async function saveDocumentToFirestore(document: DocumentRecord): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;

  const path = 'documents';
  try {
    // Sanitize values for Firestore (avoid undefined)
    const sanitized = JSON.parse(JSON.stringify(document));
    await setDoc(doc(firestoreDb, path, document.id), sanitized, { merge: true });
    console.log(`[Firebase] Document ${document.documentNumber || document.id} synced to Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${document.id}`);
  }
}

export async function deleteDocumentFromFirestore(documentId: string): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;

  const path = 'documents';
  try {
    await deleteDoc(doc(firestoreDb, path, documentId));
    console.log(`[Firebase] Document ${documentId} deleted from Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${documentId}`);
  }
}

export async function saveAuditLogToFirestore(log: AuditLog): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;

  const path = 'auditLogs';
  try {
    const sanitized = JSON.parse(JSON.stringify(log));
    await setDoc(doc(firestoreDb, path, log.id), sanitized);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${path}/${log.id}`);
  }
}

export function subscribeToRealtimeDocuments(onUpdate: (docs: DocumentRecord[]) => void): () => void {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return () => {};

  const path = 'documents';
  try {
    const q = query(collection(firestoreDb, path));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: DocumentRecord[] = [];
        snapshot.forEach((snap) => {
          docs.push(snap.data() as DocumentRecord);
        });
        onUpdate(docs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase] Could not subscribe to real-time documents:', err);
    return () => {};
  }
}
