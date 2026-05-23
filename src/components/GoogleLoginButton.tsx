import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';

export const GoogleLoginButton: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch google client id from server config
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.googleClientId) {
          setClientId(data.googleClientId);
        } else {
          console.warn("Google Client ID is missing.");
        }
      })
      .catch((err) => console.error("Failed to load Google Config", err));
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'GOOGLE_IMPLICIT_SUCCESS' && event.data?.idToken) {
        setLoading(true);
        setError(null);
        try {
          const idToken = event.data.idToken;

          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential: idToken }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            login(data.user);
          } else {
            setError(data.error || 'فشل تسجيل الدخول من الخادم.');
          }
        } catch (err: any) {
          setError('حدث خطأ أثناء الاتصال بالخادم لإتمام تسجيل الدخول: ' + err.message);
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login]);

  const handleGoogleLogin = () => {
    if (!clientId) {
      setError('جاري تحميل تهيئة Google... الرجاء الانتظار.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const redirectUri = `${window.location.origin}/auth-callback.html`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=id_token&scope=openid%20profile%20email&nonce=implicit_${Date.now()}`;

      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'google_auth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        setLoading(false);
        setError('تم حظر النافذة المنبثقة من المتصفح. يرجى السماح بالنوافذ المنبثقة.');
        return;
      }

      // Check if popup closed by user periodically
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setLoading(false);
        }
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setError('فشل في فتح نافذة تسجيل الدخول: ' + err.message);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        login(data.user);
      } else {
        setError('فشل تسجيل الدخول التجريبي.');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم لتسجيل الدخول التجريبي.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentRedirectUri = `${window.location.origin}/auth-callback.html`;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {loading ? (
          <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold py-2 px-4 border border-blue-100 rounded-md bg-blue-50/50">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>جاري التحقق...</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 shadow-sm transition-all duration-200 cursor-pointer text-gray-700 hover:text-gray-900 font-medium"
              style={{ height: '38px' }}
            >
              {/* Beautiful color-matching SVG Google Logo */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm font-semibold whitespace-nowrap">تسجيل الدخول بـ Google</span>
            </button>

            <button
              onClick={handleDemoLogin}
              className="flex items-center gap-2 px-4 py-2 border border-blue-200 rounded-md bg-blue-50/50 hover:bg-blue-50 text-blue-700 hover:text-blue-800 shadow-sm transition-all duration-200 cursor-pointer font-medium text-xs md:text-sm"
              style={{ height: '38px' }}
              title="لتجربة جميع الميزات فوراً دون تهيئة Google Console"
            >
              🔑 تسجيل تجريبي سريع (تخطي)
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded border border-red-100 max-w-sm text-center font-medium">
          {error}
        </div>
      )}

      {/* Exquisite design instructions for fixing redirect_uri_mismatch */}
      <div 
        className="text-right p-3.5 bg-slate-50 border border-slate-200 rounded-xl max-w-md w-full"
        style={{ direction: 'rtl', fontSize: '12px', lineHeight: '1.6' }}
      >
        <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
          <span>🛠️ حل مشكلة <b>رابط إعادة التوجيه (redirect_uri_mismatch)</b>:</span>
        </div>
        <p className="text-slate-500 mb-2.5">
          يتطلب تسجيل الدخول عبر Google إضافة رابط هذا التطبيق التجريبي في لوحة المطورين الخاصة بك:
        </p>
        <div className="space-y-2">
          <div>
            <span className="block text-slate-400 font-semibold mb-1">الرابط المطلوب إضافته (الموقع الحالي):</span>
            <div className="flex items-center gap-1 bg-white p-2 rounded border border-slate-200 select-all font-mono text-[11px] text-blue-600 break-all">
              {currentRedirectUri}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            📍 انسخ الرابط أعلاه وضعه في <b>Authorized redirect URIs</b> في <b>Google Cloud Console</b> لحل التعليق فورا.
          </p>
        </div>
      </div>
    </div>
  );
};

