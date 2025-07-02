// Document Types
export interface Document {
  id: string;
  title: string;
  content: any; // ProseMirror document
  created_at: Date;
  updated_at: Date;
  owner_id: string;
}

// Variable Types
export interface Variable {
  name: string;
  value: string;
  type: 'text' | 'number' | 'date';
  created_at: Date;
  updated_at: Date;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Lock Types
export interface Lock {
  id: string;
  document_id: string;
  section_id?: string;
  user_id: string;
  type: 'document' | 'section';
  created_at: Date;
  expires_at: Date;
}

// Permission Types
export interface Permission {
  document_id: string;
  section_id?: string;
  user_id: string;
  role: string;
  can_read: boolean;
  can_write: boolean;
  can_suggest: boolean;
}

// Socket Event Types
export interface SocketEvents {
  'join-document': (docId: string) => void;
  'leave-document': (docId: string) => void;
  'document-change': (data: DocumentChangeEvent) => void;
  'document-changed': (data: DocumentChangeEvent) => void;
  'update-variable': (data: VariableUpdateEvent) => void;
  'variable-updated': (data: VariableUpdateEvent) => void;
  'request-lock': (data: LockRequestEvent) => void;
  'lock-granted': (data: LockGrantedEvent) => void;
  'lock-denied': (data: LockDeniedEvent) => void;
}

export interface DocumentChangeEvent {
  docId: string;
  userId: string;
  changes: any[]; // ProseMirror transactions
  version: number;
}

export interface VariableUpdateEvent {
  name: string;
  value: string;
  userId: string;
}

export interface LockRequestEvent {
  documentId: string;
  sectionId?: string;
  userId: string;
  type: 'document' | 'section';
}

export interface LockGrantedEvent {
  lockId: string;
  documentId: string;
  sectionId?: string;
  userId: string;
  expiresAt: Date;
}

export interface LockDeniedEvent {
  documentId: string;
  sectionId?: string;
  reason: string;
} 