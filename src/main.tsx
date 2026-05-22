import './index.css';
import { auth, db, provider, signInWithPopup, onAuthStateChanged, signOut, collection, addDoc, serverTimestamp, doc, getDocFromServer } from './firebase.ts';
import { query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';

import React from 'react';
import { createRoot } from 'react-dom/client';
import TemplatesPage from './components/templates/TemplatesPage';
import PdfFormsPage from '../components/pdf-forms/PdfFormsPage';

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
    // Clear existing static template list
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

// Check if we should mount templates and forms (if the page is already active or whenever it becomes active)
document.addEventListener('DOMContentLoaded', () => {
  // If templates section is part of the initial view logic
  mountTemplates();
  mountForms();
});

// Cache for file history to ensure instant loading
let fileHistoryCache: any[] = [];
let isHistoryLoaded = false;
let unsubscribeHistory: (() => void) | null = null;


// معالجة حالة المستخدم وإنشاء أزرار الدخول أعلى الصفحة
onAuthStateChanged(auth, (user) => {
  (window as any).currentUser = user;
  const authContainer = document.getElementById('auth-container');

  if (user) {
    // Start real-time history listener immediately upon login
    if (unsubscribeHistory) unsubscribeHistory();
    const pathForHistory = 'fileHistory';
    // Simplified query to avoid index requirement - we'll sort in memory
    const q = query(
      collection(db, pathForHistory),
      where('uid', '==', user.uid),
      limit(50)
    );

    unsubscribeHistory = onSnapshot(q, (snapshot) => {
      isHistoryLoaded = true;
      // Sort in memory to avoid index requirement
      fileHistoryCache = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const tA = a.timestamp?.seconds || 0;
          const tB = b.timestamp?.seconds || 0;
          return tB - tA;
        })
        .slice(0, 20); // Keep only top 20 after sort
        
      // Notify UI if it's currently showing the history page
      const historyPage = document.getElementById('page-history');
      if (historyPage && historyPage.classList.contains('active')) {
        if ((window as any).renderHistory) (window as any).renderHistory();
      }
    }, (error) => {
      console.error("History Listener Error:", error);
      // Fallback for UI if listener fails
      const container = document.getElementById('history-list');
      if(container) container.innerHTML = '<div class="loading-state">فشل تحميل السجل. تأكد من إعدادات قاعدة البيانات.</div>';
    });

    if (authContainer) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const themeIcon = savedTheme === 'dark' ? '☀️' : '🌙';
      const standardBtns = `
        <button class="icon-btn" onclick="toggleLang()">🌐 <span id="langBtn">EN</span></button>
        <button class="icon-btn" onclick="toggleTheme()"><span id="themeIcon">${themeIcon}</span></button>
      `;
      authContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:12px; font-weight:bold; color:var(--text);">${user.displayName}</span>
          <button class="icon-btn" style="color:#ef4444; border-color:#ef4444;" onclick="window.customSignOut()">تسجيل الخروج</button>
        </div>
        ${standardBtns}
      `;
    }
  } else {
    // Cleanup on logout
    if (unsubscribeHistory) unsubscribeHistory();
    unsubscribeHistory = null;
    fileHistoryCache = [];
    isHistoryLoaded = false;

    if (authContainer) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const themeIcon = savedTheme === 'dark' ? '☀️' : '🌙';
      const standardBtns = `
        <button class="icon-btn" onclick="toggleLang()">🌐 <span id="langBtn">EN</span></button>
        <button class="icon-btn" onclick="toggleTheme()"><span id="themeIcon">${themeIcon}</span></button>
      `;
      authContainer.innerHTML = `
        <button class="icon-btn" style="color:var(--blue); border-color:var(--blue);" onclick="window.customSignIn()">تسجيل الدخول / Google</button>
        ${standardBtns}
      `;
    }
  }
});

// Exposed helper to get cached history
(window as any).getFileHistoryCache = () => fileHistoryCache;
(window as any).isHistoryLoaded = () => isHistoryLoaded;

// دوال التحكم متاحة للمتصفح
(window as any).customSignIn = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Sign-in error:", error);
    if (error.code === 'auth/internal-error') {
      alert("⚠️ تسجيل الدخول فشل (auth/internal-error).\n\n1. يجب تفعيل تسجيل الدخول بواسطة Google من Firebase Console (Authentication > Sign-in method).\n2. إذا كنت تستخدم التطبيق داخل إطار (iframe)، قم بفتح التطبيق في نافذة جديدة.\n3. تأكد من إعداد النطاقات المصرح بها (Authorized domains) في Firebase.");
    } else {
      alert("⚠️ حدث خطأ أثناء تسجيل الدخول: " + error.message);
    }
  }
};
(window as any).customSignOut = () => signOut(auth);

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
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
  const pathForWrite = 'fileHistory';
  try {
    await addDoc(collection(db, pathForWrite), {
      uid: (window as any).currentUser.uid,
      fileName,
      toolName,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
};

// وظيفة جلب سجل الملفات
(window as any).fetchFileHistory = async () => {
  if (!(window as any).currentUser) return [];
  const pathForList = 'fileHistory';
  try {
    const q = query(
      collection(db, pathForList),
      where('uid', '==', (window as any).currentUser.uid),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    // Return sorted in memory to avoid index requirements
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const tA = a.timestamp?.seconds || 0;
        const tB = b.timestamp?.seconds || 0;
        return tB - tA;
      });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathForList);
  }
};

