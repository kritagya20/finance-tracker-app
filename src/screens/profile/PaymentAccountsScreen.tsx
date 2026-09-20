import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, CreditCard, Landmark, Wallet, Trash2, ShieldCheck } from 'lucide-react';
import { Account, AccountType } from '../../domain/models/types';
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
  const [addInitialType, setAddInitialType] = useState<AccountType>('SAVINGS');

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0),
    [accounts]
  );

  // Grouped instruments for scanning clarity (Fintech Standard)
  const { bankAccounts, creditCards, walletsAndCash } = useMemo(() => {
    const banks: Account[] = [];
    const cards: Account[] = [];
    const wallets: Account[] = [];

    accounts.forEach((acc) => {
      const t = acc.type?.toUpperCase() || '';
      if (t === 'CREDIT' || t === 'CREDIT_CARD') {
        cards.push(acc);
      } else if (t === 'WALLET' || t === 'CASH') {
        wallets.push(acc);
      } else {
        banks.push(acc);
      }
    });

    return { bankAccounts: banks, creditCards: cards, walletsAndCash: wallets };
  }, [accounts]);

  const handleOpenAdd = (type: AccountType) => {
    setAddInitialType(type);
    setIsAddOpen(true);
  };

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

      {/* 2. Elevated Portfolio Banner */}
      <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-wider text-theme-muted uppercase">
            Total Liquid Assets
          </span>
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
            <ShieldCheck className="size-3" />
            <span>Encrypted Vault</span>
          </div>
        </div>

        <div className="mt-1.5 text-2xl sm:text-3xl font-bold font-mono tracking-tight text-theme-primary tabular-nums">
          {formatCurrency(totalBalance)}
        </div>

        <div className="mt-3 pt-2.5 border-t border-theme-border/50 flex items-center gap-2 text-[11px] text-theme-secondary font-medium">
          <span className="font-mono text-theme-primary font-semibold">{accounts.length}</span>
          <span>Instruments Connected</span>
          <span className="text-theme-muted">•</span>
          <span className="text-theme-muted text-[10px] font-mono">
            {bankAccounts.length} Banks · {creditCards.length} Cards · {walletsAndCash.length} Wallets
          </span>
        </div>
      </div>

      {/* 3. Contextual Quick-Add Action Strip */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Link Payment Instrument
        </span>
        <div className="grid grid-cols-3 gap-2">
          {/* Add Bank Account */}
          <button
            type="button"
            onClick={() => handleOpenAdd('SAVINGS')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-theme-border bg-theme-card/60 hover:bg-theme-card-hover hover:border-sky-500/40 active:scale-[0.97] transition-all shadow-xs group text-center"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
              <Landmark className="size-4" />
            </div>
            <span className="text-xs font-semibold text-theme-primary mt-2">
              Bank A/C
            </span>
            <span className="text-[10px] text-theme-muted truncate w-full">
              Savings/Current
            </span>
          </button>

          {/* Add Credit Card */}
          <button
            type="button"
            onClick={() => handleOpenAdd('CREDIT_CARD')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-theme-border bg-theme-card/60 hover:bg-theme-card-hover hover:border-purple-500/40 active:scale-[0.97] transition-all shadow-xs group text-center"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
              <CreditCard className="size-4" />
            </div>
            <span className="text-xs font-semibold text-theme-primary mt-2">
              Credit Card
            </span>
            <span className="text-[10px] text-theme-muted truncate w-full">
              Visa / RuPay / MC
            </span>
          </button>

          {/* Add Wallet / Cash */}
          <button
            type="button"
            onClick={() => handleOpenAdd('CASH')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-theme-border bg-theme-card/60 hover:bg-theme-card-hover hover:border-emerald-500/40 active:scale-[0.97] transition-all shadow-xs group text-center"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <Wallet className="size-4" />
            </div>
            <span className="text-xs font-semibold text-theme-primary mt-2">
              Wallet / Cash
            </span>
            <span className="text-[10px] text-theme-muted truncate w-full">
              UPI & Cash Hand
            </span>
          </button>
        </div>
      </section>

      {/* 4. Grouped Instrument Sections */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment options linked"
          description="Link your bank accounts, credit cards, or cash wallets to track balances and auto-route expenses."
          actionLabel="+ Link Bank Account"
          onAction={() => handleOpenAdd('SAVINGS')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Group 1: Bank Accounts */}
          {bankAccounts.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
                  Bank Accounts
                </span>
                <span className="text-[10px] font-mono text-theme-muted">
                  {bankAccounts.length} linked
                </span>
              </div>
              <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden">
                {bankAccounts.map((acc) => {
                  const mask = acc.maskNumber || '4102';
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

                      <div className="flex items-center gap-2.5 shrink-0 ml-2">
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
                })}
              </div>
            </section>
          )}

          {/* Group 2: Credit Cards */}
          {creditCards.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
                  Credit Cards
                </span>
                <span className="text-[10px] font-mono text-theme-muted">
                  {creditCards.length} active
                </span>
              </div>
              <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden">
                {creditCards.map((acc) => {
                  const mask = acc.maskNumber || '4102';
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-theme-muted">
                              •••• {mask}
                            </span>
                            <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              CARD
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 ml-2">
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-theme-primary tabular-nums">
                            {formatCurrency(acc.currentBalance)}
                          </div>
                          <span className="text-[10px] text-theme-muted">Available</span>
                        </div>

                        {onDeleteAccount && accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Unlink card "${acc.name}"?`)) {
                                onDeleteAccount(acc.id);
                              }
                            }}
                            title="Unlink card"
                            className="flex size-8 items-center justify-center rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Group 3: Wallets & Cash */}
          {walletsAndCash.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
                  Wallets & Cash
                </span>
                <span className="text-[10px] font-mono text-theme-muted">
                  {walletsAndCash.length} connected
                </span>
              </div>
              <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden">
                {walletsAndCash.map((acc) => {
                  const mask = acc.maskNumber || 'CASH';
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-theme-muted">
                              {mask === 'CASH' ? 'Liquid Cash' : `•••• ${mask}`}
                            </span>
                            <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              WALLET
                            </span>
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

                        {onDeleteAccount && accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Unlink wallet "${acc.name}"?`)) {
                                onDeleteAccount(acc.id);
                              }
                            }}
                            title="Unlink wallet"
                            className="flex size-8 items-center justify-center rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 5. Ergonomic Thumb-Zone Primary Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => handleOpenAdd('SAVINGS')}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-semibold shadow-md shadow-violet-900/25 hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="size-4" />
          <span>Link New Payment Option</span>
        </button>
      </div>

      {/* 6. Add Account Drawer */}
      <AddAccountDrawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={onAddAccount}
        initialType={addInitialType}
      />
    </div>
  );
};
