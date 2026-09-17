import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, ArrowLeft, ShieldAlert, ArrowRight } from 'lucide-react';

interface ForgotPasswordScreenProps {
  onResetSuccess: () => void;
  onNavigateLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onResetSuccess,
  onNavigateLogin,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col justify-between min-h-[85dvh] pt-6 pb-4">
      <div>
        {/* Back Button */}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Sign In</span>
        </button>

        {/* Brand Header */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-slate-800/80 text-violet-400 ring-1 ring-white/10 shadow-lg">
            <KeyRound className="size-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Reset Vault Access</h1>
          <p className="mt-1 text-xs text-slate-400 max-w-[280px]">
            Recover access using your registered email or local backup phrase.
          </p>
        </div>

        {/* Form / Content Card */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl space-y-4">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Registered Email</label>
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

              {/* Zero-Knowledge Note */}
              <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                <ShieldAlert className="size-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Ledger stores data locally. If you lost your master password, you can restore from your latest exported <code>.vault</code> backup file.
                </span>
              </div>

              {/* Reset CTA */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform active:scale-[0.98] hover:brightness-110"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                ✓
              </div>
              <h2 className="text-base font-semibold text-white">Recovery Instructions Sent</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                A verification link has been sent to <span className="text-white font-medium">{email}</span>. Click below to enter your vault.
              </p>
              <button
                type="button"
                onClick={onResetSuccess}
                className="w-full mt-2 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.98]"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Return to Sign In */}
      <div className="mt-4 text-center text-xs text-slate-400">
        Remembered your password?{' '}
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
