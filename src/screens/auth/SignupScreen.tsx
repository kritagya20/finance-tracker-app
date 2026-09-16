import React, { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SignupScreenProps {
  onSignupSuccess: (userName?: string) => void;
  onNavigateLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onNavigateLogin,
}) => {
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
        <div className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-950/60 ring-1 ring-white/20">
          <ShieldCheck className="size-8 text-white" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Create Private Vault</h1>
        <p className="mt-1 text-xs text-slate-400 max-w-[280px]">
          No cloud required. Your financial data is encrypted on this phone.
        </p>
      </div>

      {/* Signup Form */}
      <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl space-y-3.5">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Your Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 size-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
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

          {/* Master Password */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Vault Master Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 size-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Create a strong password"
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

          {/* Encryption Notice */}
          <div className="flex items-start gap-2 rounded-2xl bg-violet-500/10 p-3 border border-violet-500/20 text-violet-300 text-[11px] leading-relaxed">
            <CheckCircle2 className="size-4 text-violet-400 shrink-0 mt-0.5" />
            <span>
              This password derives your local AES-256 key. We never send it to any server.
            </span>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform active:scale-[0.98] hover:brightness-110"
          >
            <span>Create Encrypted Vault</span>
            <ArrowRight className="size-4" />
          </button>
        </form>
      </div>

      {/* Switch to Login */}
      <div className="mt-4 text-center text-xs text-slate-400">
        Already have a vault?{' '}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
