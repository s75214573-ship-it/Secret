import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Gift, 
  ArrowRight, 
  Flame, 
  CheckCircle2, 
  UserCheck,
  Award,
  ShieldAlert,
  X,
  KeyRound,
  Check,
  Zap,
  Tag
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import confetti from 'canvas-confetti';
import { BotCaptcha } from './BotCaptcha';
import { WinXbetLogo } from './WinXbetLogo';

export const LoginFirstGateway: React.FC = () => {
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loginAsGuest 
  } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [inactivityNotice, setInactivityNotice] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const isLoggedOut = sessionStorage.getItem('inactivity_logged_out');
      const logoutTime = sessionStorage.getItem('inactivity_logout_time');
      if (isLoggedOut === 'true') {
        return logoutTime 
          ? `Your VIP session was automatically logged out at ${logoutTime} after 15 minutes of inactivity for your account & wallet security.`
          : 'Your VIP session was automatically logged out after 15 minutes of inactivity for your account & wallet security.';
      }
    }
    return null;
  });

  const dismissInactivityNotice = () => {
    sessionStorage.removeItem('inactivity_logged_out');
    sessionStorage.removeItem('inactivity_logout_time');
    setInactivityNotice(null);
  };

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('WINXBETVIP');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Anti-bot Captcha state
  const [captchaInput, setCaptchaInput] = useState('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Auto-detect invitation code from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const inviteCode = urlParams.get('invitationCode') || 
                           urlParams.get('code') || 
                           hashParams.get('invitationCode') || 
                           hashParams.get('code');
        if (inviteCode) {
          setReferralCode(inviteCode.trim().toUpperCase());
          setMode('register');
        }
      } catch (_) {}
    }
  }, []);

  // Submit Handler for Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setError(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address or username.');
      triggerHaptic('error');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
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
      // Support username format as well
      const formattedEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail.toLowerCase()}@winxbet.vip`;
      const res = await loginWithEmail(formattedEmail, password);
      if (!res.success) {
        setError(res.message);
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler for VIP Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    setError(null);
    setSuccessInfo(null);

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
      setError('Passwords do not match. Please re-check.');
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
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      triggerHaptic('medium');
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      triggerHaptic('success');
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    try {
      triggerHaptic('medium');
      setLoading(true);
      setError(null);
      await loginAsGuest();
      triggerHaptic('success');
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      setError(err?.message || 'Guest access failed');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-gateway-container" className="w-full max-w-md mx-auto min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-between p-4 shadow-2xl relative">
      {/* Background Ambience Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3.5 pt-2">
        {/* Top VIP Branding Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="flex items-center justify-center">
            <WinXbetLogo 
              size="lg" 
              showVipBadge={true} 
              showSubtitle={true}
              subtitleText="India's Trusted Color Prediction & Lottery"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900/80 border border-gray-800 rounded-full text-[11px] text-gray-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>Over 1,420,000+ Active Players Today</span>
          </div>
        </div>

        {/* Inactivity Logout Alert (if applicable) */}
        {inactivityNotice && (
          <div 
            id="inactivity-logout-alert"
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/90 via-gray-900 to-amber-950/80 border border-amber-500/50 shadow-lg text-xs text-amber-200 flex items-start gap-3 relative animate-in fade-in duration-200"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-0.5 pr-5">
              <div className="font-black text-amber-300 flex items-center gap-1.5 text-xs">
                <span>Security Auto-Logout</span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 rounded text-[9px] font-bold">15 MINS</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug">
                {inactivityNotice}
              </p>
            </div>
            <button
              id="dismiss-inactivity-notice-btn"
              type="button"
              onClick={dismissInactivityNotice}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Registration ₹68 Bonus Promo Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-rose-600 to-amber-600 rounded-2xl p-3.5 text-white shadow-xl border border-red-500/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Gift className="w-6 h-6 text-amber-200 animate-bounce" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
                <Sparkles className="w-3 h-3" />
                <span>New Member Exclusive</span>
              </div>
              <h3 className="text-base font-black leading-tight tracking-tight">
                Sign Up &amp; Claim <span className="text-amber-300 text-lg underline decoration-amber-300 underline-offset-2">₹68 Bonus</span>
              </h3>
              <p className="text-[11px] text-white/90">
                Instant ₹68 free credit into wallet upon registration.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs: Sign In & Register */}
        <div className="bg-gray-900/90 p-1 rounded-2xl border border-gray-800 flex text-xs font-black gap-1 shadow-md">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('login');
              setError(null);
              setSuccessInfo(null);
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 text-center ${
              mode === 'login'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sign In</span>
          </button>

          <button
            id="tab-register-btn"
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('register');
              setError(null);
              setSuccessInfo(null);
            }}
            className={`flex-1 py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 text-center relative ${
              mode === 'register'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-amber-300" />
            <span className="truncate">Register VIP</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 text-[10px] font-black border border-amber-300/30">
              +₹68
            </span>
          </button>
        </div>

        {/* Feedback Alert Banners */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successInfo && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{successInfo}</span>
            <button onClick={() => setSuccessInfo(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FORM 1: EMAIL SIGN IN */}
        {/* ---------------------------------------------------------------- */}
        {mode === 'login' && (
          <form onSubmit={handleEmailLogin} className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 shadow-xl space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
                Email Address or Username
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="login-email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-300">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-9 pr-9 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Anti-Bot Security Captcha */}
            <BotCaptcha
              idPrefix="pass-login"
              captchaInput={captchaInput}
              onCaptchaInputChange={setCaptchaInput}
              onVerifiedChange={setIsCaptchaVerified}
            />

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-98 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating VIP Account...</span>
              ) : (
                <>
                  <span>Sign In to WinXbet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FORM 2: VIP REGISTRATION */}
        {/* ---------------------------------------------------------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 shadow-xl space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
                Create Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-9 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            {/* Invitation Code */}
            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Invitation Code (Referral)</span>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Unlocks ₹68 Bonus</span>
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="register-referral-input"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter invitation code"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-amber-300 placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono tracking-wider transition"
                />
              </div>
            </div>

            {/* Anti-Bot Security Captcha */}
            <BotCaptcha
              idPrefix="register"
              captchaInput={captchaInput}
              onCaptchaInputChange={setCaptchaInput}
              onVerifiedChange={setIsCaptchaVerified}
            />

            {/* Terms & Age Confirmation */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="register-agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-0 w-3.5 h-3.5"
              />
              <label htmlFor="register-agree-terms" className="text-[10px] text-gray-400 leading-tight">
                I agree to the <span className="text-amber-400 underline">Privacy Policy</span> &amp; confirm I am 18+ years of age.
              </label>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-98 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Setting Up VIP Account...</span>
              ) : (
                <>
                  <span>Create Account &amp; Claim ₹68</span>
                  <Gift className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-gray-800 w-full" />
          <span className="bg-gray-950 px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">
            Quick Instant Access
          </span>
          <div className="border-t border-gray-800 w-full" />
        </div>

        {/* Quick Instant Play Options: Google, Guest (ADMIN BUTTON REMOVED AS REQUESTED) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="login-google-btn"
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition shadow-md disabled:opacity-50"
            title="Sign in with Google"
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
            <span className="truncate">Google Sign-In</span>
          </button>

          <button
            id="login-guest-btn"
            type="button"
            onClick={handleGuestAuth}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-amber-300 font-bold text-xs border border-amber-500/30 transition shadow-md disabled:opacity-50"
            title="Quick Guest Instant Play (+₹68 Bonus)"
          >
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Guest Play (+₹68)</span>
          </button>
        </div>
      </div>

      {/* Security & Provably Fair Footer */}
      <div className="relative z-10 pt-4 pb-2 text-center space-y-2.5">
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Provably Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span>Fast UPI</span>
          </div>
        </div>

        <div className="text-[10px] text-gray-600 font-mono">
          WinXbet Gaming System • Version 3.4.1 (Indol Ten)
        </div>
      </div>
    </div>
  );
};
