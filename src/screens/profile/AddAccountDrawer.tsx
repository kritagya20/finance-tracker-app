import React, { useState } from 'react';
import { ArrowLeft, Check, CreditCard, Landmark, Wallet, ShieldCheck } from 'lucide-react';
import { Account, AccountType } from '../../domain/models/types';
import { parseKeypadToPaise, formatCurrency } from '../../domain/engine/moneyUtils';
import { cn } from '../../lib/utils';

interface AddAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Omit<Account, 'id'>) => Promise<void>;
  initialType?: AccountType;
}

const CARD_STYLES = [
  { id: 'slate', name: 'Obsidian Black', bgClass: 'from-slate-800 to-slate-950 border-slate-700', textClass: 'text-white' },
  { id: 'violet', name: 'Deep Violet', bgClass: 'from-violet-800 to-violet-950 border-violet-700', textClass: 'text-violet-100' },
  { id: 'emerald', name: 'Emerald Jade', bgClass: 'from-emerald-800 to-emerald-950 border-emerald-700', textClass: 'text-emerald-100' },
  { id: 'blue', name: 'Midnight Navy', bgClass: 'from-blue-800 to-blue-950 border-blue-700', textClass: 'text-blue-100' },
  { id: 'amber', name: 'Champagne Gold', bgClass: 'from-amber-700 to-amber-950 border-amber-600', textClass: 'text-amber-100' },
];

export const AddAccountDrawer: React.FC<AddAccountDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(initialType || 'SAVINGS');
  const [maskNumber, setMaskNumber] = useState('');
  const [balanceStr, setBalanceStr] = useState('0');
  const [selectedStyle, setSelectedStyle] = useState(CARD_STYLES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && initialType) {
      setType(initialType);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter an account or card name');
      return;
    }

    const cleanMask = maskNumber.trim() || (type === 'CASH' ? 'CASH' : '0000');
    const balancePaise = parseKeypadToPaise(balanceStr);

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: cleanName,
        type,
        currency: 'INR',
        currentBalance: balancePaise,
        maskNumber: cleanMask,
        institutionName: cleanName,
        color: selectedStyle.id,
        isActive: true,
      });
      setName('');
      setMaskNumber('');
      setBalanceStr('0');
      onClose();
    } catch (err) {
      console.error('Failed to add account:', err);
      setError('Failed to add payment account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedBalancePaise = parseKeypadToPaise(balanceStr);

  return (
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
          Add Payment Option
        </span>

        <div className="size-9" />
      </div>

      {/* Form Canvas */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar min-h-0 px-5 py-4 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Live Virtual Card Preview */}
        <div
          className={cn(
            'relative h-36 rounded-2xl p-4 flex flex-col justify-between border shadow-lg bg-gradient-to-br transition-all overflow-hidden',
            selectedStyle.bgClass
          )}
        >
          {/* Subtle card chip & logo watermark */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {type === 'SAVINGS' || type === 'CHECKING' ? (
                <Landmark className="size-5 text-white/80" />
              ) : type === 'CREDIT_CARD' ? (
                <CreditCard className="size-5 text-white/80" />
              ) : (
                <Wallet className="size-5 text-white/80" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                {name.trim() || 'Account / Bank'}
              </span>
            </div>

            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
              {type === 'CREDIT_CARD' ? 'CREDIT' : type}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest text-white/70 block">
              •••• •••• •••• {maskNumber.trim() || (type === 'CASH' ? 'CASH' : '4102')}
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs text-white/70">Balance</span>
              <span className="text-base font-bold font-mono tracking-tight text-white tabular-nums">
                {formatCurrency(parsedBalancePaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Account Type Selector */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Account Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'SAVINGS' as AccountType, label: 'Bank A/C', icon: Landmark },
              { id: 'CREDIT_CARD' as AccountType, label: 'Credit Card', icon: CreditCard },
              { id: 'CASH' as AccountType, label: 'Wallet / Cash', icon: Wallet },
            ].map((t) => {
              const isSelected = type === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1.5 transition-all shadow-xs',
                    isSelected
                      ? 'border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30'
                      : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-[11px]">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account / Institution Name */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Account / Card Name
          </label>
          <input
            type="text"
            required
            autoFocus
            maxLength={35}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HDFC Bank, Axis Neo Card, Paytm"
            className="w-full h-12 rounded-xl border border-theme-border bg-theme-input px-3.5 text-sm font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
          />
        </div>

        {/* Mask Number & Initial Balance Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1.5">
              Last 4 Digits / Mask
            </label>
            <input
              type="text"
              maxLength={6}
              value={maskNumber}
              onChange={(e) => setMaskNumber(e.target.value.toUpperCase())}
              placeholder={type === 'CASH' ? 'CASH' : '9021'}
              className="w-full h-12 rounded-xl border border-theme-border bg-theme-input px-3.5 text-xs font-mono font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-theme-secondary mb-1.5">
              Current Balance (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
              placeholder="0"
              className="w-full h-12 rounded-xl border border-theme-border bg-theme-input px-3.5 text-xs font-mono font-medium text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Card Theme Color Picker */}
        <div>
          <label className="block text-xs font-medium text-theme-secondary mb-1.5">
            Card Theme Style
          </label>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
            {CARD_STYLES.map((style) => {
              const isSelected = selectedStyle.id === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br transition-all relative shadow-xs',
                    style.bgClass,
                    isSelected ? 'ring-2 ring-violet-500 scale-105' : 'opacity-80 hover:opacity-100'
                  )}
                  title={style.name}
                >
                  {isSelected && <Check className="size-4 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {/* Pinned Sticky Bottom CTA */}
      <div className="shrink-0 px-5 pt-3 pb-8 bg-theme-elevated/95 backdrop-blur-xs border-t border-theme-border/50">
        <button
          type="button"
          disabled={!name.trim() || isSubmitting}
          onClick={handleSubmit}
          className="flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:brightness-110 disabled:opacity-[0.38] disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 active:scale-[0.97] transition-all"
        >
          <ShieldCheck className="size-4" />
          <span>{isSubmitting ? 'Linking Account...' : 'Link Payment Account'}</span>
        </button>
      </div>
    </div>
  );
};
