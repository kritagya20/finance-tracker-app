import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Hash,
  Coins,
} from 'lucide-react';
import { useCurrency, NumberingSystem } from '../../context/CurrencyContext';
import { cn } from '../../lib/utils';

interface CurrencySettingsScreenProps {
  onBack: () => void;
  onShowToast?: (msg: string) => void;
}

export const CurrencySettingsScreen: React.FC<CurrencySettingsScreenProps> = ({
  onBack,
  onShowToast,
}) => {
  const {
    currency,
    currencyConfig,
    numberingSystem,
    supportedCurrencies,
    setCurrency,
    setNumberingSystem,
    formatMoney,
  } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return supportedCurrencies;
    const q = searchQuery.toLowerCase().trim();
    return supportedCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [searchQuery, supportedCurrencies]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
    if (onShowToast) onShowToast(msg);
  };

  const handleSelectCurrency = (code: string) => {
    setCurrency(code);
    const selected = supportedCurrencies.find((c) => c.code === code);
    triggerToast(`Currency updated to ${selected?.name || code}`);
  };

  const handleSelectNumbering = (sys: NumberingSystem) => {
    setNumberingSystem(sys);
    triggerToast(
      sys === 'indian'
        ? 'Numbering set to Indian System'
        : 'Numbering set to International System'
    );
  };

  const handleResetDefaults = () => {
    setCurrency('INR');
    setNumberingSystem('indian');
    triggerToast('Reset to default Indian Rupee and Indian numbering');
  };


  return (
    <div className="flex flex-col gap-5 pb-20 animate-in fade-in duration-200 select-none">
      {/* 1. Header with single ArrowLeft navigation */}
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Profile"
            className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.92] transition-all shadow-xs"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-theme-primary">
              Currency & Numbering
            </h1>
            <p className="text-[11px] text-theme-secondary">
              Configure global display formats
            </p>
          </div>
        </div>

        {/* Quick Reset Button */}
        {(currency !== 'INR' || numberingSystem !== 'indian') && (
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-medium text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-95 transition-all shadow-xs"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </button>
        )}
      </header>

      {/* 2. Interactive Live Format Preview Hero Card */}
      <section className="relative overflow-hidden rounded-2xl border border-theme-border bg-gradient-to-br from-theme-card via-theme-card to-theme-card-subtle p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-theme-border/60 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-violet-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted font-mono">
              LIVE FORMAT PREVIEW
            </span>
          </div>
          <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-violet-400">
            {currencyConfig.code} ({currencyConfig.symbol})
          </span>
        </div>

        {/* Hero Amount */}
        <div className="my-3 flex flex-col">
          <span className="text-xs text-theme-secondary mb-1">Sample Net Balance</span>
          <span className="text-2xl font-bold tracking-tight text-theme-primary font-mono">
            {formatMoney(12548050)}
          </span>
        </div>

        {/* Sample Income and Expense Pills */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-theme-border/40">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
            <TrendingUp className="size-3.5 text-emerald-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-emerald-400/80 uppercase font-semibold">Income</span>
              <span className="text-xs font-semibold text-emerald-400 font-mono truncate">
                +{formatMoney(8500000)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5">
            <TrendingDown className="size-3.5 text-rose-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-rose-400/80 uppercase font-semibold">Expense</span>
              <span className="text-xs font-semibold text-rose-400 font-mono truncate">
                -{formatMoney(245075)}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration summary line */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-theme-muted font-mono">
          <span>{currencyConfig.name}</span>
          <span>{numberingSystem === 'indian' ? 'Indian System (Lakhs & Crores)' : 'International System (Millions & Billions)'}</span>
        </div>
      </section>

      {/* 3. Numbering System Selection */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 px-1">
          <Hash className="size-3.5 text-theme-muted" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
            Numbering & Grouping Format
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Indian System */}
          <button
            type="button"
            onClick={() => handleSelectNumbering('indian')}
            className={cn(
              'flex items-center justify-between rounded-xl border p-3.5 text-left transition-all',
              numberingSystem === 'indian'
                ? 'border-violet-500/60 bg-violet-500/10 shadow-xs'
                : 'border-theme-border bg-theme-card/60 hover:bg-theme-card-hover'
            )}
          >
            <span className="text-xs font-semibold text-theme-primary">
              Indian System (Lakhs & Crores)
            </span>

            <div
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all',
                numberingSystem === 'indian'
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-theme-border bg-transparent'
              )}
            >
              {numberingSystem === 'indian' && <Check className="size-3 stroke-[3]" />}
            </div>
          </button>

          {/* International System */}
          <button
            type="button"
            onClick={() => handleSelectNumbering('international')}
            className={cn(
              'flex items-center justify-between rounded-xl border p-3.5 text-left transition-all',
              numberingSystem === 'international'
                ? 'border-violet-500/60 bg-violet-500/10 shadow-xs'
                : 'border-theme-border bg-theme-card/60 hover:bg-theme-card-hover'
            )}
          >
            <span className="text-xs font-semibold text-theme-primary">
              International System (Millions & Billions)
            </span>

            <div
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all',
                numberingSystem === 'international'
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-theme-border bg-transparent'
              )}
            >
              {numberingSystem === 'international' && <Check className="size-3 stroke-[3]" />}
            </div>
          </button>
        </div>
      </section>

      {/* 4. Currency Selection Catalog */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 px-1">
          <Coins className="size-3.5 text-theme-muted" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
            Select Base Currency
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-theme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search currency code or name..."
            className="w-full rounded-xl border border-theme-border bg-theme-card/70 py-2.5 pl-9 pr-4 text-xs text-theme-primary placeholder:text-theme-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Currency List */}
        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden">
          {filteredCurrencies.length === 0 ? (
            <div className="p-6 text-center text-xs text-theme-secondary">
              No currencies match "{searchQuery}"
            </div>
          ) : (
            filteredCurrencies.map((c) => {
              const isSelected = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectCurrency(c.code)}
                  className={cn(
                    'flex w-full items-center justify-between p-3.5 text-left transition-colors',
                    isSelected
                      ? 'bg-violet-500/10'
                      : 'hover:bg-theme-card-hover/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Currency Flag */}
                    <div className="flex size-10 items-center justify-center rounded-xl bg-theme-card-subtle border border-theme-border text-lg shrink-0">
                      <span>{c.flag}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-theme-primary font-mono">
                        {c.code}
                      </span>
                      <span className="text-xs text-theme-secondary">•</span>
                      <span className="text-xs text-theme-secondary font-medium">
                        {c.name}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all',
                      isSelected
                        ? 'border-violet-500 bg-violet-600 text-white'
                        : 'border-theme-border bg-transparent'
                    )}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 inset-x-4 max-w-[340px] mx-auto z-50 flex items-center justify-center gap-2 rounded-xl bg-theme-elevated/95 border border-theme-border px-4 py-2.5 shadow-2xl backdrop-blur-sm text-xs font-medium text-theme-primary animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="size-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

