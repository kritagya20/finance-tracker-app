import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Fingerprint, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userName?: string) => void;
  onNavigateSignup: () => void;
  onNavigateForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateSignup,
  onNavigateForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = email.split('@')[0] || 'User';
    onLoginSuccess(name.charAt(0).toUpperCase() + name.slice(1));
  };

  return (
    <div className="flex flex-col justify-between min-h-[85dvh] pt-6 pb-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-950/60 ring-1 ring-white/20">
          <ShieldCheck className="size-9 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Welcome to Ledger</h1>
        <p className="mt-1 text-xs text-slate-400 max-w-[280px]">
          Your zero-knowledge, on-device private finance vault.
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 size-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Master Password</label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-xs font-medium text-violet-400 hover:text-violet-300 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 size-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/60 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform active:scale-[0.98] hover:brightness-110"
          >
            <span>Unlock Vault</span>
            <ArrowRight className="size-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            or instant access
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Biometric Quick Unlock */}
        <button
          type="button"
          onClick={() => onLoginSuccess('User')}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-slate-800/70 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 active:scale-[0.98]"
        >
          <Fingerprint className="size-4 text-emerald-400" />
          <span>Biometric Passkey / Face ID</span>
        </button>

        {/* Offline Guest Mode */}
        <button
          type="button"
          onClick={() => onLoginSuccess('Guest')}
          className="w-full py-2 text-center text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          Continue as Offline Guest (Zero Cloud)
        </button>
      </div>

      {/* Switch to Signup */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have a vault yet?{' '}
        <button
          type="button"
          onClick={onNavigateSignup}
          className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
        >
          Create New Vault
        </button>
      </div>
    </div>
  );
};
