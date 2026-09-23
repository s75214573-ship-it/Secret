import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Sparkles, 
  Phone, 
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
  X
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import confetti from 'canvas-confetti';

export const LoginFirstGateway: React.FC = () => {
  const { loginWithPhone, registerWithPhone, loginWithGoogle, loginAsGuest } = useAuth();

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

  const [mode, setMode] = useState<'register' | 'login'>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('inactivity_logged_out') === 'true') {
      return 'login';
    }
    return 'register';
  });

  const dismissInactivityNotice = () => {
    sessionStorage.removeItem('inactivity_logged_out');
    sessionStorage.removeItem('inactivity_logout_time');
    setInactivityNotice(null);
  };
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('WINXBETVIP');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      triggerHaptic('error');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      triggerHaptic('error');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      triggerHaptic('error');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the User Agreement to continue');
      triggerHaptic('error');
      return;
    }

    try {
      setLoading(true);
      const res = await registerWithPhone(cleanPhone, password, referralCode);
      if (!res.success) {
        setError(res.message);
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
        confetti({ particleCount: 90, spread: 70 });
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter your 10-digit registered mobile number');
      triggerHaptic('error');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      triggerHaptic('error');
      return;
    }

    try {
      setLoading(true);
      const res = await loginWithPhone(cleanPhone, password);
      if (!res.success) {
        setError(res.message);
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
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
      {/* Background Ambience Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4 pt-2">
        {/* Top Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-xl tracking-tighter shadow-lg shadow-red-600/30">
              WX
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-white tracking-wider flex items-center gap-1.5 leading-none">
                <span>WinXbet</span>
                <span className="text-amber-400 text-xs px-2 py-0.5 bg-amber-400/10 rounded-md border border-amber-400/30 font-extrabold">
                  VIP
                </span>
              </div>
              <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                India's Trusted Color Prediction &amp; Lottery
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900/80 border border-gray-800 rounded-full text-[11px] text-gray-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>Over 1,280,000+ Active Players Today</span>
          </div>
        </div>

        {/* Security Inactivity Logout Notice Banner */}
        {inactivityNotice && (
          <div 
            id="inactivity-logout-alert"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-gray-900 to-amber-950/80 border border-amber-500/50 shadow-lg text-xs text-amber-200 flex items-start gap-3 relative animate-in fade-in duration-200"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-0.5 pr-5">
              <div className="font-black text-amber-300 flex items-center gap-1.5 text-xs">
                <span>Security Auto-Logout Triggered</span>
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
              title="Dismiss Notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Highlighted Registration ₹68 Bonus Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-rose-600 to-amber-600 rounded-2xl p-4 text-white shadow-xl border border-red-500/30">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Gift className="w-7 h-7 text-amber-200 animate-bounce" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-200">
                <Sparkles className="w-3 h-3" />
                <span>New Member Exclusive</span>
              </div>
              <h3 className="text-lg font-black leading-tight tracking-tight">
                Register &amp; Claim <span className="text-amber-300 text-xl underline decoration-amber-300 underline-offset-2">₹68 Bonus</span>
              </h3>
              <p className="text-[11px] text-white/90">
                Instant ₹68 credited to your wallet balance. Play Win Go &amp; Aviator now!
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector: Register vs Login */}
        <div className="bg-gray-900 p-1 rounded-2xl border border-gray-800 flex text-xs font-black">
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Register Account</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-amber-300 text-[10px] font-bold border border-amber-300/30">
              +₹68
            </span>
          </button>
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Member Login</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Forms */}
        {mode === 'register' ? (
          <form onSubmit={handleRegister} className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 shadow-xl space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
                Mobile Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-gray-400 text-xs font-bold pointer-events-none">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>+91</span>
                </div>
                <input
                  id="register-phone-input"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-16 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
                Set Password (min. 6 characters)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
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
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="register-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Invitation Code (Optional)</span>
                <span className="text-[10px] text-amber-400 font-medium">Valid VIP Code Applied</span>
              </label>
              <input
                id="register-referral-input"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500 transition uppercase"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                id="register-terms-checkbox"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 bg-gray-950 border-gray-800 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="register-terms-checkbox" className="text-[11px] text-gray-400 cursor-pointer select-none">
                I am 18 years or older and accept the WinXbet Fair Play &amp; Privacy Policy.
              </label>
            </div>

            <button
              id="submit-register-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Register &amp; Claim ₹68 Bonus</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="bg-gray-900/90 border border-gray-800/90 rounded-2xl p-4 shadow-xl space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-300 mb-1.5 block">
                Mobile Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-gray-400 text-xs font-bold pointer-events-none">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>+91</span>
                </div>
                <input
                  id="login-phone-input"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-16 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset: Please contact 24/7 customer support.')}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
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

            <button
              id="submit-login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Log In to WinXbet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-800 w-full" />
          <span className="bg-gray-950 px-3 text-[11px] text-gray-500 uppercase tracking-wider shrink-0">
            Or Fast 1-Click Access
          </span>
          <div className="border-t border-gray-800 w-full" />
        </div>

        {/* Fast 1-Click Alternate Sign In Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="login-google-btn"
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition shadow-md disabled:opacity-50"
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
            <span className="truncate">Google Play</span>
          </button>

          <button
            id="login-guest-btn"
            type="button"
            onClick={handleGuestAuth}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-amber-300 font-bold text-xs border border-amber-500/30 transition shadow-md disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Guest +₹68</span>
          </button>
        </div>
      </div>

      {/* Security and Trust Footer */}
      <div className="relative z-10 pt-6 pb-2 text-center space-y-3">
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Fair RNG Game</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span>24/7 Fast UPI</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-600">
          Please play responsibly. Only users aged 18+ are permitted.
        </p>
      </div>
    </div>
  );
};
