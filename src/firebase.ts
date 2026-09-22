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
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import {
  Company,
  Department,
  User,
  Role,
  NumberingRule,
  FormTemplate,
  DocumentRecord,
  AuditLog,
} from './types/index.js';
import firebaseAppletConfig from '../firebase-applet-config.json';

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

// Read config from firebase-applet-config.json, environment, or window
function getFirebaseConfig(): Record<string, any> | null {
  if (firebaseAppletConfig && (firebaseAppletConfig as any).apiKey && (firebaseAppletConfig as any).projectId) {
    const cfg = firebaseAppletConfig as any;
    return {
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain || `${cfg.projectId}.firebaseapp.com`,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket || `${cfg.projectId}.appspot.com`,
      messagingSenderId: cfg.messagingSenderId || '',
      appId: cfg.appId || '',
      firestoreDatabaseId: cfg.firestoreDatabaseId || '(default)',
    };
  }

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
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((authErr) => {
        console.warn('[Firebase] Anonymous authentication notice:', authErr);
      });
    }
    console.log('[Firebase] Realtime Firestore connected to project:', config.projectId, 'database:', config.firestoreDatabaseId);
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

export async function getDocumentsFromFirestore(): Promise<DocumentRecord[]> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return [];
  try {
    const snap = await getDocs(collection(firestoreDb, 'documents'));
    const docs: DocumentRecord[] = [];
    snap.forEach((d) => {
      docs.push(d.data() as DocumentRecord);
    });
    return docs;
  } catch (err) {
    console.warn('[Firebase] Could not fetch documents from Firestore:', err);
    return [];
  }
}

// COMPANIES FIRESTORE
export async function saveCompanyToFirestore(company: Company): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'companies';
  try {
    const sanitized = JSON.parse(JSON.stringify(company));
    await setDoc(doc(firestoreDb, path, company.id), sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${company.id}`);
  }
}

export async function deleteCompanyFromFirestore(companyId: string): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'companies';
  try {
    await deleteDoc(doc(firestoreDb, path, companyId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${companyId}`);
  }
}

export async function getCompaniesFromFirestore(): Promise<Company[]> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return [];
  try {
    const snap = await getDocs(collection(firestoreDb, 'companies'));
    const comps: Company[] = [];
    snap.forEach((d) => comps.push(d.data() as Company));
    return comps;
  } catch (err) {
    console.warn('[Firebase] Could not fetch companies from Firestore:', err);
    return [];
  }
}

// DEPARTMENTS FIRESTORE
export async function saveDepartmentToFirestore(dept: Department): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'departments';
  try {
    const sanitized = JSON.parse(JSON.stringify(dept));
    await setDoc(doc(firestoreDb, path, dept.id), sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${dept.id}`);
  }
}

export async function deleteDepartmentFromFirestore(deptId: string): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'departments';
  try {
    await deleteDoc(doc(firestoreDb, path, deptId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${deptId}`);
  }
}

export async function getDepartmentsFromFirestore(): Promise<Department[]> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return [];
  try {
    const snap = await getDocs(collection(firestoreDb, 'departments'));
    const depts: Department[] = [];
    snap.forEach((d) => depts.push(d.data() as Department));
    return depts;
  } catch (err) {
    console.warn('[Firebase] Could not fetch departments from Firestore:', err);
    return [];
  }
}

// ROLES FIRESTORE
export async function saveRoleToFirestore(role: Role): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'roles';
  try {
    const sanitized = JSON.parse(JSON.stringify(role));
    await setDoc(doc(firestoreDb, path, role.id), sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${role.id}`);
  }
}

export async function deleteRoleFromFirestore(roleId: string): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'roles';
  try {
    await deleteDoc(doc(firestoreDb, path, roleId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${roleId}`);
  }
}

export async function getRolesFromFirestore(): Promise<Role[]> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return [];
  try {
    const snap = await getDocs(collection(firestoreDb, 'roles'));
    const roles: Role[] = [];
    snap.forEach((d) => roles.push(d.data() as Role));
    return roles;
  } catch (err) {
    console.warn('[Firebase] Could not fetch roles from Firestore:', err);
    return [];
  }
}

// USERS FIRESTORE
export async function saveUserToFirestore(user: User): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'users';
  try {
    const sanitized = JSON.parse(JSON.stringify(user));
    await setDoc(doc(firestoreDb, path, user.id), sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${user.id}`);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'users';
  try {
    await deleteDoc(doc(firestoreDb, path, userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${userId}`);
  }
}

export async function getUsersFromFirestore(): Promise<User[]> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return [];
  try {
    const snap = await getDocs(collection(firestoreDb, 'users'));
    const users: User[] = [];
    snap.forEach((d) => users.push(d.data() as User));
    return users;
  } catch (err) {
    console.warn('[Firebase] Could not fetch users from Firestore:', err);
    return [];
  }
}

// NUMBERING RULES FIRESTORE
export async function saveNumberingRuleToFirestore(rule: NumberingRule): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'numberingRules';
  try {
    const sanitized = JSON.parse(JSON.stringify(rule));
    await setDoc(doc(firestoreDb, path, rule.id), sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${rule.id}`);
  }
}

export async function getNumberingRulesFromFirestore(): Promise<NumberingRule[]> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return [];
  try {
    const snap = await getDocs(collection(firestoreDb, 'numberingRules'));
    const rules: NumberingRule[] = [];
    snap.forEach((d) => rules.push(d.data() as NumberingRule));
    return rules;
  } catch (err) {
    console.warn('[Firebase] Could not fetch numbering rules from Firestore:', err);
    return [];
  }
}

// FORM TEMPLATES FIRESTORE
export async function saveFormTemplateToFirestore(tpl: FormTemplate): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'formTemplates';
  try {
    const sanitized = JSON.parse(JSON.stringify(tpl));
    await setDoc(doc(firestoreDb, path, tpl.id), sanitized, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${tpl.id}`);
  }
}

export async function deleteFormTemplateFromFirestore(tplId: string): Promise<void> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return;
  const path = 'formTemplates';
  try {
    await deleteDoc(doc(firestoreDb, path, tplId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${tplId}`);
  }
}

export async function getFormTemplatesFromFirestore(): Promise<FormTemplate[]> {
  const { db: firestoreDb } = initializeFirebase();
  if (!firestoreDb) return [];
  try {
    const snap = await getDocs(collection(firestoreDb, 'formTemplates'));
    const templates: FormTemplate[] = [];
    snap.forEach((d) => templates.push(d.data() as FormTemplate));
    return templates;
  } catch (err) {
    console.warn('[Firebase] Could not fetch form templates from Firestore:', err);
    return [];
  }
}

