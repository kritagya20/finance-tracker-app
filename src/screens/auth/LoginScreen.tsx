import React, { useState, useEffect } from 'react';
import { Mail, Phone, Eye, EyeOff, ShieldCheck, Fingerprint, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateLoginIdentifier, detectIdentifierType, deriveDisplayName, validateMpin } from '../../lib/authValidation';
import { MpinInput } from '../../components/ui/MpinInput';

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

  const [identifier, setIdentifier] = useState('');
  const [mpin, setMpin] = useState('');
  const [showMpin, setShowMpin] = useState(false);
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [mpinTouched, setMpinTouched] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validation = validateLoginIdentifier(identifier);
  const mpinValidation = validateMpin(mpin, { enforceStrength: false });
  const detectedType = detectIdentifierType(identifier);

  const showIdentifierError = (identifierTouched || hasSubmitted) && identifier.trim().length > 0 && !validation.isValid;
  const showEmptyIdentifierError = hasSubmitted && identifier.trim().length === 0;
  const isIdentifierValid = identifier.trim().length > 0 && validation.isValid;

  const showMpinError = (mpinTouched || hasSubmitted) && !mpinValidation.isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!validation.isValid || !mpinValidation.isValid) {
      return;
    }

    const name = deriveDisplayName(identifier);
    onLoginSuccess(name);
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
      <div className="mt-6 rounded-2xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-4 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Email or Mobile Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-secondary">
              Email or Mobile Number
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

            {/* Validation Feedback (only on blur or submit) */}
            {showIdentifierError && (
              <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>{validation.errorMessage}</span>
              </p>
            )}
            {showEmptyIdentifierError && (
              <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>Please enter your email or mobile number to continue.</span>
              </p>
            )}
          </div>

          {/* 6-Digit MPIN Input (Discrete Box Container) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-theme-secondary">6-Digit MPIN</label>
                <button
                  type="button"
                  onClick={() => setShowMpin(!showMpin)}
                  className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                  aria-label={showMpin ? 'Hide MPIN' : 'Show MPIN'}
                >
                  {showMpin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showMpin ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                Forgot MPIN?
              </button>
            </div>
            <MpinInput
              value={mpin}
              onChange={setMpin}
              onBlur={() => {
                if (mpin.length > 0) {
                  setMpinTouched(true);
                }
              }}
              hasError={showMpinError}
              isSuccess={mpin.length === 6}
              showValue={showMpin}
            />

            {showMpinError && (
              <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>{mpinValidation.errorMessage}</span>
              </p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.97] hover:brightness-110"
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
          className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl border border-theme-border bg-theme-card-subtle text-sm font-medium text-theme-primary hover:bg-theme-card-hover active:scale-[0.98] transition-colors"
        >
          <Fingerprint className="size-4 text-emerald-500 dark:text-emerald-400" />
          <span>Biometric Passkey / Face ID</span>
        </button>

        {/* Offline Guest Mode */}
        <button
          type="button"
          onClick={() => onLoginSuccess('Guest')}
          className="w-full min-h-[44px] flex items-center justify-center text-center text-xs font-medium text-theme-muted hover:text-theme-primary transition-colors"
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
