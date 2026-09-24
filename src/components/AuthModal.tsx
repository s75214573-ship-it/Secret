import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Check, 
  X, 
  Zap, 
  Gift,
  Tag
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { BotCaptcha } from './BotCaptcha';
import { WinXbetLogo } from './WinXbetLogo';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  defaultTab = 'login'
}) => {
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loginAsGuest 
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('WINXBETVIP');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Anti-bot captcha
  const [captchaInput, setCaptchaInput] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      triggerHaptic('error');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      triggerHaptic('error');
      return;
    }

    if (!isCaptchaVerified) {
      setError('Please complete the Anti-Bot Security Captcha.');
      triggerHaptic('error');
      return;
    }

    try {
      setLoading(true);
      const formattedEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail.toLowerCase()}@winxbet.vip`;
      const res = await loginWithEmail(formattedEmail, password);
      if (!res.success) {
        setError(res.message);
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      triggerHaptic('error');
      return;
    }

    if (!isCaptchaVerified) {
      setError('Please complete the Anti-Bot Security Captcha.');
      triggerHaptic('error');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerHaptic('error');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      triggerHaptic('error');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the User Agreement and confirm 18+ declaration.');
      triggerHaptic('error');
      return;
    }

    try {
      setLoading(true);
      const res = await registerWithEmail(cleanEmail, password, referralCode);
      if (!res.success) {
        setError(res.message);
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
        confetti({ particleCount: 80, spread: 60 });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      triggerHaptic('medium');
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    try {
      triggerHaptic('medium');
      setLoading(true);
      setError(null);
      await loginAsGuest();
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Guest login failed.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="auth-modal-card"
        className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4 relative"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-xl bg-gray-800/80 hover:bg-gray-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between pr-8">
          <WinXbetLogo 
            size="sm" 
            showVipBadge={true} 
            showSubtitle={true} 
            subtitleText="Color Prediction & Real-Time Lottery" 
          />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-950 border border-gray-800 rounded-2xl text-xs font-black">
          <button
            onClick={() => {
              triggerHaptic('light');
              setTab('login');
              setError(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setTab('register');
              setError(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Register</span>
            <span className="px-1 py-0.2 rounded bg-black/40 text-amber-300 text-[9px] font-bold">
              +₹68
            </span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span className="flex-1 text-[11px]">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* FORM 1: Sign In */}
        {tab === 'login' && (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1 block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-8 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1 block">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-8 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Anti-Bot Captcha */}
            <BotCaptcha
              idPrefix="modal-login"
              captchaInput={captchaInput}
              onCaptchaInputChange={setCaptchaInput}
              onVerifiedChange={setIsCaptchaVerified}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* FORM 2: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1 block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-8 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1 block">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-8 pr-8 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1 block">Confirm Password</label>
              <div className="relative flex items-center">
                <KeyRound className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-8 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1 flex items-center justify-between">
                <span>Invitation Code</span>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Bonus ₹68</span>
                </span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Invitation code"
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-amber-300 font-mono tracking-wider focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Anti-Bot Captcha */}
            <BotCaptcha
              idPrefix="modal-register"
              captchaInput={captchaInput}
              onCaptchaInputChange={setCaptchaInput}
              onVerifiedChange={setIsCaptchaVerified}
            />

            <div className="flex items-start gap-2 pt-0.5">
              <input
                id="modal-terms-checkbox"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 bg-gray-950 border-gray-800 w-3.5 h-3.5"
              />
              <label htmlFor="modal-terms-checkbox" className="text-[10px] text-gray-400">
                I am 18+ and accept the WinXbet VIP Terms &amp; Policy.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register & Claim ₹68 Bonus'}
            </button>
          </form>
        )}

        {/* Quick 1-Click Alternate Logins */}
        <div className="pt-2 border-t border-gray-800/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              id="google-signin-btn"
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition shadow-md disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Google</span>
            </button>

            <button
              id="guest-signin-btn"
              onClick={handleGuest}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-950 hover:bg-gray-800 text-amber-300 font-bold text-xs border border-amber-500/20 transition disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Guest Play</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-500 text-[10px] pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit Encrypted &amp; Anti-Bot Verified</span>
        </div>
      </div>
    </div>
  );
};
