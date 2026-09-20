import React from 'react';
import { ArrowLeft, Check, CreditCard } from 'lucide-react';
import { Account } from '../../domain/models/types';
import { cn } from '../../lib/utils';

export interface AccountOptionItem {
  id: string;
  name: string;
  mask?: string;
  maskNumber?: string;
  color?: string;
}

export interface AccountPickerModalProps {
  isOpen: boolean;
  accounts: (Account | AccountOptionItem)[];
  selectedAccountId: string;
  onSelectAccount: (accId: string) => void;
  onClose: () => void;
}

/**
 * Standardized AccountPickerModal sub-sheet.
 * Renders selectable payment accounts with account masks and selection checkmarks.
 */
export const AccountPickerModal: React.FC<AccountPickerModalProps> = ({
  isOpen,
  accounts,
  selectedAccountId,
  onSelectAccount,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-theme-elevated animate-in fade-in duration-150 select-none">
      <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b border-theme-border/40 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-card-subtle active:scale-95 transition-all"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-sm font-bold text-theme-primary uppercase tracking-wider">
          Select Payment Account
        </span>
        <div className="size-10" />
      </div>

      <div className="flex flex-col gap-2 p-5 overflow-y-auto no-scrollbar flex-1">
        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          const mask =
            'maskNumber' in acc && acc.maskNumber
              ? acc.maskNumber
              : 'mask' in acc && acc.mask
              ? acc.mask
              : '';

          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => {
                onSelectAccount(acc.id);
                onClose();
              }}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-xl border transition-all text-left',
                isSelected
                  ? 'border-violet-500/60 bg-violet-500/10 text-theme-primary shadow-xs'
                  : 'border-theme-border bg-theme-card-subtle hover:bg-theme-card text-theme-secondary'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-lg bg-theme-card text-theme-primary border border-theme-border/40"
                  style={acc.color ? { borderColor: `${acc.color}40` } : undefined}
                >
                  <CreditCard className="size-4" style={acc.color ? { color: acc.color } : undefined} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-theme-primary">{acc.name}</div>
                  {mask && <div className="text-[11px] text-theme-muted font-mono">···· {mask}</div>}
                </div>
              </div>
              {isSelected && <Check className="size-4 text-violet-500 stroke-[2.5]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
