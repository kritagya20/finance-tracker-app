import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SignupScreenProps {
  onSignupSuccess: (userName?: string) => void;
  onNavigateLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onNavigateLogin,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignupSuccess(name.trim() || 'User');
  };

  return (
    <div className="flex flex-col justify-between min-h-[85dvh] pt-4 pb-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-900/30 ring-1 ring-white/20">
          <ShieldCheck className="size-8 text-white" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-theme-primary">
          Create Private Vault
        </h1>
        <p className="mt-1 text-xs text-theme-muted max-w-[280px]">
          No cloud required. Your financial data is encrypted on this phone.
        </p>
      </div>

      {/* Signup Form */}
      <div className="mt-5 rounded-3xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-3.5 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-theme-secondary">Your Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 size-4 text-theme-muted" />
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-input py-3 pl-10 pr-4 text-sm text-theme-primary placeholder:text-theme-muted focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 shadow-sm transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
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

          {/* Master Password */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-theme-secondary">Vault Master Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 size-4 text-theme-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Create a strong password"
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

          {/* Encryption Notice */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 leading-relaxed">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Protected by hardware-isolated AES-GCM on-device encryption.
            </span>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.98] hover:brightness-110"
          >
            <span>Proceed to Profile Setup</span>
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>

      {/* Switch to Sign In */}
      <div className="mt-4 text-center text-xs text-theme-muted">
        Already have a vault?{' '}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
