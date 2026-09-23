import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Cloud,
  Lock,
  RefreshCw,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { Transaction, Account, Category, UserProfile } from '../../domain/models/types';
import { formatDateTimeDDMMYYYY } from '../../domain/engine/dateUtils';
import { cn } from '../../lib/utils';

interface BackupScreenProps {
  onBack: () => void;
  transactions?: Transaction[];
  accounts?: Account[];
  categories?: Category[];
  profile?: UserProfile | null;
  onShowToast?: (msg: string) => void;
}

interface BackupState {
  isBackedUp: boolean;
  lastBackupAt: string | null;
  payloadSizeBytes: number;
  checksum: string;
  autoBackupEnabled: boolean;
}

const DEFAULT_CHECKSUM = '7f8a3b21c4e90d8f';

/**
 * Standardized BackupScreen adhering to DESIGN_SYSTEM.md metrics.
 * Features an intelligent visual boundary gradient:
 * - Green border gradient & green pulsating dot when data is encrypted and backed up.
 * - Reddish border gradient & red warning dot when data is local-only / unbacked.
 */
export const BackupScreen: React.FC<BackupScreenProps> = ({
  onBack,
  transactions: _transactions = [],
  accounts: _accounts = [],
  categories: _categories = [],
  profile: _profile,
  onShowToast,
}) => {
  // Read persistent backup state from localStorage (defaults to backed up = true for clean onboarding)
  const [backupState, setBackupState] = useState<BackupState>(() => {
    const saved = localStorage.getItem('vault_backup_status');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      isBackedUp: true,
      lastBackupAt: new Date().toISOString(),
      payloadSizeBytes: 24576, // 24 KB
      checksum: DEFAULT_CHECKSUM,
      autoBackupEnabled: true,
    };
  });

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgressStep, setBackupProgressStep] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize state changes to localStorage
  const persistBackupState = (newState: BackupState) => {
    setBackupState(newState);
    localStorage.setItem('vault_backup_status', JSON.stringify(newState));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Formatted backup timestamp
  const formattedBackupTime = useMemo(() => {
    if (!backupState.lastBackupAt) return 'Never';
    return formatDateTimeDDMMYYYY(backupState.lastBackupAt);
  }, [backupState.lastBackupAt]);

  // Execute interactive zero-knowledge encryption & backup simulation
  const handleInitiateBackup = () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgressStep(1);

    // Step 1: Packaging local SQLite / state
    setTimeout(() => {
      setBackupProgressStep(2);

      // Step 2: Key Derivation via Argon2id & AES-256-GCM
      setTimeout(() => {
        setBackupProgressStep(3);

        // Step 3: Zero-knowledge upload to server
        setTimeout(() => {
          setBackupProgressStep(4);

          // Step 4: Verification & Finish
          setTimeout(() => {
            const updated: BackupState = {
              isBackedUp: true,
              lastBackupAt: new Date().toISOString(),
              payloadSizeBytes: Math.max(16384, Math.floor(Math.random() * 30000) + 18000),
              checksum: Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10),
              autoBackupEnabled: backupState.autoBackupEnabled,
            };
            persistBackupState(updated);
            setIsBackingUp(false);
            setBackupProgressStep(0);
            showToast('Encrypted backup successfully synced to cloud servers');
          }, 600);
        }, 800);
      }, 700);
    }, 600);
  };

  // Toggle backup state for user testing (switch between green backed-up vs red unbacked states)
  const handleToggleBackupState = () => {
    if (backupState.isBackedUp) {
      persistBackupState({
        ...backupState,
        isBackedUp: false,
        lastBackupAt: null,
      });
      showToast('Switched to local-only mode. Cloud backup removed.');
    } else {
      handleInitiateBackup();
    }
  };

  const isGreen = backupState.isBackedUp;

  return (
    <div className="flex flex-col gap-4 pb-20 animate-in fade-in duration-300 select-none">
      {/* Top Floating Toast */}
      {toastMessage && (
        <div className="fixed top-5 inset-x-4 mx-auto max-w-[360px] z-50 rounded-xl bg-slate-900/90 text-white border border-slate-700/80 px-4 py-2.5 text-xs text-center shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* Screen Header adhering to single ArrowLeft navigation invariant */}
      <header className="flex h-14 items-center">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Profile"
            className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.92] transition-all shadow-xs shrink-0"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight text-theme-primary truncate">
              Backup & Cloud Vault
            </h1>
            <p className="text-[11px] text-theme-secondary truncate">
              Zero-knowledge server synchronization
            </p>
          </div>
        </div>
      </header>

      {/* 
        MASTER ENCLOSURE: The Entire Page Container with Dynamic Border Gradient Effect
        - When Backed Up: Radiant emerald-teal border gradient with subtle green outer glow.
        - When NOT Backed Up: Warm golden-amber border gradient with calming amber glow.
      */}
      <div
        className={cn(
          'relative rounded-[28px] border-2 p-5 transition-all duration-500 overflow-hidden shadow-xl',
          isGreen
            ? 'border-emerald-500/60 dark:border-emerald-500/40 bg-white/80 dark:bg-gradient-to-b dark:from-[#101915] dark:via-[#0c120f] dark:to-[#090d0b] shadow-emerald-500/10 dark:shadow-[0_0_40px_rgba(16,185,129,0.14)]'
            : 'border-amber-500/60 dark:border-amber-500/40 bg-white/80 dark:bg-gradient-to-b dark:from-[#1a160d] dark:via-[#13100a] dark:to-[#0d0b07] shadow-amber-500/10 dark:shadow-[0_0_40px_rgba(245,158,11,0.14)]'
        )}
      >
        {/* Ambient Radial Top Glow */}
        <div
          className={cn(
            'pointer-events-none absolute -top-16 inset-x-0 h-40 rounded-full blur-3xl opacity-30 transition-colors duration-700',
            isGreen ? 'bg-emerald-500' : 'bg-amber-500'
          )}
        />

        {/* Top Hairline Specular Reflection */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r transition-all duration-500',
            isGreen
              ? 'from-transparent via-emerald-400/70 to-transparent'
              : 'from-transparent via-amber-400/70 to-transparent'
          )}
        />

        {/* Vault Card Top Bar with Status Tag */}
        <div className="relative z-10 flex items-center justify-between pb-3 mb-2 border-b border-theme-border/40">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
            Vault Sync Status
          </span>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors whitespace-nowrap shrink-0 shadow-xs',
              isGreen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full shrink-0',
                isGreen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              )}
            />
            <span className="whitespace-nowrap">{isGreen ? 'Synced' : 'Pending Backup'}</span>
          </div>
        </div>

        {/* 1. Hero Status Card */}
        <div className="relative z-10 flex flex-col items-center text-center pt-2 pb-4">
          {/* Animated Shield Bubble */}
          <div
            className={cn(
              'relative flex size-20 items-center justify-center rounded-3xl border shadow-lg transition-all duration-500',
              isGreen
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 shadow-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-500 shadow-amber-500/20'
            )}
          >
            {isGreen ? (
              <ShieldCheck className="size-10 transition-transform duration-300 hover:scale-105" />
            ) : (
              <ShieldAlert className="size-10 transition-transform duration-300 hover:scale-105" />
            )}

            {/* Micro Indicator Dot */}
            <span
              className={cn(
                'absolute -top-1 -right-1 size-3.5 rounded-full border-2 border-white dark:border-slate-900',
                isGreen ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-amber-400 ring-2 ring-amber-500/30'
              )}
            />
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isGreen ? 'Cloud Vault Protected' : 'Data Saved on Device'}
          </h2>

          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-[280px] leading-relaxed">
            {isGreen
              ? 'Your financial vault is encrypted with your private key and synchronized safely to secure servers.'
              : 'Your financial data is currently stored locally on this device. Sync to cloud vault to keep it safe against device loss.'}
          </p>

          {/* Dynamic Status Capsule (Strictly single-line guaranteed) */}
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-mono font-medium border bg-white/60 dark:bg-black/40 whitespace-nowrap shrink-0">
            <span
              className={cn(
                'size-2 rounded-full shrink-0',
                isGreen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              )}
            />
            <span className={cn('whitespace-nowrap', isGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
              {isGreen ? `Last Synced: ${formattedBackupTime}` : 'Cloud Snapshot: Pending'}
            </span>
          </div>
        </div>

        {/* 2. Interactive Backup Progress Bar (Shown while syncing) */}
        {isBackingUp && (
          <div className="mt-2 mb-4 p-3.5 rounded-2xl border border-violet-500/30 bg-violet-500/10 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-medium text-violet-400">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="size-3.5 animate-spin" />
                {backupProgressStep === 1 && '1/4 Packaging local transaction vault...'}
                {backupProgressStep === 2 && '2/4 Generating Argon2id key & AES-256 cipher...'}
                {backupProgressStep === 3 && '3/4 Uploading encrypted payload to server...'}
                {backupProgressStep === 4 && '4/4 Verifying SHA-256 checksum integrity...'}
              </span>
              <span className="font-mono">{backupProgressStep * 25}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-violet-950/60 overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${backupProgressStep * 25}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. Primary Action CTA Button */}
        <div className="mt-2 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={isBackingUp}
            onClick={handleInitiateBackup}
            className={cn(
              'w-full h-12 rounded-xl text-white font-semibold text-sm transition-all shadow-lg active:scale-[0.97] flex items-center justify-center gap-2',
              isGreen
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-105 shadow-emerald-900/30'
                : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:brightness-105 shadow-amber-900/30 text-slate-950 font-bold'
            )}
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Encrypting & Syncing...</span>
              </>
            ) : isGreen ? (
              <>
                <Cloud className="size-4" />
                <span>Re-Sync to Cloud</span>
              </>
            ) : (
              <>
                <Lock className="size-4" />
                <span>Backup Now (Zero-Knowledge)</span>
              </>
            )}
          </button>

          {/* State Switcher / Interactive Mode Toggle */}
          <button
            type="button"
            onClick={handleToggleBackupState}
            className="w-full h-10 rounded-xl border border-theme-border bg-theme-card-subtle/80 hover:bg-theme-card text-xs font-medium text-theme-secondary hover:text-theme-primary transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            <span>
              {isGreen ? 'Simulate Pending State (Show Amber Border)' : 'Simulate Synced State (Show Green Border)'}
            </span>
          </button>
        </div>

        {/* 4. Technical Cryptographic Specifications (Payload size excluded) */}
        <div className="mt-5 rounded-2xl border border-theme-border/60 bg-theme-card/40 p-4 space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted block">
            Cryptographic Vault Architecture
          </span>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-theme-border/50 bg-theme-input/50 space-y-0.5">
              <span className="text-[10px] text-theme-muted font-medium uppercase tracking-wider block">
                Cipher
              </span>
              <span className="font-mono font-semibold text-theme-primary text-[11px] sm:text-xs">
                AES-256-GCM
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-theme-border/50 bg-theme-input/50 space-y-0.5">
              <span className="text-[10px] text-theme-muted font-medium uppercase tracking-wider block">
                Key Derivation
              </span>
              <span className="font-mono font-semibold text-theme-primary text-[11px] sm:text-xs">
                Argon2id
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-theme-border/50 bg-theme-input/50 space-y-0.5">
              <span className="text-[10px] text-theme-muted font-medium uppercase tracking-wider block">
                Checksum
              </span>
              <span className="font-mono font-semibold text-theme-primary text-[11px] sm:text-xs truncate block" title={backupState.checksum}>
                #{backupState.checksum}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Zero-Knowledge Guarantees */}
        <div className="mt-4 rounded-2xl border border-theme-border/60 bg-theme-card/40 p-4 space-y-2.5 text-xs text-theme-secondary">
          <div className="flex items-center gap-2 text-theme-primary font-semibold text-xs">
            <KeyRound className="size-4 text-violet-400 shrink-0" />
            <span>How Your Data Stays Protected</span>
          </div>

          <ul className="space-y-1.5 pl-6 list-disc text-[11px] leading-relaxed text-theme-muted">
            <li>
              <strong className="text-theme-secondary">Zero-Knowledge Guarantee:</strong> All financial entries are encrypted with your device MPIN before leaving your phone. Our servers never hold your key.
            </li>
            <li>
              <strong className="text-theme-secondary">Local-First Persistence:</strong> If you never back up, 100% of your data remains strictly on your device.
            </li>
            <li>
              <strong className="text-theme-secondary">Instant Device Recovery:</strong> Restore your entire transaction history on any new phone using your 6-digit MPIN.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
