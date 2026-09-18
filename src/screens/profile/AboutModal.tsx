import React from 'react';
import { ArrowLeft, Shield, Lock, Cpu, Sparkles, Globe, ExternalLink, Code2 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-theme-elevated mx-auto max-w-[390px] overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-theme-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>

        <span className="text-sm font-bold text-theme-primary">
          About
        </span>

        <div className="size-9" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-6 space-y-6">
        {/* App Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg ring-4 ring-violet-500/15">
            <Shield className="size-8" />
          </div>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-theme-primary">
            Finance Tracker
          </h2>
          <span className="text-xs font-mono text-violet-400 mt-0.5">
            v1.0.0 (Release Build)
          </span>
          <p className="mt-2 text-xs text-theme-secondary max-w-[280px] leading-relaxed">
            Privacy-first personal finance application with zero cloud tracking and zero-knowledge local storage.
          </p>
        </div>

        {/* Pillars / Architecture */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
            System Pillars
          </span>

          <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border">
            <div className="flex items-start gap-3 p-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Lock className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-theme-primary">
                  100% Zero-Knowledge
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5 leading-relaxed">
                  Financial transactions and balances never leave your device. Encrypted locally with AES-256.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mt-0.5">
                <Cpu className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-theme-primary">
                  Integer Money Engine
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5 leading-relaxed">
                  All calculations strictly use 64-bit integer minor units (paise) to completely eliminate floating-point drift.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mt-0.5">
                <Sparkles className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-theme-primary">
                  On-Device SMS Parser
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5 leading-relaxed">
                  Fast regex matching for Indian banking transaction SMS with automated category tagging.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Section */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
            Developer
          </span>

          <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-violet-400 text-white font-bold text-sm shadow-md ring-2 ring-violet-500/20">
                KC
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-sm font-semibold tracking-tight text-theme-primary">
                  Kritagya Singh Chouhan
                </h4>
                <p className="text-[11px] text-violet-400 font-medium font-mono mt-0.5">
                  Full Stack Software Developer
                </p>
                <p className="text-[10px] text-theme-muted">
                  Golang • Java • React • Three.js • GenAI
                </p>
              </div>
            </div>

            <p className="text-xs text-theme-secondary leading-relaxed">
              Crafting high-performance web systems, distributed Golang/Java backends, 3D interactive experiences, and privacy-first local mobile applications.
            </p>

            {/* Links */}
            <div className="flex flex-col gap-2 pt-1 border-t border-theme-border">
              <a
                href="https://kritagya20.github.io/portfolio-website-react/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-theme-border bg-theme-card-subtle hover:bg-theme-card-hover text-xs font-medium text-theme-primary group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                    <Globe className="size-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block text-theme-primary group-hover:text-violet-400 transition-colors">
                      View Portfolio
                    </span>
                    <span className="text-[10px] text-theme-muted font-mono">
                      kritagya20.github.io/portfolio-website-react
                    </span>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-theme-muted group-hover:text-violet-400 transition-colors" />
              </a>

              <a
                href="https://github.com/kritagya20"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-theme-border bg-theme-card-subtle hover:bg-theme-card-hover text-xs font-medium text-theme-primary group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                    <Code2 className="size-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold block text-theme-primary group-hover:text-sky-400 transition-colors">
                      GitHub Profile
                    </span>
                    <span className="text-[10px] text-theme-muted font-mono">
                      github.com/kritagya20
                    </span>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-theme-muted group-hover:text-sky-400 transition-colors" />
              </a>
            </div>

            {/* Copyright Tag */}
            <div className="pt-2 text-center border-t border-theme-border/50">
              <span className="text-[11px] font-mono text-theme-muted">
                Kritagya Singh Chouhan @{new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dismiss */}
      <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated border-t border-theme-border">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full h-12 items-center justify-center rounded-xl text-xs font-semibold text-theme-primary bg-theme-card-subtle border border-theme-border hover:bg-theme-card active:scale-[0.97] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
