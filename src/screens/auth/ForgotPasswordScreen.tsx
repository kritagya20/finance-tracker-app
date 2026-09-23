import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, Phone, ArrowLeft, ShieldAlert, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateLoginIdentifier, detectIdentifierType } from '../../lib/authValidation';

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

  const [identifier, setIdentifier] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validation = validateLoginIdentifier(identifier);
  const detectedType = detectIdentifierType(identifier);

  const showIdentifierError = (identifierTouched || hasSubmitted) && identifier.trim().length > 0 && !validation.isValid;
  const showEmptyIdentifierError = hasSubmitted && identifier.trim().length === 0;
  const isIdentifierValid = identifier.trim().length > 0 && validation.isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!validation.isValid) {
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col justify-between min-h-[85dvh] pt-6 pb-4">
      <div>
        {/* Back Button */}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="flex items-center gap-1.5 min-h-[48px] text-xs font-semibold text-theme-muted hover:text-theme-primary transition-colors active:scale-[0.98]"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Sign In</span>
        </button>

        {/* Brand Header */}
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-theme-card-subtle text-violet-600 dark:text-violet-400 border border-theme-border shadow-lg">
            <KeyRound className="size-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-theme-primary">
            Reset 6-Digit MPIN
          </h1>
          <p className="mt-1 text-xs text-theme-muted max-w-[280px]">
            Recover access using your registered email, mobile number, or backup phrase.
          </p>
        </div>

        {/* Form / Content Card */}
        <div className="mt-6 rounded-2xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-4 transition-colors">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-theme-secondary">
                  Registered Email or Mobile Number <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  {detectedType === 'phone' ? (
                    <Phone className="absolute left-3.5 top-4 size-4 text-violet-500 transition-colors" />
                  ) : (
                    <Mail className="absolute left-3.5 top-4 size-4 text-theme-muted transition-colors" />
                  )}
                  <input
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="Email or Mobile Number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onBlur={() => {
                      if (identifier.trim().length > 0) {
                        setIdentifierTouched(true);
                      }
                    }}
                    className={`w-full h-12 rounded-xl border bg-theme-input pl-10 pr-10 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none shadow-sm transition-colors ${
                      showIdentifierError || showEmptyIdentifierError
                        ? 'border-2 border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : isIdentifierValid
                        ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-theme-border focus:border-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                    }`}
                  />
                  {isIdentifierValid && (
                    <CheckCircle2 className="absolute right-3.5 top-4 size-4 text-emerald-500 animate-in fade-in zoom-in-75 duration-150" />
                  )}
                  {(showIdentifierError || showEmptyIdentifierError) && (
                    <AlertCircle className="absolute right-3.5 top-4 size-4 text-rose-500 animate-in fade-in zoom-in-75 duration-150" />
                  )}
                </div>

                {showIdentifierError && (
                  <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{validation.errorMessage}</span>
                  </p>
                )}
                {showEmptyIdentifierError && (
                  <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>Please enter your registered email or mobile number.</span>
                  </p>
                )}
              </div>

              {/* Zero-Knowledge Note */}
              <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Ledger stores data locally. If you lost your master password, you can restore from your latest exported <code>.vault</code> backup file.
                </span>
              </div>

              {/* Reset CTA */}
              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.97] hover:brightness-110"
              >
                <span>{detectedType === 'phone' ? 'Send Recovery SMS' : 'Send Reset Link'}</span>
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
                A verification {detectedType === 'phone' ? 'SMS code' : 'link'} has been sent to{' '}
                <span className="text-theme-primary font-medium">{identifier}</span>. Click below to enter your vault.
              </p>
              <button
                type="button"
                onClick={onResetSuccess}
                className="w-full h-12 mt-2 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.97]"
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
