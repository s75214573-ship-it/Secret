import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginAsGuest();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div id="auth-modal-card" className="w-full max-w-sm bg-gradient-to-b from-gray-900 to-black border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-white relative">
        <button
          id="auth-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 mb-3 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-wide text-amber-400">WINXBET VIP LOGIN</h2>
          <p className="text-xs text-gray-400 mt-1">Join the premier color prediction &amp; lottery club</p>
          <div className="mt-2 inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-300 font-semibold">
            🎁 Sign up reward ₹68 instantly
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-900/40 border border-red-500/50 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            id="google-signin-btn"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition shadow-md disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.13C3.25 21.3 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.27C.46 8.19 0 10.04 0 12s.46 3.81 1.27 5.43l4.01-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.7 1.27 6.57l4.01 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            Sign in with Google
          </button>

          <button
            id="guest-signin-btn"
            onClick={handleGuest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold border border-amber-500/20 transition disabled:opacity-50"
          >
            <UserCheck className="w-5 h-5" />
            Quick Guest Instant Play
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>256-Bit Encrypted &amp; Verified Fair Play</span>
        </div>
      </div>
    </div>
  );
};
