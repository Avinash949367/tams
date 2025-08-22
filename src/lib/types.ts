export interface Venue {
  id: string;
  name: string;
  currentRoundId?: string;
  cooldownUntil?: number;
  gameEnded?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Question {
  id: string;
  text: string;
  options?: string[]; // Up to 4 options
  answer?: string;
  points?: number;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  id: string;
  name: string;
  venueId: string;
  currency: number;
  isDisqualified: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Round {
  id: string;
  venueId: string;
  state: 'waiting' | 'rolling' | 'answering' | 'evaluating' | 'completed';
  dice?: number;
  questionId?: string;
  answerEndsAt?: number;
  rollStartedAt?: number;
  evaluateEndsAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Answer {
  id: string;
  roundId: string;
  teamId: string;
  content: string;
  selectedOptionIndex?: number;
  reason?: string;
  isAutoSubmitted: boolean;
  score?: number;
  feedback?: string;
  submittedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  teamId: string;
  teamName: string;
  venueId: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface RealtimeDoc {
  col: string;
  id: string;
}

export interface RealtimeCallback<T = unknown> {
  (data: T | null): void | (() => void);
}

export interface RealtimeOptions {
  includeMetadataChanges?: boolean;
}

export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

export interface AuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isAnonymous: boolean;
}

export interface DatabaseError {
  code: string;
  message: string;
  name: string;
}

export interface QuerySnapshot<T = unknown> {
  docs: Array<{
    id: string;
    data(): T;
    exists(): boolean;
  }>;
  empty: boolean;
  size: number;
}

export interface DocumentSnapshot<T = unknown> {
  id: string;
  data(): T | undefined;
  exists(): boolean;
  metadata: {
    hasPendingWrites: boolean;
    fromCache: boolean;
  };
}

export interface DocumentReference<T = unknown> {
  id: string;
  path: string;
  parent: CollectionReference<T>;
  collection(path: string): CollectionReference;
  get(): Promise<DocumentSnapshot<T>>;
  set(data: T): Promise<void>;
  update(data: Partial<T>): Promise<void>;
  delete(): Promise<void>;
}

export interface CollectionReference<T = unknown> {
  id: string;
  path: string;
  parent: DocumentReference | null;
  doc(id?: string): DocumentReference<T>;
  add(data: T): Promise<DocumentReference<T>>;
  get(): Promise<QuerySnapshot<T>>;
}

export interface Firestore {
  collection(path: string): CollectionReference;
  doc(path: string): DocumentReference;
  batch(): WriteBatch;
  runTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T>;
}

export interface WriteBatch {
  set(ref: DocumentReference, data: unknown): WriteBatch;
  update(ref: DocumentReference, data: unknown): WriteBatch;
  delete(ref: DocumentReference): WriteBatch;
  commit(): Promise<void>;
}

export interface Transaction {
  get(ref: DocumentReference): Promise<DocumentSnapshot>;
  set(ref: DocumentReference, data: unknown): Transaction;
  update(ref: DocumentReference, data: unknown): Transaction;
  delete(ref: DocumentReference): Transaction;
}

export interface Auth {
  currentUser: AuthUser | null;
  signInAnonymously(): Promise<{ user: AuthUser }>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}

export interface App {
  name: string;
  options: Record<string, unknown>;
}

export interface Firebase {
  app(name?: string): App;
  auth(app?: App): Auth;
  firestore(app?: App): Firestore;
  initializeApp(config: FirebaseConfig, name?: string): App;
}


