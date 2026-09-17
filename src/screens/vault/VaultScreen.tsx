import React, { useState } from 'react';
import {
  Shield,
  Database,
  Lock,
  Download,
  Upload,
  AlertTriangle,
  LogOut,
  Edit3,
  RotateCcw,
  Target,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { Switch } from '../../components/ui/Switch';
import { UserProfile } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface VaultScreenProps {
  profile?: UserProfile | null;
  onEditProfile?: () => void;
  onResetData?: () => void;
  onLogout?: () => void;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({
  profile,
  onEditProfile,
  onResetData,
  onLogout,
}) => {
  const [autoDetect, setAutoDetect] = useState(true);
  const { themePreference, effectiveTheme, setThemePreference } = useTheme();

  const goalTitleMap: Record<string, string> = {
    SAVINGS_INVESTING: 'Grow Wealth',
    EMERGENCY_FUND: 'Safety Cushion',
    EXPENSE_CONTROL: 'Cut Overspending',
    DEBT_FREE: 'Debt Freedom',
  };

  const monthlySavingsTarget = profile
    ? Math.round((profile.monthlyIncome * profile.savingsTargetPercent) / 100)
    : 1700000;

  return (
    <div className="flex flex-col gap-5">
      {/* Screen-Specific Header */}
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500 dark:text-violet-400 border border-violet-500/20">
            <Shield className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-zinc-800 transition-colors shadow-sm"
          >
            <LogOut className="size-3.5 text-rose-500 dark:text-rose-400" />
            <span>Lock Vault</span>
          </button>
        )}
      </header>

      {/* 1. Appearance & Theme Selection (Default: System Device Theme) */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500 dark:text-violet-400">
              {themePreference === 'system' ? (
                <Laptop className="size-4" />
              ) : themePreference === 'light' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Appearance & Theme
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {themePreference === 'system'
                  ? `Device Default (${effectiveTheme === 'dark' ? 'Dark mode' : 'Light mode'} active)`
                  : themePreference === 'dark'
                  ? 'Dark mode active'
                  : 'Light mode active'}
              </p>
            </div>
          </div>
        </div>

        {/* 3-Way Segmented Theme Selector */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/60 dark:border-white/5">
          <button
            type="button"
            onClick={() => setThemePreference('system')}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-xs font-semibold transition-all',
              themePreference === 'system'
                ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <Laptop className="size-4" />
            <span className="text-[11px] leading-none">System</span>
            <span className="text-[9px] font-normal opacity-75">Default</span>
          </button>

          <button
            type="button"
            onClick={() => setThemePreference('light')}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-xs font-semibold transition-all',
              themePreference === 'light'
                ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <Sun className="size-4" />
            <span className="text-[11px] leading-none">Light</span>
            <span className="text-[9px] font-normal opacity-75">Day Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setThemePreference('dark')}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-xs font-semibold transition-all',
              themePreference === 'dark'
                ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <Moon className="size-4" />
            <span className="text-[11px] leading-none">Dark</span>
            <span className="text-[9px] font-normal opacity-75">Night Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Profile & Baseline Metrics */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-900/30">
              {(profile?.name || 'Alex Morgan').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {profile?.name || 'Alex Morgan'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {profile?.employmentType === 'SALARIED'
                  ? 'Salaried (Fixed Income)'
                  : profile?.employmentType === 'FREELANCE_BUSINESS'
                  ? 'Freelance / Business'
                  : 'Individual'}
              </p>
            </div>
          </div>

          {onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300 hover:bg-violet-500/20 transition-colors"
            >
              <Edit3 className="size-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Financial Metrics Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-transparent">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly In-Hand</p>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {formatCurrency(profile?.monthlyIncome || 8500000)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-transparent">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Target Savings</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              {profile?.savingsTargetPercent || 20}%{' '}
              <span className="text-[11px] font-normal text-slate-400">
                ({formatCurrency(monthlySavingsTarget)})
              </span>
            </p>
          </div>
        </div>

        {/* Priority Goal Badge */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/40 px-3 py-2 text-xs border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Target className="size-3.5 text-violet-500 dark:text-violet-400" />
            <span>Primary Focus</span>
          </div>
          <span className="font-semibold text-violet-600 dark:text-violet-300">
            {goalTitleMap[profile?.primaryGoal || 'SAVINGS_INVESTING'] || 'Grow Wealth'}
          </span>
        </div>
      </div>

      {/* 3. Zero Knowledge Banner */}
      <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Lock className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              100% On-Device & Zero-Knowledge
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
              Your financial records never leave this device. All calculations,
              budgets, and parsing rules are executed purely in client-side storage.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Local Storage Metrics */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="size-5 text-violet-500 dark:text-violet-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              Local Storage Engine
            </span>
          </div>
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-300">
            SQLite (OPFS) Ready
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-transparent">
            <p className="text-slate-500 dark:text-slate-400">Records Stored</p>
            <p className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">4 Transactions</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-transparent">
            <p className="text-slate-500 dark:text-slate-400">Space Consumed</p>
            <p className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">14.2 KB</p>
          </div>
        </div>
      </div>

      {/* 5. Auto Feed Settings */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">Auto-Feed & Ingestion</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-200">SMS / Bank Detection</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Parse financial SMS and statements locally
            </p>
          </div>
          <Switch
            checked={autoDetect}
            onCheckedChange={setAutoDetect}
            ariaLabel="SMS / Bank Detection"
          />
        </div>
      </div>

      {/* 6. Backup & Portability */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-sm">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">Backup & Export</p>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Download className="size-4 text-violet-500 dark:text-violet-400" />
            Export Encrypted Vault (.vault)
          </span>
          <span className="text-[10px] text-slate-400">AES-256</span>
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Upload className="size-4 text-emerald-500 dark:text-emerald-400" />
            Restore from Backup File
          </span>
          <span className="text-[10px] text-slate-400">Import</span>
        </button>
      </div>

      {/* 7. Danger Zone */}
      <div className="pt-2 space-y-2">
        {onResetData && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all transactions and profiles to pristine initial seed data?')) {
                onResetData();
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-3 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <RotateCcw className="size-4" />
            Reset to Default Seed Data
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to purge all on-device data? This will clear local storage.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          <AlertTriangle className="size-4" />
          Purge All On-Device Data
        </button>
      </div>
    </div>
  );
};
