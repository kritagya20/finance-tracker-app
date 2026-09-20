import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Search, CreditCard, Landmark, Wallet, Trash2, AlertTriangle } from 'lucide-react';
import { Account } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { AddAccountDrawer } from './AddAccountDrawer';
import { EmptyState } from '../../components/common/EmptyState';
import { cn } from '../../lib/utils';

interface PaymentAccountsScreenProps {
  accounts: Account[];
  onBack: () => void;
  onAddAccount: (acc: Omit<Account, 'id'>) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
}

type InstrumentFilter = 'ALL' | 'BANK' | 'CARD' | 'WALLET';

export const PaymentAccountsScreen: React.FC<PaymentAccountsScreenProps> = ({
  accounts,
  onBack,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [filter, setFilter] = useState<InstrumentFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const t = acc.type?.toUpperCase() || '';

      // Type filter
      if (filter === 'BANK' && !['SAVINGS', 'CURRENT', 'CHECKING'].includes(t)) {
        return false;
      }
      if (filter === 'CARD' && !['CREDIT', 'CREDIT_CARD'].includes(t)) {
        return false;
      }
      if (filter === 'WALLET' && !['WALLET', 'CASH'].includes(t)) {
        return false;
      }

      // Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = acc.name.toLowerCase().includes(query);
        const typeMatch = (acc.type || '').toLowerCase().includes(query);
        const maskMatch = (acc.maskNumber || '').includes(query);
        return nameMatch || typeMatch || maskMatch;
      }

      return true;
    });
  }, [accounts, filter, searchQuery]);

  const getAccountIcon = (type: string) => {
    const t = type?.toUpperCase() || '';
    if (t === 'CREDIT' || t === 'CREDIT_CARD') {
      return <CreditCard className="size-5 text-purple-400" />;
    }
    if (t === 'WALLET' || t === 'CASH') {
      return <Wallet className="size-5 text-emerald-400" />;
    }
    return <Landmark className="size-5 text-sky-400" />;
  };

  const getBadgeInfo = (type: string) => {
    const t = type?.toUpperCase() || '';
    if (t === 'CREDIT' || t === 'CREDIT_CARD') {
      return {
        label: 'Card',
        className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      };
    }
    if (t === 'WALLET' || t === 'CASH') {
      return {
        label: 'Wallet',
        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      };
    }
    return {
      label: 'Bank',
      className: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    };
  };

  const isDefaultAccount = (acc: Account) => {
    const t = acc.type?.toUpperCase() || '';
    return t === 'CASH' || acc.id === 'acc_cash' || acc.name.toLowerCase().trim() === 'cash wallet';
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete || !onDeleteAccount || isDefaultAccount(accountToDelete)) return;
    try {
      setIsDeleting(true);
      await onDeleteAccount(accountToDelete.id);
      setAccountToDelete(null);
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 animate-in fade-in duration-200 select-none">
      {/* 1. Uncluttered Top Header (Level 1 Navigation Invariant) */}
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover hover:text-theme-primary transition-all active:scale-[0.92] shadow-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
            Payment Options
          </h1>
        </div>
      </header>

      {/* 2. Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 size-4 text-theme-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search payment options..."
          className="w-full h-11 rounded-xl border border-theme-border bg-theme-input pl-10 pr-3.5 text-xs font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 text-xs text-theme-muted hover:text-theme-primary"
          >
            Clear
          </button>
        )}
      </div>

      {/* 3. Filter Tabs (Without counts) */}
      <div className="flex gap-2">
        {(['ALL', 'BANK', 'CARD', 'WALLET'] as InstrumentFilter[]).map((tab) => {
          const isSelected = filter === tab;
          const label =
            tab === 'ALL'
              ? 'All'
              : tab === 'BANK'
              ? 'Banks'
              : tab === 'CARD'
              ? 'Cards'
              : 'Wallets';

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-xs',
                isSelected
                  ? 'border-violet-500/40 bg-violet-600 text-white'
                  : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
              )}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Inline Quick-Add Card (Shown when not actively searching) */}
      {!searchQuery && (
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 active:scale-[0.98] transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 group-hover:scale-105 transition-transform">
            <Plus className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block">
              Link Payment Option
            </span>
            <span className="text-[10px] text-theme-muted truncate block">
              Add bank account, credit card, or cash wallet
            </span>
          </div>
        </button>
      )}

      {/* 5. Accounts Listing */}
      {filteredAccounts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={searchQuery ? 'No matching accounts' : 'No payment options yet'}
          description={
            searchQuery
              ? `No accounts match "${searchQuery}". Try a different name or link a new payment option.`
              : 'Link your bank accounts, credit cards, or cash wallets to track liquid funds.'
          }
          actionLabel="+ Link Payment Option"
          onAction={() => setIsAddOpen(true)}
          secondaryActionLabel={searchQuery ? 'Clear Search' : undefined}
          onSecondaryAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden">
          {filteredAccounts.map((acc) => {
            const isDefault = isDefaultAccount(acc);
            const mask = acc.maskNumber || (isDefault ? 'CASH' : '4102');
            const badgeInfo = getBadgeInfo(acc.type);

            return (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3.5 hover:bg-theme-card-hover/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-theme-card-subtle border border-theme-border shadow-xs">
                    {getAccountIcon(acc.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-theme-primary truncate">
                      {acc.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-theme-muted">
                        {isDefault ? 'Liquid Cash' : `•••• ${mask}`}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider',
                          badgeInfo.className
                        )}
                      >
                        {badgeInfo.label}
                      </span>
                      {isDefault && (
                        <span className="inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-2">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-theme-primary tabular-nums">
                      {formatCurrency(acc.currentBalance)}
                    </div>
                    <span className="text-[10px] text-theme-muted">Balance</span>
                  </div>

                  {onDeleteAccount && !isDefault && (
                    <button
                      type="button"
                      onClick={() => setAccountToDelete(acc)}
                      title="Delete account"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all ml-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Ergonomic Thumb-Zone Primary Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold shadow-md shadow-violet-900/25 hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="size-4" />
          <span>Link Payment Option</span>
        </button>
      </div>

      {/* 7. Add Account Drawer */}
      <AddAccountDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={onAddAccount}
      />

      {/* 8. Delete Confirmation Modal Dialog */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 mx-auto max-w-[430px] flex items-center justify-center p-4 animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            onClick={() => !isDeleting && setAccountToDelete(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="relative z-10 w-full rounded-3xl border border-theme-border/80 bg-theme-elevated p-6 shadow-2xl animate-in zoom-in-95 duration-200 transition-colors"
          >
            {/* Header Alert Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-500 dark:text-rose-400 shadow-inner">
                <AlertTriangle className="size-7" />
              </div>

              <h3
                id="delete-dialog-title"
                className="mt-4 text-lg font-bold tracking-tight text-theme-primary"
              >
                {accountToDelete.type?.toUpperCase() === 'SAVINGS' || accountToDelete.type?.toUpperCase() === 'CURRENT' || accountToDelete.type?.toUpperCase() === 'CHECKING'
                  ? 'Delete Bank Account?'
                  : 'Unlink Payment Option?'}
              </h3>
              <p className="mt-1 text-xs text-theme-muted max-w-[270px] leading-relaxed">
                Are you sure you want to remove <span className="font-semibold text-theme-primary">{accountToDelete.name}</span>? This action will remove it from your active accounts.
              </p>
            </div>

            {/* Account Summary Card */}
            <div className="mt-5 rounded-2xl border border-theme-border/60 bg-theme-card-subtle/70 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-theme-card border border-theme-border shadow-xs">
                  {getAccountIcon(accountToDelete.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-theme-primary truncate">
                    {accountToDelete.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-theme-muted">
                      •••• {accountToDelete.maskNumber || '4102'}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider',
                        getBadgeInfo(accountToDelete.type).className
                      )}
                    >
                      {getBadgeInfo(accountToDelete.type).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-bold font-mono text-theme-primary tabular-nums">
                  {formatCurrency(accountToDelete.currentBalance)}
                </div>
                <span className="text-[9px] text-theme-muted">Balance</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAccountToDelete(null)}
                className="h-12 rounded-xl border border-theme-border bg-theme-card-subtle text-sm font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.97] transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
