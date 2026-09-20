import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Fingerprint,
  MessageSquareText,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MpinInput } from '../../components/ui/MpinInput';
import { validateMpin } from '../../lib/authValidation';
import { cn } from '../../lib/utils';
import { useDrawerDragToDismiss } from '../../hooks/useDrawerDragToDismiss';

interface ChangeMpinDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber?: string;
  onMpinChanged: (newMpin: string) => Promise<void> | void;
}

type Stage = 'VERIFY' | 'ENTER_NEW' | 'CONFIRM_NEW' | 'SUCCESS';
type VerifyMethod = 'BIOMETRIC' | 'OTP';

export const ChangeMpinDrawer: React.FC<ChangeMpinDrawerProps> = ({
  isOpen,
  onClose,
  phoneNumber = '+91 98765 43210',
  onMpinChanged,
}) => {
  // Stage Flow State
  const [stage, setStage] = useState<Stage>('VERIFY');
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('BIOMETRIC');

  const { dragHandleProps, sheetStyle, backdropStyle } = useDrawerDragToDismiss({
    onClose,
    enabled: stage !== 'SUCCESS',
  });

  // Verification State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(30);

  // New MPIN State
  const [newMpin, setNewMpin] = useState('');
  const [showNewMpin, setShowNewMpin] = useState(false);
  const [newMpinError, setNewMpinError] = useState<string | null>(null);

  // Confirm MPIN State
  const [confirmMpin, setConfirmMpin] = useState('');
  const [showConfirmMpin, setShowConfirmMpin] = useState(false);
  const [confirmMpinError, setConfirmMpinError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset internal state whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setStage('VERIFY');
      setVerifyMethod('BIOMETRIC');
      setIsAuthenticating(false);
      setOtpValue('');
      setOtpError(null);
      setResendSeconds(30);
      setNewMpin('');
      setShowNewMpin(false);
      setNewMpinError(null);
      setConfirmMpin('');
      setShowConfirmMpin(false);
      setConfirmMpinError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  // OTP Countdown timer
  useEffect(() => {
    if (!isOpen || stage !== 'VERIFY' || verifyMethod !== 'OTP') return;
    if (resendSeconds <= 0) return;

    const timer = setInterval(() => {
      setResendSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, stage, verifyMethod, resendSeconds]);

  if (!isOpen) return null;

  // Mask phone number (e.g. +91 98*** **210)
  const maskedPhone = (() => {
    const raw = phoneNumber.replace(/\s+/g, '');
    if (raw.length <= 6) return raw;
    const prefix = raw.slice(0, 5);
    const suffix = raw.slice(-3);
    return `${prefix} •••• •${suffix}`;
  })();

  // 1. Handle Biometric Verification Simulation
  const handleBiometricAuth = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setStage('ENTER_NEW');
    }, 800);
  };

  // 2. Handle OTP Verification
  const handleVerifyOtp = () => {
    if (otpValue.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }
    // Accept demo OTP "482910" or any 6-digit code for testing
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setStage('ENTER_NEW');
    }, 500);
  };

  const handleAutoFillDemoOtp = () => {
    setOtpValue('482910');
    setOtpError(null);
  };

  // 3. Handle Step 2 (Enter New MPIN) Continue
  const handleEnterNewMpinContinue = () => {
    const validation = validateMpin(newMpin);
    if (!validation.isValid) {
      setNewMpinError(validation.errorMessage || 'Please enter a valid 6-digit MPIN.');
      return;
    }
    setNewMpinError(null);
    setStage('CONFIRM_NEW');
  };

  // 4. Handle Step 3 (Confirm MPIN) Submit
  const handleConfirmMpinSubmit = async () => {
    if (confirmMpin.length !== 6) {
      setConfirmMpinError('Please enter your full 6-digit MPIN.');
      return;
    }
    if (confirmMpin !== newMpin) {
      setConfirmMpinError('MPINs do not match. Please re-enter.');
      setConfirmMpin('');
      return;
    }

    try {
      setIsSaving(true);
      setConfirmMpinError(null);
      await onMpinChanged(newMpin);
      setStage('SUCCESS');
    } catch (err) {
      console.error('Failed to change MPIN:', err);
      setConfirmMpinError('Failed to update MPIN. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => {
          if (stage !== 'SUCCESS') onClose();
        }}
        aria-hidden="true"
        style={backdropStyle}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Bottom Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-mpin-title"
        style={sheetStyle}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] rounded-t-3xl bg-theme-elevated border-t border-theme-border shadow-2xl max-h-[92vh] flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag Area (Pull Handle & Navigation Bar) */}
        <div {...dragHandleProps} className="touch-none select-none cursor-grab active:cursor-grabbing shrink-0">
          {/* Pull Handle */}
          <div className="w-full pt-2.5 pb-1 flex items-center justify-center">
            <div className="w-9 h-1 rounded-full bg-slate-600/40 shrink-0" />
          </div>

          {/* Drawer Header with Single ArrowLeft (Navigation Invariant) */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-theme-border/40">
            {stage !== 'SUCCESS' ? (
              <button
                type="button"
                onClick={() => {
                  if (stage === 'CONFIRM_NEW') {
                    setStage('ENTER_NEW');
                  } else if (stage === 'ENTER_NEW') {
                    setStage('VERIFY');
                  } else {
                    onClose();
                  }
                }}
                aria-label="Back"
                className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <div className="size-9" />
            )}

            <span id="change-mpin-title" className="text-sm font-bold text-theme-primary pointer-events-none">
              {stage === 'VERIFY' && 'Verify Identity'}
              {stage === 'ENTER_NEW' && 'Set New MPIN'}
              {stage === 'CONFIRM_NEW' && 'Confirm New MPIN'}
              {stage === 'SUCCESS' && 'Security Updated'}
            </span>

            <div className="size-9 pointer-events-none" />
          </div>
        </div>

        {/* Multi-Stage Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-5">
          {/* ============================================================= */}
          {/* STAGE 1: VERIFICATION CHALLENGE (Biometrics or SMS OTP)       */}
          {/* ============================================================= */}
          {stage === 'VERIFY' && (
            <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in duration-200">
              {/* Method Switcher Pills */}
              <div className="grid grid-cols-2 p-1 bg-theme-card-subtle rounded-xl border border-theme-border w-full">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('BIOMETRIC');
                    setOtpError(null);
                  }}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                    verifyMethod === 'BIOMETRIC'
                      ? 'bg-theme-card text-violet-600 dark:text-violet-400 shadow-xs border border-theme-border'
                      : 'text-theme-muted hover:text-theme-primary'
                  )}
                >
                  <Fingerprint className="size-4" />
                  <span>Biometrics</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('OTP');
                    setOtpError(null);
                  }}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                    verifyMethod === 'OTP'
                      ? 'bg-theme-card text-violet-600 dark:text-violet-400 shadow-xs border border-theme-border'
                      : 'text-theme-muted hover:text-theme-primary'
                  )}
                >
                  <MessageSquareText className="size-4" />
                  <span>SMS OTP</span>
                </button>
              </div>

              {/* Sub-mode A: Biometrics */}
              {verifyMethod === 'BIOMETRIC' && (
                <div className="flex flex-col items-center space-y-4 pt-2 w-full">
                  <div className="relative flex size-20 items-center justify-center rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <Fingerprint className={cn('size-10 transition-transform', isAuthenticating && 'animate-pulse scale-110 text-violet-500')} />
                    {isAuthenticating && (
                      <div className="absolute inset-0 rounded-3xl ring-4 ring-violet-500/30 animate-ping pointer-events-none" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-theme-primary">
                      Biometric Security Check
                    </h3>
                    <p className="text-xs text-theme-muted mt-1 max-w-[280px]">
                      Authenticate using Touch ID, Face ID, or your device lock to proceed with MPIN change.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBiometricAuth}
                    disabled={isAuthenticating}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all active:scale-[0.97]"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verifying Passkey...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="size-4" />
                        <span>Authenticate with Biometrics</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Sub-mode B: SMS OTP */}
              {verifyMethod === 'OTP' && (
                <div className="flex flex-col items-center space-y-4 pt-1 w-full">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <MessageSquareText className="size-7" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-theme-primary">
                      Enter 6-Digit OTP
                    </h3>
                    <p className="text-xs text-theme-muted mt-1">
                      Code sent to <span className="font-mono font-medium text-theme-primary">{maskedPhone}</span>
                    </p>
                  </div>

                  {/* 1-Tap Demo Auto-Fill Pill */}
                  <button
                    type="button"
                    onClick={handleAutoFillDemoOtp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-[11px] font-semibold text-violet-400 hover:bg-violet-500/20 active:scale-95 transition-all"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Auto-Fill Demo OTP: 482910</span>
                  </button>

                  {/* OTP 6-Digit Box Input */}
                  <div className="w-full">
                    <MpinInput
                      value={otpValue}
                      onChange={(val) => {
                        setOtpValue(val);
                        if (otpError) setOtpError(null);
                      }}
                      hasError={Boolean(otpError)}
                      isSuccess={otpValue.length === 6}
                      showValue={true}
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs font-medium text-rose-400 flex items-center gap-1 -mt-2">
                      <AlertCircle className="size-3.5" />
                      <span>{otpError}</span>
                    </p>
                  )}

                  {/* Resend Timer */}
                  <div className="text-xs text-theme-muted">
                    {resendSeconds > 0 ? (
                      <span>Resend OTP in <strong className="font-mono text-theme-primary">{resendSeconds}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setResendSeconds(30);
                          handleAutoFillDemoOtp();
                        }}
                        className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                      >
                        Resend OTP Code
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isAuthenticating || otpValue.length !== 6}
                    className={cn(
                      'w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all active:scale-[0.97]',
                      otpValue.length !== 6 && 'opacity-[0.38] pointer-events-none'
                    )}
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <span>Verify & Proceed</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STAGE 2: ENTER NEW 6-DIGIT MPIN                                */}
          {/* ============================================================= */}
          {stage === 'ENTER_NEW' && (
            <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in duration-200">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <KeyRound className="size-7" />
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Step 1 of 2
                </span>
                <h3 className="text-base font-bold text-theme-primary mt-0.5">
                  Enter New 6-Digit MPIN
                </h3>
                <p className="text-xs text-theme-muted mt-1 max-w-[280px]">
                  Choose a secret 6-digit numeric PIN. Avoid repeated or simple sequences like 123456.
                </p>
              </div>

              {/* Show / Hide Eye Toggle */}
              <div className="flex items-center justify-end w-full px-1">
                <button
                  type="button"
                  onClick={() => setShowNewMpin(!showNewMpin)}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                >
                  {showNewMpin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showNewMpin ? 'Hide Digits' : 'Show Digits'}</span>
                </button>
              </div>

              {/* MPIN Input */}
              <div className="w-full">
                <MpinInput
                  value={newMpin}
                  onChange={(val) => {
                    setNewMpin(val);
                    if (newMpinError) setNewMpinError(null);
                  }}
                  hasError={Boolean(newMpinError)}
                  isSuccess={newMpin.length === 6 && !newMpinError}
                  showValue={showNewMpin}
                  autoFocus
                />
              </div>

              {newMpinError && (
                <p className="text-xs font-medium text-rose-400 flex items-center gap-1 -mt-2">
                  <AlertCircle className="size-3.5" />
                  <span>{newMpinError}</span>
                </p>
              )}

              <button
                type="button"
                onClick={handleEnterNewMpinContinue}
                disabled={newMpin.length !== 6}
                className={cn(
                  'w-full h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all active:scale-[0.97]',
                  newMpin.length !== 6 && 'opacity-[0.38] pointer-events-none'
                )}
              >
                <span>Continue</span>
              </button>
            </div>
          )}

          {/* ============================================================= */}
          {/* STAGE 3: RE-ENTER / CONFIRM NEW MPIN                          */}
          {/* ============================================================= */}
          {stage === 'CONFIRM_NEW' && (
            <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in duration-200">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Lock className="size-7" />
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Step 2 of 2
                </span>
                <h3 className="text-base font-bold text-theme-primary mt-0.5">
                  Confirm New MPIN
                </h3>
                <p className="text-xs text-theme-muted mt-1 max-w-[280px]">
                  Re-enter the exact same 6-digit MPIN to verify and save.
                </p>
              </div>

              {/* Show / Hide Eye Toggle */}
              <div className="flex items-center justify-end w-full px-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmMpin(!showConfirmMpin)}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                >
                  {showConfirmMpin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showConfirmMpin ? 'Hide Digits' : 'Show Digits'}</span>
                </button>
              </div>

              {/* Confirm MPIN Input */}
              <div className="w-full">
                <MpinInput
                  value={confirmMpin}
                  onChange={(val) => {
                    setConfirmMpin(val);
                    if (confirmMpinError) setConfirmMpinError(null);
                  }}
                  hasError={Boolean(confirmMpinError)}
                  isSuccess={confirmMpin.length === 6 && confirmMpin === newMpin}
                  showValue={showConfirmMpin}
                  autoFocus
                />
              </div>

              {confirmMpinError && (
                <p className="text-xs font-medium text-rose-400 flex items-center gap-1 -mt-2">
                  <AlertCircle className="size-3.5" />
                  <span>{confirmMpinError}</span>
                </p>
              )}

              <button
                type="button"
                onClick={handleConfirmMpinSubmit}
                disabled={isSaving || confirmMpin.length !== 6}
                className={cn(
                  'w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all active:scale-[0.97]',
                  (confirmMpin.length !== 6 || isSaving) && 'opacity-[0.38] pointer-events-none'
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Securing Vault...</span>
                  </>
                ) : (
                  <span>Confirm & Update MPIN</span>
                )}
              </button>
            </div>
          )}

          {/* ============================================================= */}
          {/* STAGE 4: SUCCESS CONFIRMATION                                 */}
          {/* ============================================================= */}
          {stage === 'SUCCESS' && (
            <div className="flex flex-col items-center text-center space-y-5 py-4 animate-in zoom-in-95 duration-200">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-theme-primary">
                  MPIN Changed Successfully!
                </h3>
                <p className="text-xs text-theme-muted max-w-[280px]">
                  Your on-device encrypted vault is now secured with your new 6-digit MPIN.
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-col gap-2 w-full max-w-[300px] text-left">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-theme-card-subtle border border-theme-border text-xs">
                  <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                  <span className="text-theme-secondary">Local vault key re-encrypted</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-theme-card-subtle border border-theme-border text-xs">
                  <Fingerprint className="size-4 text-violet-400 shrink-0" />
                  <span className="text-theme-secondary">Biometric passkey re-synchronized</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all active:scale-[0.97]"
              >
                <span>Done</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
