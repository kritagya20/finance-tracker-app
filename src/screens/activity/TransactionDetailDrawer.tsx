import React, { useState, useMemo } from 'react';
import {
  Check,
  Copy,
  CreditCard,
  Pencil,
  Split,
  Tag,
  Trash2,
  ChevronsUpDown,
} from 'lucide-react';
import { Transaction, Category, Account } from '../../domain/models/types';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { DrawerShell, SnapState } from '../../components/ui/DrawerShell';
import { DrawerHeader } from '../../components/ui/DrawerHeader';
import { cn } from '../../lib/utils';

export interface TransactionDetailDrawerProps {
  isOpen: boolean;
  transaction: Transaction | null;
  categories: Category[];
  accounts?: Account[];
  hideBalances: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onClose: () => void;
}

/**
 * Standardized TransactionDetailDrawer composed cleanly from DrawerShell and DrawerHeader.
 * Enforces single ArrowLeft navigation invariant, clean title without decorative icons,
 * uniform stepper timeline dots, and JetBrains Mono for all financial amounts.
 */
export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  isOpen,
  transaction: tx,
  categories,
  accounts = [],
  hideBalances,
  onEdit,
  onDelete,
  onClose,
}) => {
  const [snap, setSnap] = useState<SnapState>('full');
  const [copied, setCopied] = useState(false);

  // Derive associated category & account details
  const category = useMemo(() => {
    if (!tx) return undefined;
    return categories.find((c) => c.id === tx.categoryId);
  }, [tx, categories]);

  const account = useMemo(() => {
    if (!tx) return undefined;
    return accounts.find((a) => a.id === tx.accountId);
  }, [tx, accounts]);

  const splitCategories = useMemo(() => {
    if (!tx?.isSplit || !tx.splits) return [];
    return tx.splits.map((s) => ({
      ...s,
      category: categories.find((c) => c.id === s.categoryId),
    }));
  }, [tx, categories]);

  const handleCopySummary = async () => {
    if (!tx) return;
    try {
      const formatted = `${tx.merchantName} • ${formatCurrency(tx.amount, undefined, false)} on ${new Date(tx.date).toLocaleDateString()}`;
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard fallback
    }
  };

  if (!isOpen || !tx) return null;

  // Formatting helpers
  const txDate = new Date(tx.date);
  const formattedFullDate = isNaN(txDate.getTime())
    ? '—'
    : txDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
  const formattedTime = isNaN(txDate.getTime())
    ? ''
    : txDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isIncome = tx.type === 'INCOME';

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="transaction-detail-title"
      snap={snap}
      onSnapChange={setSnap}
      defaultSnap="full"
      header={
        <DrawerHeader
          title="Transaction Details"
          titleId="transaction-detail-title"
          onBack={onClose}
          rightElement={
            <div className="flex items-center gap-1">
              {/* Share / Copy Summary Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopySummary();
                }}
                aria-label="Copy summary"
                className="flex size-9 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
                title={copied ? 'Copied!' : 'Copy summary'}
              >
                {copied ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>

              {/* Snap Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSnap((s) => (s === 'full' ? 'partial' : 'full'));
                }}
                aria-label={snap === 'full' ? 'Collapse drawer' : 'Expand drawer'}
                className="flex size-9 items-center justify-center rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-card-subtle transition-colors"
                title={snap === 'full' ? 'Collapse to half screen' : 'Expand to full screen'}
              >
                <ChevronsUpDown className="size-4" />
              </button>
            </div>
          }
        />
      }
      footer={
        <div className="px-4 py-3 border-t border-theme-border/40 bg-theme-elevated shrink-0 space-y-2 select-none">
          {/* Primary CTA: Edit Transaction */}
          <button
            type="button"
            onClick={() => onEdit(tx)}
            className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
          >
            <Pencil className="size-4" />
            <span>Edit Transaction</span>
          </button>

          {/* Secondary Destructive CTA: Delete */}
          <button
            type="button"
            onClick={() => onDelete(tx)}
            className="flex w-full h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 text-rose-400 active:scale-[0.98] transition-all"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Transaction</span>
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ============================================================ */}
        {/* SECTION 1: DIGITAL FINTECH RECEIPT CARD                     */}
        {/* ============================================================ */}
        <div className="rounded-2xl bg-theme-card border border-theme-border/40 p-4 relative overflow-hidden shadow-sm space-y-3.5">
          {/* Top Specular Hairline */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 dark:via-white/15 to-transparent" />

          {/* Hero Merchant & Formatted Rupee Amount */}
          <div className="flex flex-col items-center text-center pt-1 pb-2">
            <div
              className={cn(
                'size-14 rounded-2xl flex items-center justify-center text-2xl mb-2.5 shadow-sm border',
                category?.bgClass || 'bg-violet-500/15',
                category?.textClass || 'text-violet-400',
                'border-current/25'
              )}
            >
              {category?.iconName ? (
                <CategoryIcon
                  name={category.iconName}
                  className="size-7 text-current"
                />
              ) : (
                '💳'
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-theme-primary truncate max-w-[280px]">
              {tx.merchantName}
            </h3>

            {/* Badges: Category + Type + Split */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap justify-center">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                  category?.bgClass || 'bg-theme-card-subtle',
                  category?.textClass || 'text-theme-secondary',
                  'border-current/20'
                )}
              >
                {category?.name || 'Uncategorized'}
              </span>

              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border',
                  isIncome
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    : 'bg-slate-500/15 text-slate-400 border-slate-500/25'
                )}
              >
                {tx.type}
              </span>

              {tx.isSplit && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <Split className="size-2.5 shrink-0" />
                  SPLIT
                </span>
              )}
            </div>

            {/* Bold Amount Display */}
            <div className="mt-3 flex items-baseline justify-center">
              <span
                className={cn(
                  'text-3xl sm:text-4xl font-bold font-mono tracking-tight',
                  isIncome ? 'text-emerald-400' : 'text-theme-primary'
                )}
              >
                {hideBalances
                  ? '••••••'
                  : `${isIncome ? '+' : '-'}${formatCurrency(tx.amount, undefined, false)}`}
              </span>
            </div>

            {/* Full Date and Exact Time */}
            <div className="mt-1.5 flex items-center gap-1 text-xs font-mono text-theme-muted">
              <span>{formattedFullDate}</span>
              {formattedTime && (
                <>
                  <span>•</span>
                  <span>{formattedTime}</span>
                </>
              )}
            </div>
          </div>

          {/* Dotted Receipt Divider */}
          <div className="border-b border-dashed border-theme-border/60 my-2" />

          {/* Structured Key-Value Metadata Grid */}
          <div className="space-y-2.5 text-xs">
            {/* Payment Account */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-theme-muted flex items-center gap-1.5">
                <CreditCard className="size-3.5" />
                <span>Payment Account</span>
              </span>
              <div className="flex items-center gap-1.5 font-medium text-theme-primary truncate">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: account?.color || '#8b5cf6' }}
                />
                <span className="truncate">
                  {account?.name || 'Default Account'}
                  {account?.maskNumber && ` •••• ${account.maskNumber}`}
                </span>
              </div>
            </div>

            {/* Category Breakdown (Single or Itemized Multi-Split) */}
            {tx.isSplit && splitCategories.length > 0 ? (
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-theme-muted">
                  <span className="flex items-center gap-1.5">
                    <Split className="size-3.5" />
                    <span>Split Allocation ({splitCategories.length} items)</span>
                  </span>
                  <span className="font-mono text-[11px]">
                    {hideBalances ? '••••••' : formatCurrency(tx.amount, undefined, false)}
                  </span>
                </div>

                <div className="space-y-1.5 pl-3 border-l-2 border-violet-500/40 mt-1">
                  {splitCategories.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-theme-card-subtle/50 text-[11px]"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-theme-primary truncate block">
                          {item.category?.name || 'Category'}
                        </span>
                        {item.note && (
                          <span className="text-theme-muted text-[10px] truncate block">
                            {item.note}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-theme-primary shrink-0">
                        {hideBalances ? '••••••' : formatCurrency(item.amount, undefined, false)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-2">
                <span className="text-theme-muted flex items-center gap-1.5">
                  <Tag className="size-3.5" />
                  <span>Category</span>
                </span>
                <span className="font-medium text-theme-primary truncate">
                  {category?.name || 'Uncategorized'}
                </span>
              </div>
            )}

            {/* Notes / Memo */}
            {tx.notes && (
              <div className="flex justify-between items-start gap-2 pt-0.5">
                <span className="text-theme-muted shrink-0">Notes</span>
                <span className="text-right text-theme-secondary italic max-w-[220px] break-words">
                  "{tx.notes}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: TIMELINE (REVERSE CHRONOLOGICAL: LATEST AT TOP)  */}
        {/* ============================================================ */}
        <div className="rounded-2xl bg-theme-card/50 p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-semibold text-theme-primary">
              Timeline
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-theme-card-subtle text-theme-secondary">
              {tx.source}
            </span>
          </div>

          {/* Vertical Connected Stepper (Top: Current State -> Middle: Classification -> Bottom: Inception) */}
          <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-theme-border/70 dark:before:bg-slate-700/60">

            {/* 1. CURRENT STATE (AT THE TOP) */}
            {tx.editHistory && tx.editHistory.length > 0 ? (
              <>
                {(() => {
                  const reversed = [...tx.editHistory]
                    .map((log, originalIdx) => ({ ...log, revNumber: originalIdx + 1 }))
                    .reverse();
                  const latest = reversed[0];
                  const priorRevisions = reversed.slice(1);

                  return (
                    <>
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-violet-500 dark:bg-violet-400 ring-4 ring-theme-elevated shrink-0" />
                        <div className="p-2.5 rounded-xl bg-theme-card-subtle/70 text-xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-theme-primary">
                              Current State
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                Revision #{latest.revNumber}
                              </span>
                              <span className="text-[10px] font-mono text-theme-muted shrink-0">
                                {formatTimestamp(latest.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-theme-primary font-medium mt-1">
                            {latest.summary}
                          </p>
                        </div>
                      </div>

                      {/* Prior revisions if any */}
                      {priorRevisions.map((editLog, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-violet-500 dark:bg-violet-400 ring-4 ring-theme-elevated shrink-0" />
                          <div className="p-2.5 rounded-xl bg-theme-card-subtle/50 text-xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-medium text-theme-secondary">
                                Revision #{editLog.revNumber}
                              </span>
                              <span className="text-[10px] font-mono text-theme-muted shrink-0">
                                {formatTimestamp(editLog.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-theme-muted mt-1">
                              {editLog.summary}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </>
            ) : tx.updatedAt > (tx.createdAt || 0) + 2000 ? (
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-violet-500 dark:bg-violet-400 ring-4 ring-theme-elevated shrink-0" />
                <div className="p-2.5 rounded-xl bg-theme-card-subtle/70 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-theme-primary">
                      Current State
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        Modified
                      </span>
                      <span className="text-[10px] font-mono text-theme-muted shrink-0">
                        {formatTimestamp(tx.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-theme-secondary mt-1">
                    Transaction details were updated after initial capture.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-violet-500 dark:bg-violet-400 ring-4 ring-theme-elevated shrink-0" />
                <div className="p-2.5 rounded-xl bg-theme-card-subtle/70 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-theme-primary">
                      Current State
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Unmodified
                    </span>
                  </div>
                  <p className="text-[11px] text-theme-secondary mt-0.5">
                    Active record matches original capture.
                  </p>
                </div>
              </div>
            )}

            {/* 2. INITIAL CLASSIFICATION & ALLOCATION (MIDDLE) */}
            <div className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-violet-500 dark:bg-violet-400 ring-4 ring-theme-elevated shrink-0" />
              <div className="p-2.5 rounded-xl bg-theme-card-subtle/70 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-theme-primary">Initial Classification</span>
                  <span className="text-[10px] font-mono text-theme-muted shrink-0">
                    {formatTimestamp(tx.createdAt || txDate.getTime())}
                  </span>
                </div>
                <p className="text-[11px] text-theme-secondary mt-1">
                  {tx.isSplit
                    ? `Allocated across ${tx.splits?.length || 2} categories via bill split`
                    : `Categorized as ${category?.name || 'General Expense'}`}
                </p>
              </div>
            </div>

            {/* 3. INCEPTION & CAPTURE (AT THE BOTTOM) */}
            <div className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-violet-500 dark:bg-violet-400 ring-4 ring-theme-elevated shrink-0" />
              <div className="p-2.5 rounded-xl bg-theme-card-subtle/70 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-theme-primary">
                    {tx.source === 'AUTO_SMS'
                      ? 'Detected via Bank SMS'
                      : tx.source === 'CSV_IMPORT'
                      ? 'Imported from Statement'
                      : 'Created Manually'}
                  </span>
                  <span className="text-[10px] font-mono text-theme-muted shrink-0">
                    {formatTimestamp(tx.createdAt || txDate.getTime())}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-theme-muted mt-0.5">
                  Inception • Original Capture
                </p>

                {/* Raw Bank SMS Excerpt Box (If available) */}
                {tx.rawSmsText && (
                  <div className="mt-2 p-2.5 rounded-lg bg-black/20 dark:bg-black/40 text-[10px] font-mono text-theme-secondary select-text">
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-theme-muted mb-1">
                      <span>Original SMS</span>
                      <span className="text-emerald-400 font-semibold">
                        Parsed
                      </span>
                    </div>
                    <p className="leading-relaxed break-words italic">"{tx.rawSmsText}"</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DrawerShell>
  );
};
