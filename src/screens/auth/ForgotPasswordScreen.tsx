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
          className="flex items-center gap-1 text-xs font-medium text-theme-muted hover:text-theme-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Sign In</span>
        </button>

        {/* Brand Header */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-theme-card-subtle text-violet-600 dark:text-violet-400 border border-theme-border shadow-lg">
            <KeyRound className="size-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-theme-primary">
            Reset Vault Access
          </h1>
          <p className="mt-1 text-xs text-theme-muted max-w-[280px]">
            Recover access using your registered email or local backup phrase.
          </p>
        </div>

        {/* Form / Content Card */}
        <div className="mt-6 rounded-3xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-4 transition-colors">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-theme-secondary">Registered Email</label>
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

              {/* Zero-Knowledge Note */}
              <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Ledger stores data locally. If you lost your master password, you can restore from your latest exported <code>.vault</code> backup file.
                </span>
              </div>

              {/* Reset CTA */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.98] hover:brightness-110"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                ✓
              </div>
              <h2 className="text-base font-semibold text-theme-primary">
                Recovery Instructions Sent
              </h2>
              <p className="text-xs text-theme-muted leading-relaxed">
                A verification link has been sent to <span className="text-theme-primary font-medium">{email}</span>. Click below to enter your vault.
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
      <div className="mt-4 text-center text-xs text-theme-muted">
        Remembered your password?{' '}
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
