import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ShieldCheck, Check, AlertCircle, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface BotCaptchaProps {
  onVerifiedChange: (isVerified: boolean) => void;
  captchaInput: string;
  onCaptchaInputChange: (value: string) => void;
  idPrefix?: string;
}

export const BotCaptcha: React.FC<BotCaptchaProps> = ({
  onVerifiedChange,
  captchaInput,
  onCaptchaInputChange,
  idPrefix = 'login'
}) => {
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [isMatch, setIsMatch] = useState<boolean>(false);
  const [isTouched, setIsTouched] = useState<boolean>(false);
  const [isHumanCheckboxChecked, setIsHumanCheckboxChecked] = useState<boolean>(false);
  const [isCheckingBot, setIsCheckingBot] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate random 5-character alphanumeric string (avoiding confusing chars: 0, O, I, 1)
  const generateRandomCode = useCallback((): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Draw distorted captcha onto canvas with noise, waves, and colorful text
  const drawCaptcha = useCallback((code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark sleek gradient background matching VIP casino theme
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, 255, ${0.15 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add interference lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${220 + Math.random() * 35}, ${150 + Math.random() * 80}, 50, ${0.35 + Math.random() * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 15, Math.random() * height);
      ctx.bezierCurveTo(
        width * 0.33, Math.random() * height,
        width * 0.66, Math.random() * height,
        width - Math.random() * 10, Math.random() * height
      );
      ctx.stroke();
    }

    // Draw characters with distinct rotations, colors, and offsets
    const charColors = ['#f59e0b', '#fbbf24', '#f87171', '#38bdf8', '#34d399', '#a78bfa'];
    const charWidth = width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const color = charColors[(i + Math.floor(Math.random() * 2)) % charColors.length];
      const fontSize = Math.floor(18 + Math.random() * 6);
      const angle = (Math.random() - 0.5) * 0.45; // -12 to +12 degrees

      ctx.save();
      ctx.font = `900 ${fontSize}px "Courier New", monospace`;
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const x = (i + 0.8) * charWidth;
      const y = height / 2 + (Math.random() - 0.5) * 6 + 6;

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }, []);

  const refreshCaptcha = useCallback(() => {
    triggerHaptic('light');
    const newCode = generateRandomCode();
    setCaptchaCode(newCode);
    drawCaptcha(newCode);
    onCaptchaInputChange('');
    setIsMatch(false);
    onVerifiedChange(false);
  }, [generateRandomCode, drawCaptcha, onCaptchaInputChange, onVerifiedChange]);

  // Initial draw
  useEffect(() => {
    const code = generateRandomCode();
    setCaptchaCode(code);
    setTimeout(() => {
      drawCaptcha(code);
    }, 50);
  }, [generateRandomCode, drawCaptcha]);

  // Validate entered captcha code vs target code
  useEffect(() => {
    const cleanInput = captchaInput.trim().toUpperCase();
    const matches = cleanInput.length === captchaCode.length && cleanInput === captchaCode;
    setIsMatch(matches);
    
    // Overall verified if captcha matches AND human checkbox is checked
    const fullyVerified = matches && isHumanCheckboxChecked;
    onVerifiedChange(fullyVerified);

    if (matches && !isMatch) {
      triggerHaptic('success');
    }
  }, [captchaInput, captchaCode, isHumanCheckboxChecked, isMatch, onVerifiedChange]);

  const handleHumanToggle = () => {
    if (isHumanCheckboxChecked) {
      setIsHumanCheckboxChecked(false);
      onVerifiedChange(false);
      triggerHaptic('light');
      return;
    }

    triggerHaptic('selection');
    setIsCheckingBot(true);

    // Realistic human verification check delay
    setTimeout(() => {
      setIsCheckingBot(false);
      setIsHumanCheckboxChecked(true);
      triggerHaptic('success');
      if (captchaInput.trim().toUpperCase() === captchaCode) {
        onVerifiedChange(true);
      }
    }, 600);
  };

  const isVerified = isMatch && isHumanCheckboxChecked;

  return (
    <div className="space-y-2.5 p-3 rounded-2xl bg-gray-950/80 border border-amber-500/20 shadow-inner">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Security Anti-Bot Captcha</span>
        </label>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
          VIP Guard
        </span>
      </div>

      {/* Captcha graphic canvas & code refresh block */}
      <div className="flex items-center gap-2">
        <div className="relative rounded-xl overflow-hidden border border-gray-700/80 bg-gray-900 shadow-md">
          <canvas
            ref={canvasRef}
            width={140}
            height={42}
            className="block select-none cursor-pointer"
            onClick={refreshCaptcha}
            title="Click to regenerate new captcha"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
        </div>

        <button
          id={`${idPrefix}-refresh-captcha-btn`}
          type="button"
          onClick={refreshCaptcha}
          className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-amber-400 border border-gray-800 hover:border-amber-500/40 transition flex items-center justify-center shrink-0"
          title="Refresh Anti-Bot Code"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Captcha input */}
        <div className="flex-1 relative">
          <input
            id={`${idPrefix}-captcha-input`}
            type="text"
            maxLength={5}
            value={captchaInput}
            onChange={(e) => {
              setIsTouched(true);
              onCaptchaInputChange(e.target.value.toUpperCase());
            }}
            placeholder="Type code"
            className={`w-full px-3 py-2 bg-gray-900 border rounded-xl text-xs font-mono font-bold tracking-widest uppercase transition placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-500 ${
              isMatch
                ? 'border-emerald-500/80 text-emerald-400 bg-emerald-950/20'
                : isTouched && captchaInput.length >= 5
                ? 'border-red-500/80 text-red-300'
                : 'border-gray-800 text-white focus:border-amber-500'
            }`}
            autoComplete="off"
            spellCheck="false"
          />
          {isMatch && (
            <Check className="w-4 h-4 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          )}
        </div>
      </div>

      {/* Interactive "I am not a robot" confirmation shield */}
      <div 
        onClick={handleHumanToggle}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer select-none ${
          isHumanCheckboxChecked
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-gray-900/90 border-gray-800 hover:border-gray-700 text-gray-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
            isHumanCheckboxChecked
              ? 'bg-emerald-500 border-emerald-400 text-black'
              : 'border-gray-600 bg-gray-950'
          }`}>
            {isCheckingBot ? (
              <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : isHumanCheckboxChecked ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : null}
          </div>
          <span className="text-[11px] font-bold">
            {isCheckingBot ? 'Verifying human response...' : "I am a real human player, not a robot"}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-gray-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>WinX-Shield</span>
        </div>
      </div>

      {/* Feedback helper */}
      {isTouched && captchaInput.length > 0 && !isMatch && (
        <div className="flex items-center gap-1 text-[10px] text-rose-400 pt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Code does not match image. Tap refresh if unclear.</span>
        </div>
      )}

      {isVerified && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold pt-0.5 animate-fadeIn">
          <Check className="w-3 h-3 shrink-0" />
          <span>Anti-bot security verification passed successfully!</span>
        </div>
      )}
    </div>
  );
};
