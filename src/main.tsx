import './index.css';
import { db, collection, addDoc, serverTimestamp, doc, getDocFromServer, auth, onAuthStateChanged } from './firebase.ts';
import { query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';

import React from 'react';
import { createRoot } from 'react-dom/client';
import TemplatesPage from './components/templates/TemplatesPage';
import PdfFormsPage from '../components/pdf-forms/PdfFormsPage';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { GoogleAuthWrapper } from './components/GoogleAuthWrapper';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { UserProfile } from './components/UserProfile';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Mounting the new Templates system
const mountTemplates = () => {
  const container = document.getElementById('page-templates');
  if (container) {
    container.innerHTML = '<div id="react-templates-root"></div>';
    const root = createRoot(document.getElementById('react-templates-root')!);
    root.render(<TemplatesPage />);
  }
};

// Mounting the PDF Forms feature
const mountForms = () => {
  const container = document.getElementById('page-forms');
  if (container) {
    const reactRootElement = document.getElementById('react-forms-root');
    if (reactRootElement) {
      const root = createRoot(reactRootElement);
      root.render(<PdfFormsPage />);
    }
  }
};

const AuthComponent = () => {
  const { user, isLoading } = useAuth();
  const savedTheme = localStorage.getItem('theme') || 'light';
  const themeIcon = savedTheme === 'dark' ? '☀️' : '🌙';

  // Synchronize user to window so existing functions like saveFileHistory work
  React.useEffect(() => {
    (window as any).currentUser = user ? { uid: user.id, email: user.email, displayName: user.name } : null;
    if (user && (window as any).triggerHistoryListener) {
      (window as any).triggerHistoryListener();
    }
  }, [user]);

  return (
    <div className="flex items-center gap-4">
      {isLoading ? (
        <span className="text-sm text-gray-500">جاري التحقق...</span>
      ) : user ? (
        <UserProfile />
      ) : (
        <GoogleLoginButton />
      )}
      <button className="icon-btn" onClick={() => (window as any).toggleLang()}>
        🌐 <span id="langBtn">EN</span>
      </button>
      <button className="icon-btn" onClick={() => (window as any).toggleTheme()}>
        <span id="themeIcon">{themeIcon}</span>
      </button>
    </div>
  );
};

const mountAuth = () => {
  const authContainer = document.getElementById('auth-container');
  if (authContainer) {
    const root = createRoot(authContainer);
    root.render(
      <GoogleAuthWrapper>
        <AuthProvider>
          <AuthComponent />
        </AuthProvider>
      </GoogleAuthWrapper>
    );
  }
};

const init = () => {
  mountTemplates();
  mountForms();
  mountAuth();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cache for file history to ensure instant loading
let fileHistoryCache: any[] = [];
let isHistoryLoaded = false;
let unsubscribeHistory: (() => void) | null = null;


// We manage file history logic outside of Firebase's onAuthStateChanged
async function initializeHistoryListener() {
  const user = (window as any).currentUser;
  if (!user) {
    fileHistoryCache = [];
    isHistoryLoaded = false;
    const historyPage = document.getElementById('page-history');
    if (historyPage && historyPage.classList.contains('active')) {
      if ((window as any).renderHistory) (window as any).renderHistory();
    }
    return;
  }

  try {
    const res = await fetch('/api/history');
    if (res.ok) {
      const data = await res.json();
      fileHistoryCache = data.history || [];
      isHistoryLoaded = true;
      const historyPage = document.getElementById('page-history');
      if (historyPage && historyPage.classList.contains('active')) {
        if ((window as any).renderHistory) (window as any).renderHistory();
      }
    } else {
      console.error("Failed to load history from server");
    }
  } catch (error) {
    console.error("Error loading history from server:", error);
    const container = document.getElementById('history-list');
    if (container) container.innerHTML = '<div class="loading-state">فشل تحميل السجل. تأكد من إعدادات قاعدة البيانات.</div>';
  }
}
// We export a trigger instead
(window as any).triggerHistoryListener = initializeHistoryListener;

// Exposed helper to get cached history
(window as any).getFileHistoryCache = () => fileHistoryCache;
(window as any).isHistoryLoaded = () => isHistoryLoaded;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = (window as any).currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: null,
      isAnonymous: false,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// وظيفة حفظ سجل الملفات (File History)
(window as any).saveFileHistory = async (fileName: string, toolName: string) => {
  if (!(window as any).currentUser) return;
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, toolName })
    });
    if (res.ok) {
      await initializeHistoryListener();
    }
  } catch (error) {
    console.error("Error saving file history:", error);
  }
};

// وظيفة جلب سجل الملفات
(window as any).fetchFileHistory = async () => {
  if (!(window as any).currentUser) return [];
  try {
    const res = await fetch('/api/history');
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching file history:", error);
    return [];
  }
};

