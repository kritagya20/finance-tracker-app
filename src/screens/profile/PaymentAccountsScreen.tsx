import React, { useState } from 'react';
import { ArrowLeft, Plus, CreditCard, Landmark, Wallet, Trash2, ShieldCheck } from 'lucide-react';
import { Account } from '../../domain/models/types';
import { formatCurrency } from '../../domain/engine/moneyUtils';
import { AddAccountDrawer } from './AddAccountDrawer';
import { EmptyState } from '../../components/common/EmptyState';

interface PaymentAccountsScreenProps {
  accounts: Account[];
  onBack: () => void;
  onAddAccount: (acc: Omit<Account, 'id'>) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
}

export const PaymentAccountsScreen: React.FC<PaymentAccountsScreenProps> = ({
  accounts,
  onBack,
  onAddAccount,
  onDeleteAccount,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return <CreditCard className="size-5 text-purple-400" />;
      case 'WALLET':
        return <Wallet className="size-5 text-emerald-400" />;
      case 'SAVINGS':
      case 'CURRENT':
      default:
        return <Landmark className="size-5 text-sky-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 animate-in fade-in duration-200 select-none">
      {/* 1. Top Header */}
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
              Payment Accounts
            </h1>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-theme-card-subtle border border-theme-border px-1.5 text-[11px] font-mono text-theme-muted">
              {accounts.length}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-3.5 text-xs font-semibold text-white shadow-md shadow-violet-900/25 hover:brightness-110 active:scale-[0.97] transition-all"
        >
          <Plus className="size-4" />
          <span>Add</span>
        </button>
      </header>

      {/* 2. Total Net Balance Banner */}
      <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-theme-muted uppercase">
              Total Liquid Funds
            </span>
            <div className="mt-1 text-2xl font-bold font-mono tracking-tight text-theme-primary tabular-nums">
              {formatCurrency(totalBalance)}
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <ShieldCheck className="size-5" />
          </div>
        </div>
      </div>

      {/* 3. Accounts List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No accounts linked"
            description="Link your bank accounts, credit cards, or digital cash wallets to track liquid funds."
            actionLabel="+ Link Payment Account"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          accounts.map((acc) => {
            const mask = acc.maskNumber || '4102';
            return (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-theme-border bg-theme-card hover:bg-theme-card-hover/40 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-theme-card-subtle border border-theme-border shadow-xs">
                    {getAccountIcon(acc.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-theme-primary truncate">
                      {acc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-theme-muted">
                        •••• {mask}
                      </span>
                      <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold tracking-wider uppercase bg-theme-card-subtle text-theme-secondary border border-theme-border">
                        {acc.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-theme-primary tabular-nums">
                      {formatCurrency(acc.currentBalance)}
                    </div>
                    <span className="text-[10px] text-theme-muted">Balance</span>
                  </div>

                  {onDeleteAccount && accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Unlink account "${acc.name}"?`)) {
                          onDeleteAccount(acc.id);
                        }
                      }}
                      title="Unlink account"
                      className="flex size-8 items-center justify-center rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Add Account Drawer */}
      <AddAccountDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={onAddAccount}
      />
    </div>
  );
};
