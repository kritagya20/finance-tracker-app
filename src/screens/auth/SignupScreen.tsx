import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  validatePhoneNumber,
  isValidEmail,
  validateMpin,
} from '../../lib/authValidation';
import { MpinInput } from '../../components/ui/MpinInput';
import { cn } from '../../lib/utils';

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

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showMpin, setShowMpin] = useState(false);

  // Field touched states for blur validation
  const [nameTouched, setNameTouched] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [mpinTouched, setMpinTouched] = useState(false);
  const [confirmMpinTouched, setConfirmMpinTouched] = useState(false);

  // Step attempted submits
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [step2Submitted, setStep2Submitted] = useState(false);
  const [step3Submitted, setStep3Submitted] = useState(false);

  // Validations
  const mobileValidation = validatePhoneNumber(mobile);
  const isEmailFormatValid = !email.trim() || isValidEmail(email.trim());
  const mpinValidation = validateMpin(mpin);

  const isConfirmMpinMatching = confirmMpin === mpin && mpin.length === 6;
  let confirmMpinError: string | null = null;
  if (!confirmMpin) {
    confirmMpinError = 'Please confirm your 6-digit MPIN.';
  } else if (confirmMpin.length !== 6) {
    confirmMpinError = 'MPIN should be of 6 digits.';
  } else if (confirmMpin !== mpin) {
    confirmMpinError = 'MPINs do not match.';
  }

  const showNameError = (nameTouched || step1Submitted) && !name.trim();
  const showMobileError = (mobileTouched || step2Submitted) && !mobileValidation.isValid;
  const showEmailError =
    (emailTouched || step2Submitted) && email.trim().length > 0 && !isEmailFormatValid;
  const showMpinError = (mpinTouched || step3Submitted) && !mpinValidation.isValid;
  const showConfirmMpinError =
    (confirmMpinTouched || step3Submitted) && confirmMpinError !== null;

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Submitted(true);
    if (!name.trim()) return;
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Submitted(true);
    if (!mobileValidation.isValid || !isEmailFormatValid) return;
    setStep(3);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep3Submitted(true);
    if (!mpinValidation.isValid || !isConfirmMpinMatching) return;
    onSignupSuccess(name.trim() || 'User');
  };

  return (
    <div className="flex flex-col justify-between min-h-[85dvh] pt-2 pb-4 select-none">
      {/* Top Header: Back Button + Segmented Progress Bar */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                aria-label="Previous step"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-90 transition-all"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateLogin}
                aria-label="Back to login"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-90 transition-all"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <span className="text-xs font-semibold text-theme-secondary">
              Step {step} of 3
            </span>
          </div>

          <span
            className={cn(
              'font-mono text-xs font-bold transition-colors',
              step === 3
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-violet-600 dark:text-violet-400'
            )}
          >
            {step === 1 ? '33%' : step === 2 ? '66%' : '100%'}
          </span>
        </div>

        {/* 3-Segment Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
          {[1, 2, 3].map((s) => {
            const isActive = step >= s;
            const isFinished = step === 3;
            return (
              <div
                key={s}
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isActive
                    ? isFinished
                      ? 'bg-emerald-500 shadow-xs shadow-emerald-500/30'
                      : 'bg-violet-600 shadow-xs shadow-violet-600/30'
                    : 'bg-theme-card-subtle border border-theme-border/50'
                )}
              />
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: IDENTITY (What should we call you?)                  */}
      {/* ------------------------------------------------------------- */}
      {step === 1 && (
        <form
          onSubmit={handleStep1Next}
          noValidate
          className="flex flex-col justify-between flex-1 min-h-[70dvh] pt-6 animate-in fade-in slide-in-from-right-2 duration-200"
        >
          <div>
            {/* App Icon & Welcome */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-900/30 ring-1 ring-white/20">
                <ShieldCheck className="size-8 text-white" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-theme-primary">
                What should we call you?
              </h1>
              <p className="mt-1 text-xs text-theme-muted max-w-[280px]">
                Your name helps personalize your private local finance vault.
              </p>
            </div>

            {/* Step 1 Input Card */}
            <div className="mt-7 rounded-2xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-theme-secondary">
                  Your Full Name <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-4 size-4 text-theme-muted" />
                  <input
                    type="text"
                    autoFocus
                    autoComplete="name"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => {
                      if (name.trim().length > 0) setNameTouched(true);
                    }}
                    className={cn(
                      'w-full h-12 rounded-xl border bg-theme-input pl-10 pr-10 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none shadow-sm transition-colors',
                      showNameError
                        ? 'border-2 border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : name.trim().length > 0
                        ? 'border-emerald-500/70 focus:border-emerald-500'
                        : 'border-theme-border focus:border-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                    )}
                  />
                  {name.trim().length > 0 && (
                    <CheckCircle2 className="absolute right-3.5 top-4 size-4 text-emerald-500" />
                  )}
                </div>
                {showNameError && (
                  <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>Please enter your name to proceed.</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 pb-2 space-y-3">
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.97] hover:brightness-110"
            >
              <span>Continue</span>
              <ArrowRight className="size-4" />
            </button>

            <div className="text-center text-xs text-theme-muted">
              Already have a vault?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Log In
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: CONTACT DETAILS (Mobile & Email)                      */}
      {/* ------------------------------------------------------------- */}
      {step === 2 && (
        <form
          onSubmit={handleStep2Next}
          noValidate
          className="flex flex-col justify-between flex-1 min-h-[70dvh] pt-6 animate-in fade-in slide-in-from-right-2 duration-200"
        >
          <div>
            {/* Title & Subtitle */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-violet-500/15 text-violet-500 dark:text-violet-400 border border-violet-500/20">
                <Phone className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-theme-primary">
                Your contact details
              </h1>
              <p className="mt-1 text-xs text-theme-muted max-w-[290px]">
                Mobile number is required for local SMS detection.
              </p>
            </div>

            {/* Inputs Card */}
            <div className="mt-7 rounded-2xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-4">
              {/* Mobile Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-theme-secondary">
                  Mobile Number <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-4 size-4 text-theme-muted" />
                  <input
                    type="tel"
                    autoFocus
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d+\s-]/g, '');
                      setMobile(cleaned);
                    }}
                    onBlur={() => {
                      if (mobile.trim().length > 0) setMobileTouched(true);
                    }}
                    className={cn(
                      'w-full h-12 rounded-xl border bg-theme-input pl-10 pr-10 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none shadow-sm transition-colors',
                      showMobileError
                        ? 'border-2 border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : mobileValidation.isValid
                        ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-theme-border focus:border-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                    )}
                  />
                  {mobileValidation.isValid && (
                    <CheckCircle2 className="absolute right-3.5 top-4 size-4 text-emerald-500" />
                  )}
                  {showMobileError && (
                    <AlertCircle className="absolute right-3.5 top-4 size-4 text-rose-500" />
                  )}
                </div>
                {showMobileError && (
                  <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{mobileValidation.errorMessage}</span>
                  </p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-theme-secondary block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-4 size-4 text-theme-muted" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => {
                      if (email.trim().length > 0) setEmailTouched(true);
                    }}
                    className={cn(
                      'w-full h-12 rounded-xl border bg-theme-input pl-10 pr-10 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none shadow-sm transition-colors',
                      showEmailError
                        ? 'border-2 border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : email.trim().length > 0 && isEmailFormatValid
                        ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-theme-border focus:border-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                    )}
                  />
                  {email.trim().length > 0 && isEmailFormatValid && (
                    <CheckCircle2 className="absolute right-3.5 top-4 size-4 text-emerald-500" />
                  )}
                  {showEmailError && (
                    <AlertCircle className="absolute right-3.5 top-4 size-4 text-rose-500" />
                  )}
                </div>
                {showEmailError && (
                  <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>Enter a valid email address (e.g. name@domain.com)</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-6 pb-2">
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.97] hover:brightness-110"
            >
              <span>Continue to Security PIN</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: SECURITY MPIN (Create & Confirm 6-Digit PIN)         */}
      {/* ------------------------------------------------------------- */}
      {step === 3 && (
        <form
          onSubmit={handleStep3Submit}
          noValidate
          className="flex flex-col justify-between flex-1 min-h-[70dvh] pt-6 animate-in fade-in slide-in-from-right-2 duration-200"
        >
          <div>
            {/* Title & Subtitle */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-theme-primary">
                Create your 6-digit MPIN
              </h1>
              <p className="mt-1 text-xs text-theme-muted max-w-[290px]">
                Your MPIN encrypts and locks your private vault on this device.
              </p>
            </div>

            {/* MPIN Input Card */}
            <div className="mt-7 rounded-2xl border border-theme-border bg-theme-card p-5 shadow-xl space-y-5">
              {/* Primary MPIN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-theme-secondary">
                    Set 6-Digit MPIN <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                  </label>
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
                <MpinInput
                  value={mpin}
                  onChange={setMpin}
                  onBlur={() => {
                    if (mpin.length > 0) setMpinTouched(true);
                  }}
                  hasError={showMpinError}
                  isSuccess={mpin.length === 6}
                  showValue={showMpin}
                  autoFocus={true}
                />
                {showMpinError && (
                  <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{mpinValidation.errorMessage}</span>
                  </p>
                )}
              </div>

              {/* Confirm MPIN */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-theme-secondary">
                  Confirm 6-Digit MPIN <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <MpinInput
                  value={confirmMpin}
                  onChange={setConfirmMpin}
                  onBlur={() => {
                    if (confirmMpin.length > 0) setConfirmMpinTouched(true);
                  }}
                  hasError={showConfirmMpinError}
                  isSuccess={isConfirmMpinMatching}
                  showValue={showMpin}
                />
                {showConfirmMpinError && (
                  <p className="text-xs font-medium text-rose-400 flex items-start gap-1.5 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{confirmMpinError}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-6 pb-2">
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition-transform active:scale-[0.97] hover:brightness-110"
            >
              <ShieldCheck className="size-4" />
              <span>Finish & Create Private Vault</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
