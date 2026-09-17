import React, { useState, useEffect } from 'react';
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
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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
        <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-900/30 ring-1 ring-white/20">
          <ShieldCheck className="size-9 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-theme-primary">
          Welcome to Ledger
        </h1>
        <p className="mt-1 text-xs text-theme-muted max-w-[280px]">
          Your zero-knowledge, on-device private finance vault.
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-6 rounded-3xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-4 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-secondary">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 size-4 text-theme-muted" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-input py-3 pl-10 pr-4 text-sm text-theme-primary placeholder:text-theme-muted focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 shadow-sm transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-theme-secondary">Master Password</label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 size-4 text-theme-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-input py-3 pl-10 pr-10 text-sm text-theme-primary placeholder:text-theme-muted focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 shadow-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-theme-muted hover:text-theme-primary transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.98] hover:brightness-110"
          >
            <span>Unlock Vault</span>
            <ArrowRight className="size-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-theme-border" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-theme-muted">
            or instant access
          </span>
          <div className="h-px flex-1 bg-theme-border" />
        </div>

        {/* Biometric Quick Unlock */}
        <button
          type="button"
          onClick={() => onLoginSuccess('User')}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-theme-border bg-theme-card-subtle py-3 text-xs font-semibold text-theme-secondary hover:bg-theme-card-hover active:scale-[0.98] transition-colors"
        >
          <Fingerprint className="size-4 text-emerald-500 dark:text-emerald-400" />
          <span>Biometric Passkey / Face ID</span>
        </button>

        {/* Offline Guest Mode */}
        <button
          type="button"
          onClick={() => onLoginSuccess('Guest')}
          className="w-full py-2 text-center text-xs font-medium text-theme-muted hover:text-theme-primary transition-colors"
        >
          Continue as Offline Guest (Zero Cloud)
        </button>
      </div>

      {/* Switch to Signup */}
      <div className="mt-6 text-center text-xs text-theme-muted">
        Don't have a vault yet?{' '}
        <button
          type="button"
          onClick={onNavigateSignup}
          className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Create New Vault
        </button>
      </div>
    </div>
  );
};
