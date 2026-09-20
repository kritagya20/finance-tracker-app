import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Check, X } from 'lucide-react';
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
    numberingSystem,
    supportedCurrencies,
    setCurrency,
    setNumberingSystem,
  } = useCurrency();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query to provide responsive micro-interaction
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 180);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredCurrencies = useMemo(() => {
    if (!debouncedQuery.trim()) return supportedCurrencies;
    const q = debouncedQuery.toLowerCase().trim();
    return supportedCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );
  }, [debouncedQuery, supportedCurrencies]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
    if (onShowToast) onShowToast(msg);
  };

  const handleSelectCurrency = (code: string) => {
    setCurrency(code);
    const selected = supportedCurrencies.find((c) => c.code === code);
    triggerToast(`Currency updated to ${selected?.name || code} (${selected?.symbol || ''})`);
  };

  const handleSelectNumbering = (sys: NumberingSystem) => {
    setNumberingSystem(sys);
    triggerToast(
      sys === 'indian'
        ? 'Numbering set to Indian System (Lakhs & Crores)'
        : 'Numbering set to International System (Millions & Billions)'
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-20 animate-in fade-in duration-200 select-none">
      {/* Header with single ArrowLeft navigation */}
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
      </header>

      {/* Numbering & Grouping Format (At top) */}
      <section className="flex flex-col gap-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Numbering & Grouping Format
        </span>

        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border overflow-hidden">
          {/* Indian System */}
          <button
            type="button"
            onClick={() => handleSelectNumbering('indian')}
            className={cn(
              'flex w-full items-center justify-between p-3.5 text-left transition-colors',
              numberingSystem === 'indian'
                ? 'bg-violet-500/10'
                : 'hover:bg-theme-card-hover/50'
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
              'flex w-full items-center justify-between p-3.5 text-left transition-colors',
              numberingSystem === 'international'
                ? 'bg-violet-500/10'
                : 'hover:bg-theme-card-hover/50'
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

      {/* Select Base Currency Catalog */}
      <section className="flex flex-col gap-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Select Base Currency
        </span>

        {/* Search Input with Debounce & Clear Action */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-theme-muted transition-colors group-focus-within:text-violet-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search currency code or name..."
            className="w-full rounded-xl border border-theme-border bg-theme-card/70 py-2.5 pl-9 pr-9 text-xs text-theme-primary placeholder:text-theme-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all duration-200 focus:scale-[1.005]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full bg-theme-muted/20 text-theme-secondary hover:text-theme-primary hover:bg-theme-muted/30 active:scale-90 transition-all"
            >
              <X className="size-3" />
            </button>
          )}
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

