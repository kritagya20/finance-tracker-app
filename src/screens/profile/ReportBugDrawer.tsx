import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Bug,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useDrawerDragToDismiss } from '../../hooks/useDrawerDragToDismiss';
import { submitBugReport } from '../../services/BugReportService';
import { cn } from '../../lib/utils';

interface ReportBugDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const ReportBugDrawer: React.FC<ReportBugDrawerProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  // Form State
  const [featureName, setFeatureName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Field Touched states for blur-only validation (Fintech UX invariant)
  const [featureTouched, setFeatureTouched] = useState(false);
  const [remarksTouched, setRemarksTouched] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { dragHandleProps, sheetStyle, backdropStyle } = useDrawerDragToDismiss({
    onClose,
    enabled: !isSubmitting,
  });

  if (!isOpen) return null;

  // Validation Rules
  const MAX_FEATURE_LENGTH = 50;
  const MAX_REMARKS_LENGTH = 500;
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  const isFeatureValid = featureName.trim().length >= 2 && featureName.trim().length <= MAX_FEATURE_LENGTH;
  const isRemarksValid = remarks.trim().length >= 5 && remarks.trim().length <= MAX_REMARKS_LENGTH;

  const showFeatureError = (featureTouched || hasSubmitted) && !isFeatureValid;
  const showRemarksError = (remarksTouched || hasSubmitted) && !isRemarksValid;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScreenshotError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check MIME type
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please select a valid image file (PNG, JPEG, or WebP).');
      return;
    }

    // Check size limit (max 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setScreenshotError(`Screenshot size (${sizeMB}MB) exceeds the 5MB limit.`);
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setFeatureTouched(true);
    setRemarksTouched(true);

    if (!isFeatureValid || !isRemarksValid || screenshotError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitBugReport({
        featureName: featureName.trim(),
        remarks: remarks.trim(),
        screenshotBase64: screenshotPreview || undefined,
        screenshotName: screenshotFile?.name,
        screenshotSize: screenshotFile?.size,
      });

      setSubmittedReportId(result.reportId);
      if (onShowToast) {
        onShowToast(`Bug report #${result.reportId} sent to support server`);
      }
    } catch (err) {
      console.error('Failed to submit bug report:', err);
      setScreenshotError('Failed to submit report. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setFeatureName('');
    setRemarks('');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setFeatureTouched(false);
    setRemarksTouched(false);
    setScreenshotError(null);
    setHasSubmitted(false);
    setSubmittedReportId(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleResetAndClose}
        aria-hidden="true"
        style={backdropStyle}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Bottom Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-bug-title"
        style={sheetStyle}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[390px] rounded-t-3xl bg-theme-elevated border-t border-theme-border shadow-2xl max-h-[92vh] flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag Area (Pull Handle & Navigation Bar) */}
        <div {...dragHandleProps} className="touch-none select-none cursor-grab active:cursor-grabbing shrink-0">
          {/* Pull Handle */}
          <div className="w-full pt-2.5 pb-1 flex items-center justify-center">
            <div className="w-9 h-1 rounded-full bg-slate-600/40 shrink-0" />
          </div>

          {/* Top Header with Single ArrowLeft (Navigation Invariant) */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-theme-border/40">
            <button
              type="button"
              onClick={handleResetAndClose}
              aria-label="Back"
              className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>

            <span id="report-bug-title" className="text-sm font-bold text-theme-primary pointer-events-none">
              Report a Bug
            </span>

            <div className="size-9 pointer-events-none" />
          </div>
        </div>

        {/* Form Body / Success Confirmation */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4">
          {submittedReportId ? (
            /* Success State */
            <div className="flex flex-col items-center text-center py-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-theme-primary">
                  Bug Report Dispatched
                </h3>
                <p className="text-xs text-theme-secondary mt-1 max-w-[280px] leading-relaxed">
                  Thank you! Your issue report has been transmitted to our engineering team.
                </p>
              </div>

              <div className="w-full p-3 rounded-xl bg-theme-card-subtle border border-theme-border flex items-center justify-between">
                <span className="text-xs text-theme-muted">Reference ID</span>
                <span className="text-xs font-mono font-semibold text-theme-primary">
                  {submittedReportId}
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full h-12 mt-4 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 active:scale-[0.97] transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4 pb-6">
              {/* Feature / Screen Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="bug-feature"
                    className="block text-xs font-medium text-theme-secondary"
                  >
                    Feature / Screen Name <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-theme-muted">
                    {featureName.length}/{MAX_FEATURE_LENGTH}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="bug-feature"
                    type="text"
                    value={featureName}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_FEATURE_LENGTH) {
                        setFeatureName(e.target.value);
                      }
                    }}
                    onBlur={() => setFeatureTouched(true)}
                    placeholder="e.g. Activity Feed, Add Transaction, Analytics"
                    className={cn(
                      'w-full h-11 rounded-xl border bg-theme-input px-3.5 text-xs text-theme-primary placeholder:text-theme-muted transition-all outline-none',
                      showFeatureError
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-theme-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                    )}
                  />
                </div>

                {showFeatureError && (
                  <p className="text-[11px] font-medium text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>Please enter a feature name (2 to 50 characters).</span>
                  </p>
                )}
              </div>

              {/* Remarks / Bug Description Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="bug-remarks"
                    className="block text-xs font-medium text-theme-secondary"
                  >
                    Remarks / Bug Details <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-theme-muted">
                    {remarks.length}/{MAX_REMARKS_LENGTH}
                  </span>
                </div>

                <textarea
                  id="bug-remarks"
                  rows={4}
                  value={remarks}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_REMARKS_LENGTH) {
                      setRemarks(e.target.value);
                    }
                  }}
                  onBlur={() => setRemarksTouched(true)}
                  placeholder="Describe what happened, steps to reproduce, or what you expected to see..."
                  className={cn(
                    'w-full rounded-xl border bg-theme-input p-3 text-xs text-theme-primary placeholder:text-theme-muted transition-all outline-none resize-none',
                    showRemarksError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-theme-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20'
                  )}
                />

                {showRemarksError && (
                  <p className="text-[11px] font-medium text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>Please provide bug details (5 to 500 characters).</span>
                  </p>
                )}
              </div>

              {/* Optional Screenshot Attachment */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-theme-secondary">
                    Screenshot <span className="text-theme-muted">(Optional — Max 5MB)</span>
                  </label>
                  {screenshotFile && (
                    <span className="text-[10px] font-mono text-theme-muted">
                      {(screenshotFile.size / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!screenshotPreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full p-4 rounded-xl border border-dashed border-theme-border hover:border-violet-500/50 bg-theme-input/40 transition-colors group cursor-pointer"
                  >
                    <UploadCloud className="size-6 text-theme-muted group-hover:text-violet-400 transition-colors mb-1.5" />
                    <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                      Attach Screenshot
                    </span>
                    <span className="text-[10px] text-theme-muted mt-0.5">
                      PNG, JPEG, WebP up to 5MB
                    </span>
                  </button>
                ) : (
                  <div className="relative flex items-center justify-between p-2.5 rounded-xl border border-theme-border bg-theme-input">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot Preview"
                        className="size-12 rounded-lg object-cover border border-theme-border shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-theme-primary truncate">
                          {screenshotFile?.name}
                        </span>
                        <span className="text-[10px] text-theme-muted font-mono">
                          {screenshotFile && `${(screenshotFile.size / 1024).toFixed(0)} KB`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      aria-label="Remove screenshot"
                      className="flex size-8 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}

                {screenshotError && (
                  <p className="text-[11px] font-medium text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{screenshotError}</span>
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFeatureValid || !isRemarksValid || isSubmitting}
                  className={cn(
                    'w-full h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 active:scale-[0.97] transition-all',
                    (!isFeatureValid || !isRemarksValid || isSubmitting) && 'opacity-[0.38] pointer-events-none'
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Sending to Server...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Bug className="size-4" />
                      <span>Submit Bug Report</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};
