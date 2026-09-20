import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Bug, ChevronRight } from 'lucide-react';
import { ReportBugDrawer } from './ReportBugDrawer';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [isReportBugOpen, setIsReportBugOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex flex-col bg-theme-elevated mx-auto max-w-[390px] overflow-hidden select-none animate-in fade-in duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-theme-border/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>

          <span className="text-sm font-bold text-theme-primary">
            Support & Guidance
          </span>

          <div className="size-9" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-4">
          {/* Banner */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-violet-500/10 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-theme-primary">
                  100% Zero-Knowledge & Local
                </h4>
                <p className="mt-1 text-[11px] text-theme-secondary leading-relaxed">
                  Your financial data never touches external clouds. All SMS parsing and vault entries remain securely on your device.
                </p>
              </div>
            </div>
          </div>

          {/* Common Help Topics */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted">
              Frequently Asked Questions
            </span>

            <div className="rounded-2xl border border-theme-border bg-theme-card divide-y divide-theme-border/60">
              <div className="p-3.5">
                <p className="text-xs font-semibold text-theme-primary">
                  How does SMS auto-capture work?
                </p>
                <p className="mt-1 text-[11px] text-theme-secondary leading-relaxed">
                  The local parser inspects incoming bank SMS alerts matching Indian banks (HDFC, ICICI, SBI) and records the transaction automatically with zero cloud dependency.
                </p>
              </div>

              <div className="p-3.5">
                <p className="text-xs font-semibold text-theme-primary">
                  How do I add custom categories or bank cards?
                </p>
                <p className="mt-1 text-[11px] text-theme-secondary leading-relaxed">
                  Go to Profile → Categories or Payment Options, tap &quot;Add&quot;, customize the name, icon, and colors, and tap Save.
                </p>
              </div>

              <div className="p-3.5">
                <p className="text-xs font-semibold text-theme-primary">
                  Where is my data stored?
                </p>
                <p className="mt-1 text-[11px] text-theme-secondary leading-relaxed">
                  In your browser&apos;s encrypted Local Vault. You can download an encrypted JSON/CSV backup anytime from Settings.
                </p>
              </div>
            </div>
          </div>

          {/* Report a Bug Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsReportBugOpen(true)}
              className="flex w-full items-center justify-between p-3.5 rounded-2xl border border-theme-border bg-theme-card hover:bg-theme-card-hover transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-105 transition-transform">
                  <Bug className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                    Report a Bug
                  </p>
                  <p className="text-[10px] text-theme-muted">
                    Submit issue directly with screenshots & remarks
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
            </button>
          </div>
        </div>

        {/* Bottom Dismiss */}
        <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 backdrop-blur-xs border-t border-theme-border/50">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full h-12 items-center justify-center rounded-xl text-xs font-semibold text-theme-primary bg-theme-card-subtle border border-theme-border hover:bg-theme-card active:scale-[0.97] transition-all"
          >
            Close Support
          </button>
        </div>
      </div>

      {/* Report Bug Bottom Sheet Drawer */}
      <ReportBugDrawer
        isOpen={isReportBugOpen}
        onClose={() => setIsReportBugOpen(false)}
        onShowToast={onShowToast}
      />
    </>
  );
};
