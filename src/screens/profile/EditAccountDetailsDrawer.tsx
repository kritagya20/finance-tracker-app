import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../../domain/models/types';
import { isValidEmail } from '../../lib/authValidation';
import { cn } from '../../lib/utils';
import { useDrawerDragToDismiss } from '../../hooks/useDrawerDragToDismiss';

interface EditAccountDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => Promise<UserProfile | void>;
}

export const EditAccountDetailsDrawer: React.FC<EditAccountDetailsDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const { dragHandleProps, sheetStyle, backdropStyle } = useDrawerDragToDismiss({
    onClose,
  });

  // Form State initialized from profile
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const phone = profile?.phone || '+91 98765 43210';

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation strictly on blur / submit
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = isValidEmail(email.trim());

  const showNameError = nameTouched && !isNameValid;
  const showEmailError = emailTouched && !isEmailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setEmailTouched(true);

    if (!isNameValid) {
      setGeneralError('Please enter a valid full name (at least 2 characters).');
      return;
    }

    if (!isEmailValid) {
      setGeneralError('Please enter a valid email address.');
      return;
    }

    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
      });
      onClose();
    } catch (err) {
      setGeneralError('Failed to update account details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={backdropStyle}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Bottom Sheet Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-account-title"
        style={sheetStyle}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] rounded-t-3xl bg-theme-elevated border-t border-theme-border shadow-2xl max-h-[92vh] flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag Area (Pull Handle & Navigation Bar) */}
        <div {...dragHandleProps} className="touch-none select-none cursor-grab active:cursor-grabbing shrink-0">
          {/* Pull handle */}
          <div className="w-full pt-2.5 pb-1 flex items-center justify-center">
            <div className="w-9 h-1 rounded-full bg-slate-600/40 shrink-0" />
          </div>

          {/* Top Header with Single ArrowLeft (Navigation Invariant) */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-theme-border/40">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>

            <span id="edit-account-title" className="text-sm font-bold text-theme-primary pointer-events-none">
              Edit Account Details
            </span>

            <div className="size-9 pointer-events-none" />
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4"
        >
          {generalError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 font-medium">
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
              <span>{generalError}</span>
            </div>
          )}

          {/* 1. Full Name Field (Editable) */}
          <div className="space-y-1.5">
            <label
              htmlFor="acc-name"
              className="block text-xs font-medium text-theme-secondary"
            >
              Full Name <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-theme-muted">
                <User className="size-4" />
              </div>
              <input
                id="acc-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (generalError) setGeneralError(null);
                }}
                onBlur={() => setNameTouched(true)}
                placeholder="Alex Morgan"
                className={cn(
                  'w-full h-12 rounded-xl border bg-theme-input pl-10 pr-3 text-sm text-theme-primary font-sans transition-all placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500',
                  showNameError ? 'border-rose-500 bg-rose-500/5' : 'border-theme-border'
                )}
              />
            </div>
            {showNameError && (
              <p className="text-[11px] font-medium text-rose-400 pl-1">
                Please enter your full name.
              </p>
            )}
          </div>

          {/* 2. Mobile Number Field (Disabled / Read-Only, No Locked tag, No helper text) */}
          <div className="space-y-1.5">
            <label
              htmlFor="acc-phone"
              className="block text-xs font-medium text-theme-secondary"
            >
              Mobile Number
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-theme-muted">
                <Phone className="size-4" />
              </div>
              <input
                id="acc-phone"
                type="text"
                value={phone}
                disabled
                readOnly
                aria-readonly="true"
                className="w-full h-12 rounded-xl border border-theme-border/60 bg-theme-card-subtle/50 pl-10 pr-3 text-sm font-mono text-theme-muted cursor-not-allowed select-none opacity-80"
              />
            </div>
          </div>

          {/* 3. Email Address Field (Editable) */}
          <div className="space-y-1.5">
            <label
              htmlFor="acc-email"
              className="block text-xs font-medium text-theme-secondary"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-theme-muted">
                <Mail className="size-4" />
              </div>
              <input
                id="acc-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (generalError) setGeneralError(null);
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder="alex.morgan@domain.com"
                className={cn(
                  'w-full h-12 rounded-xl border bg-theme-input pl-10 pr-3 text-sm text-theme-primary font-sans transition-all placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500',
                  showEmailError ? 'border-rose-500 bg-rose-500/5' : 'border-theme-border'
                )}
              />
            </div>
            {showEmailError && (
              <p className="text-[11px] font-medium text-rose-400 pl-1">
                Please enter a valid email address.
              </p>
            )}
          </div>

          {/* Privacy Footnote */}
          <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-theme-muted">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
            <span>Profile updates are encrypted locally on your device.</span>
          </div>

          {/* Bottom Primary CTA */}
          <div className="pt-2 pb-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex w-full h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all active:scale-[0.97]',
                isSubmitting && 'opacity-[0.38] pointer-events-none'
              )}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
