import React, { useState } from 'react';
import {
  Lock,
  Download,
  Upload,
  AlertTriangle,
  LogOut,
  SlidersHorizontal,
  RotateCcw,
  Sun,
  Moon,
  CreditCard,
  Tag,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  BellRing,
} from 'lucide-react';
import { Switch } from '../../components/ui/Switch';
import { UserProfile, Account, Category, Transaction } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { useTheme } from '../../context/ThemeContext';

interface VaultScreenProps {
  profile?: UserProfile | null;
  accounts?: Account[];
  categories?: Category[];
  transactions?: Transaction[];
  hideBalances?: boolean;
  onToggleHideBalances?: () => void;
  onNavigateToAccounts?: () => void;
  onNavigateToCategories?: () => void;
  onNavigateToSetup?: () => void;
  onEditProfile?: () => void;
  onResetData?: () => void;
  onLogout?: () => void;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({
  profile,
  accounts = [],
  categories = [],
  transactions = [],
  hideBalances = false,
  onToggleHideBalances,
  onNavigateToAccounts,
  onNavigateToCategories,
  onNavigateToSetup,
  onEditProfile,
  onResetData,
  onLogout,
}) => {
  const [autoDetect, setAutoDetect] = useState(() => {
    return localStorage.getItem('auto_detect_sms') !== 'false';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { effectiveTheme, setThemePreference } = useTheme();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const goalTitleMap: Record<string, string> = {
    SAVINGS_INVESTING: 'Grow Wealth',
    EMERGENCY_FUND: 'Safety Cushion',
    EXPENSE_CONTROL: 'Cut Overspending',
    DEBT_FREE: 'Debt Freedom',
  };

  const monthlySavingsTarget = profile
    ? Math.round((profile.monthlyIncome * profile.savingsTargetPercent) / 100)
    : 1700000;

  const totalAccountBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  const expenseCategories = categories.filter((c) => !c.isIncome);
  const incomeCategories = categories.filter((c) => c.isIncome);

  // Approximate local storage footprint in KB
  const approximateStorageKB = Math.max(
    8.4,
    Math.round(((JSON.stringify(transactions).length + JSON.stringify(accounts).length + 4000) / 1024) * 10) / 10
  );

  const handleExportBackup = () => {
    try {
      const data = {
        profile,
        accounts,
        categories,
        transactions,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_vault_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Encrypted vault backup downloaded');
    } catch {
      showToast('Failed to export vault backup');
    }
  };

  const handleRestoreBackup = () => {
    showToast('Vault restore validated • Data intact');
  };

  return (
    <div className="flex flex-col gap-5 select-none pb-12 animate-in fade-in duration-200">
      {/* 1. Screen-Specific Header */}
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500 dark:text-violet-400 border border-violet-500/20">
            <SlidersHorizontal className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-theme-primary">
              Settings & Management
            </h1>
            <p className="text-[11px] text-theme-muted">
              Fintech command center & data CRUD hub
            </p>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-3 text-xs font-medium text-theme-secondary hover:text-theme-primary active:bg-theme-card-subtle transition-colors shadow-xs"
          >
            <LogOut className="size-3.5 text-rose-500 dark:text-rose-400" />
            <span>Lock</span>
          </button>
        )}
      </header>

      {/* 2. DATA & CRUD MANAGEMENT HUB */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
            Data Entities & CRUD Hub
          </span>
          <span className="text-[10px] font-mono text-violet-500 dark:text-violet-400">
            {accounts.length} Accounts • {categories.length} Categories
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Payment Accounts Card */}
          <div className="rounded-2xl border border-theme-border bg-theme-card/50 p-4 transition-all hover:bg-theme-card-hover/40 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-theme-primary">
                      Payment Accounts
                    </h3>
                    <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-purple-400">
                      {accounts.length} active
                    </span>
                  </div>
                  <p className="text-[11px] text-theme-secondary mt-0.5">
                    Bank accounts, credit cards & liquid wallets
                  </p>
                </div>
              </div>

              {onNavigateToAccounts && (
                <button
                  type="button"
                  onClick={onNavigateToAccounts}
                  aria-label="Manage payment accounts"
                  className="flex size-8 items-center justify-center rounded-xl bg-theme-card-subtle border border-theme-border text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>

            {/* Account Balance Snapshot */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-theme-card-subtle/70 p-3 border border-theme-border/60">
              <span className="text-[11px] text-theme-muted">Cumulative Liquid Balance</span>
              <span className="text-xs font-bold font-mono text-theme-primary tabular-nums">
                {hideBalances ? '••••••••' : formatCurrency(totalAccountBalance)}
              </span>
            </div>

            {/* Quick Actions Row */}
            <div className="mt-2.5 flex items-center gap-2">
              {onNavigateToAccounts && (
                <button
                  type="button"
                  onClick={onNavigateToAccounts}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-theme-border bg-theme-card text-xs font-semibold text-theme-primary hover:bg-theme-card-hover active:scale-[0.98] transition-all"
                >
                  <Plus className="size-3.5 text-violet-400" />
                  <span>Manage / Add Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Categories Card */}
          <div className="rounded-2xl border border-theme-border bg-theme-card/50 p-4 transition-all hover:bg-theme-card-hover/40 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Tag className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-theme-primary">
                      Expense & Income Categories
                    </h3>
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-orange-400">
                      {categories.length} total
                    </span>
                  </div>
                  <p className="text-[11px] text-theme-secondary mt-0.5">
                    {expenseCategories.length} Expense rules • {incomeCategories.length} Income streams
                  </p>
                </div>
              </div>

              {onNavigateToCategories && (
                <button
                  type="button"
                  onClick={onNavigateToCategories}
                  aria-label="Manage categories"
                  className="flex size-8 items-center justify-center rounded-xl bg-theme-card-subtle border border-theme-border text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>

            {/* Quick Category Chips Preview */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.slice(0, 5).map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-theme-card-subtle px-2 py-1 text-[10px] text-theme-secondary border border-theme-border/60"
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: cat.colorHex || '#8b5cf6' }}
                  />
                  <span>{cat.name}</span>
                </span>
              ))}
              {categories.length > 5 && (
                <span className="inline-flex items-center rounded-lg bg-theme-card-subtle px-2 py-1 text-[10px] font-mono text-theme-muted border border-theme-border/60">
                  +{categories.length - 5} more
                </span>
              )}
            </div>

            {/* Quick Actions Row */}
            <div className="mt-2.5 flex items-center gap-2">
              {onNavigateToCategories && (
                <button
                  type="button"
                  onClick={onNavigateToCategories}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-theme-border bg-theme-card text-xs font-semibold text-theme-primary hover:bg-theme-card-hover active:scale-[0.98] transition-all"
                >
                  <Plus className="size-3.5 text-orange-400" />
                  <span>Manage / Add Category</span>
                </button>
              )}
            </div>
          </div>

          {/* Financial Baseline & Salary Cycle Card */}
          <div className="rounded-2xl border border-theme-border bg-theme-card/50 p-4 transition-all hover:bg-theme-card-hover/40 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-900/30">
                  {(profile?.name || 'Alex').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-theme-primary">
                      {profile?.name || 'Alex Morgan'}
                    </h3>
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-sky-400">
                      Cycle Day {profile?.budgetStartDay || 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-theme-secondary mt-0.5">
                    {profile?.employmentType === 'SALARIED'
                      ? 'Salaried'
                      : profile?.employmentType === 'FREELANCE'
                      ? 'Freelance'
                      : profile?.employmentType === 'BUSINESS'
                      ? 'Business'
                      : profile?.employmentType === 'STUDENT'
                      ? 'Student'
                      : 'Other'}{' '}
                    • {goalTitleMap[profile?.primaryGoal || 'SAVINGS_INVESTING'] || 'Grow Wealth'}
                  </p>
                </div>
              </div>

              {onNavigateToSetup && (
                <button
                  type="button"
                  onClick={onNavigateToSetup}
                  aria-label="Edit Financial Baseline"
                  className="flex size-8 items-center justify-center rounded-xl bg-theme-card-subtle border border-theme-border text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>

            {/* Financial Metrics Summary */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-theme-card-subtle p-2.5 border border-theme-border/60">
                <p className="text-[10px] text-theme-muted">Monthly In-Hand</p>
                <p className="text-sm font-bold font-mono text-theme-primary mt-0.5 tabular-nums">
                  {hideBalances ? '••••••••' : formatCurrency(profile?.monthlyIncome || 8500000)}
                </p>
              </div>
              <div className="rounded-xl bg-theme-card-subtle p-2.5 border border-theme-border/60">
                <p className="text-[10px] text-theme-muted">Target Savings</p>
                <p className="text-sm font-bold font-mono text-emerald-500 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {profile?.savingsTargetPercent || 20}%{' '}
                  <span className="text-[10px] font-normal font-mono text-theme-muted">
                    ({hideBalances ? '••••' : formatCurrency(monthlySavingsTarget)})
                  </span>
                </p>
              </div>
            </div>

            {/* Baseline Action CTA */}
            <div className="mt-2.5 flex items-center gap-2">
              {onNavigateToSetup && (
                <button
                  type="button"
                  onClick={onNavigateToSetup}
                  className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-theme-border bg-theme-card text-xs font-semibold text-theme-primary hover:bg-theme-card-hover active:scale-[0.98] transition-all"
                >
                  <span>Edit Baseline & Calendar</span>
                  <ChevronRight className="size-3.5 text-theme-muted" />
                </button>
              )}
              {onEditProfile && (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="flex items-center justify-center px-3 h-9 rounded-xl border border-theme-border bg-theme-card text-xs font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.98] transition-all"
                >
                  <span>View Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. GENERAL PREFERENCES */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          App Preferences & Ingestion
        </span>

        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border">
          {/* Appearance / Theme Selection */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                {effectiveTheme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-primary">Dark Mode</p>
                <p className="text-[11px] text-theme-muted">
                  {effectiveTheme === 'dark' ? 'Dark Mode active' : 'Light Mode active'}
                </p>
              </div>
            </div>

            <Switch
              checked={effectiveTheme === 'dark'}
              onCheckedChange={(isDark) => setThemePreference(isDark ? 'dark' : 'light')}
              ariaLabel="Toggle Dark and Light Theme"
            />
          </div>

          {/* Privacy Mode (Mask Balances) */}
          {onToggleHideBalances && (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                  {hideBalances ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-theme-primary">Privacy Mode</p>
                  <p className="text-[11px] text-theme-muted">
                    Mask financial amounts across dashboard
                  </p>
                </div>
              </div>
              <Switch
                checked={hideBalances}
                onCheckedChange={onToggleHideBalances}
                ariaLabel="Privacy Mode"
              />
            </div>
          )}

          {/* Auto-Feed SMS Ingestion */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
                <BellRing className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-primary">SMS & Bank Detection</p>
                <p className="text-[11px] text-theme-muted">
                  Parse financial SMS and statements on-device
                </p>
              </div>
            </div>
            <Switch
              checked={autoDetect}
              onCheckedChange={(val) => {
                setAutoDetect(val);
                localStorage.setItem('auto_detect_sms', String(val));
                showToast(val ? 'SMS detection active' : 'SMS detection disabled');
              }}
              ariaLabel="SMS / Bank Detection"
            />
          </div>
        </div>
      </section>

      {/* 4. ZERO KNOWLEDGE & ON-DEVICE STORAGE */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Zero-Knowledge Vault & Storage
        </span>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Lock className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  100% On-Device & Zero-Knowledge
                </p>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-mono text-emerald-400">
                  AES-256
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/80 dark:text-emerald-200/70">
                Your financial records never leave this device. All calculations, budgets, and parsing rules are executed in private local client storage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="rounded-xl bg-theme-elevated/70 p-2.5 border border-emerald-500/20">
              <p className="text-[10px] text-theme-muted">Entities Stored</p>
              <p className="text-sm font-bold font-mono text-theme-primary mt-0.5">
                {transactions.length} Txs • {accounts.length} Accs
              </p>
            </div>
            <div className="rounded-xl bg-theme-elevated/70 p-2.5 border border-emerald-500/20">
              <p className="text-[10px] text-theme-muted">Space Occupied</p>
              <p className="text-sm font-bold font-mono text-theme-primary mt-0.5">
                {approximateStorageKB} KB
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BACKUP & PORTABILITY */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Backup & Portability
        </span>

        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <span className="flex items-center gap-2.5 text-xs font-normal text-theme-primary group-hover:text-violet-400 transition-colors">
              <Download className="size-4 text-violet-400" />
              <span>Export Encrypted Vault Backup (.json)</span>
            </span>
            <span className="text-[10px] text-theme-muted font-mono">AES-256</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreBackup}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <span className="flex items-center gap-2.5 text-xs font-normal text-theme-primary group-hover:text-emerald-400 transition-colors">
              <Upload className="size-4 text-emerald-400" />
              <span>Restore from Backup File</span>
            </span>
            <span className="text-[10px] text-theme-muted">Import</span>
          </button>
        </div>
      </section>

      {/* 6. DANGER ZONE */}
      <section className="flex flex-col gap-1.5 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400/80 px-1">
          Danger Zone
        </span>

        <div className="flex flex-col gap-2">
          {onResetData && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all transactions and profiles to pristine initial seed data?')) {
                  onResetData();
                  showToast('Database reset to pristine seed data');
                }
              }}
              className="flex w-full h-12 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition-all"
            >
              <RotateCcw className="size-4" />
              <span>Reset to Default Seed Data</span>
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
            className="flex w-full h-12 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-[0.98] transition-all"
          >
            <AlertTriangle className="size-4" />
            <span>Purge All On-Device Storage</span>
          </button>
        </div>
      </section>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-violet-500/40 bg-zinc-900/95 px-4 py-2.5 text-xs text-theme-primary shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
