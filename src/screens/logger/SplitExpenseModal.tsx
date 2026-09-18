import React, { useState } from 'react';
import {
  X,
  Users,
  Check,
  Plus,
  Equal,
  Calculator,
} from 'lucide-react';
import { IntegerMoney, SplitDetails, SplitParticipant, FriendContact } from '../../domain/models/types';
import { SEED_FRIENDS } from '../../data/data';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../domain/engine/moneyUtils';

interface SplitExpenseModalProps {
  isOpen: boolean;
  totalAmountPaise: IntegerMoney;
  initialSplitDetails?: SplitDetails;
  onApply: (details: SplitDetails) => void;
  onRemove: () => void;
  onClose: () => void;
}

export const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  isOpen,
  totalAmountPaise,
  initialSplitDetails,
  onApply,
  onRemove,
  onClose,
}) => {
  const [splitType, setSplitType] = useState<'EQUAL' | 'EXACT'>(
    initialSplitDetails?.splitType || 'EQUAL'
  );

  // Available friends pool
  const [friendsList, setFriendsList] = useState<FriendContact[]>(SEED_FRIENDS);
  const [newFriendName, setNewFriendName] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  // Selected participant IDs (excluding "me")
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(() => {
    if (initialSplitDetails) {
      return initialSplitDetails.participants
        .filter((p) => !p.isPaidByMe)
        .map((p) => p.id);
    }
    // Default to first 2 friends
    return ['frnd_01', 'frnd_02'];
  });

  // Custom exact amounts map (id -> paise)
  const [exactAmounts, setExactAmounts] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    if (initialSplitDetails && initialSplitDetails.splitType === 'EXACT') {
      initialSplitDetails.participants.forEach((p) => {
        initialMap[p.id] = p.amount;
      });
    }
    return initialMap;
  });

  // Calculate equal splits whenever totalAmount or selectedFriendIds change
  const totalParticipantsCount = 1 + selectedFriendIds.length;
  const equalSharePaise = Math.floor(totalAmountPaise / Math.max(1, totalParticipantsCount));
  const remainderPaise = totalAmountPaise - equalSharePaise * totalParticipantsCount;

  // Toggle friend selection
  const handleToggleFriend = (id: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add custom friend
  const handleAddCustomFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFriendName.trim();
    if (!trimmed) return;

    const initials = trimmed
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newFriend: FriendContact = {
      id: `frnd_${Date.now()}`,
      name: trimmed,
      avatar: initials,
    };

    setFriendsList((prev) => [...prev, newFriend]);
    setSelectedFriendIds((prev) => [...prev, newFriend.id]);
    setNewFriendName('');
    setIsAddingFriend(false);
  };

  // Compute exact totals & delta
  const exactSumPaise = Object.values(exactAmounts).reduce((a, b) => a + b, 0);
  const exactDeltaPaise = totalAmountPaise - exactSumPaise;

  const handleExactChange = (id: string, rupeesVal: string) => {
    const num = parseFloat(rupeesVal);
    const paise = isNaN(num) ? 0 : Math.round(num * 100);
    setExactAmounts((prev) => ({
      ...prev,
      [id]: paise,
    }));
  };

  // Build the SplitDetails object and submit
  const handleConfirm = () => {
    if (splitType === 'EQUAL') {
      const participants: SplitParticipant[] = [
        {
          id: 'me',
          name: 'You (Payer)',
          amount: equalSharePaise + remainderPaise,
          isPaidByMe: true,
        },
        ...selectedFriendIds.map((fId) => {
          const f = friendsList.find((item) => item.id === fId);
          return {
            id: fId,
            name: f ? f.name : 'Friend',
            avatar: f?.avatar,
            amount: equalSharePaise,
            isPaidByMe: false,
          };
        }),
      ];

      const myShare = equalSharePaise + remainderPaise;
      const lentAmount = totalAmountPaise - myShare;

      onApply({
        splitType: 'EQUAL',
        totalAmount: totalAmountPaise,
        myShare,
        lentAmount,
        participants,
      });
    } else {
      // EXACT
      const participants: SplitParticipant[] = [
        {
          id: 'me',
          name: 'You (Payer)',
          amount: exactAmounts['me'] || 0,
          isPaidByMe: true,
        },
        ...selectedFriendIds.map((fId) => {
          const f = friendsList.find((item) => item.id === fId);
          return {
            id: fId,
            name: f ? f.name : 'Friend',
            avatar: f?.avatar,
            amount: exactAmounts[fId] || 0,
            isPaidByMe: false,
          };
        }),
      ];

      const myShare = exactAmounts['me'] || 0;
      const lentAmount = totalAmountPaise - myShare;

      onApply({
        splitType: 'EXACT',
        totalAmount: totalAmountPaise,
        myShare,
        lentAmount,
        participants,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-theme-elevated animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-theme-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
            <Users className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-theme-primary leading-tight">Split Expense</h3>
            <p className="text-[11px] text-theme-muted">
              Total bill: <span className="font-semibold text-theme-primary">{formatCurrency(totalAmountPaise)}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-full bg-theme-card-subtle text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Split Mode Selector */}
        <div className="flex rounded-xl bg-theme-card-subtle p-1 border border-theme-border">
          <button
            type="button"
            onClick={() => setSplitType('EQUAL')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
              splitType === 'EQUAL'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-theme-secondary hover:text-theme-primary'
            )}
          >
            <Equal className="size-3.5" />
            <span>Split Equally</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSplitType('EXACT');
              // Pre-fill exact amounts with equal shares if empty
              if (Object.keys(exactAmounts).length === 0) {
                const map: Record<string, number> = { me: equalSharePaise + remainderPaise };
                selectedFriendIds.forEach((id) => {
                  map[id] = equalSharePaise;
                });
                setExactAmounts(map);
              }
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
              splitType === 'EXACT'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-theme-secondary hover:text-theme-primary'
            )}
          >
            <Calculator className="size-3.5" />
            <span>Exact Amounts</span>
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        {splitType === 'EQUAL' ? (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-theme-card p-3 border border-theme-border shadow-xs">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
                Your Share
              </span>
              <span className="text-base font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                {formatCurrency(equalSharePaise + remainderPaise)}
              </span>
              <span className="text-[10px] text-theme-muted">Deducted from budget</span>
            </div>
            <div className="flex flex-col border-l border-theme-border pl-3">
              <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
                Friends Owe You
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(equalSharePaise * selectedFriendIds.length)}
              </span>
              <span className="text-[10px] text-theme-muted">
                {selectedFriendIds.length} {selectedFriendIds.length === 1 ? 'friend' : 'friends'} × {formatCurrency(equalSharePaise)}
              </span>
            </div>
          </div>
        ) : (
          <div className={cn(
            'flex items-center justify-between rounded-xl px-3 py-2 border text-xs',
            exactDeltaPaise === 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          )}>
            <span className="font-semibold">
              {exactDeltaPaise === 0 ? '✓ Exact amounts match total bill' : `₹${(Math.abs(exactDeltaPaise)/100).toFixed(2)} ${exactDeltaPaise > 0 ? 'left to allocate' : 'over allocated'}`}
            </span>
            <span className="tabular-nums font-bold">
              {formatCurrency(exactSumPaise)} / {formatCurrency(totalAmountPaise)}
            </span>
          </div>
        )}

        {/* Participants Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-secondary">
              Split with ({totalParticipantsCount} people)
            </span>
            {!isAddingFriend ? (
              <button
                type="button"
                onClick={() => setIsAddingFriend(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-400"
              >
                <Plus className="size-3" />
                <span>Add Person</span>
              </button>
            ) : null}
          </div>

          {/* Inline Add Person Form */}
          {isAddingFriend && (
            <form onSubmit={handleAddCustomFriend} className="flex gap-1.5 animate-in fade-in duration-150">
              <input
                type="text"
                autoFocus
                placeholder="Friend's Name..."
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="flex-1 rounded-xl border border-theme-border bg-theme-input px-3 py-1.5 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-xs"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewFriendName('');
                  setIsAddingFriend(false);
                }}
                className="px-2 py-1.5 text-theme-muted hover:text-theme-primary text-xs"
              >
                Cancel
              </button>
            </form>
          )}

          {/* List of People */}
          <div className="flex flex-col gap-1.5">
            {/* You (Always Present) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-theme-card border border-theme-border">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold">
                  You
                </div>
                <div>
                  <span className="text-xs font-semibold text-theme-primary">You (Payer)</span>
                  <div className="text-[10px] text-theme-muted">Paid the entire bill</div>
                </div>
              </div>
              {splitType === 'EQUAL' ? (
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                  {formatCurrency(equalSharePaise + remainderPaise)}
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-theme-muted">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={exactAmounts['me'] !== undefined ? (exactAmounts['me'] / 100) : ''}
                    onChange={(e) => handleExactChange('me', e.target.value)}
                    className="w-20 rounded-lg border border-theme-border bg-theme-input px-2 py-1 text-right text-xs font-bold text-theme-primary tabular-nums focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}
            </div>

            {/* Other Friends */}
            {friendsList.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <div
                  key={friend.id}
                  onClick={() => {
                    if (splitType === 'EQUAL') handleToggleFriend(friend.id);
                  }}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none',
                    isSelected
                      ? 'border-violet-500/40 bg-violet-500/5'
                      : 'border-theme-border bg-theme-card opacity-60 hover:opacity-90'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFriend(friend.id);
                      }}
                      className={cn(
                        'flex size-5 items-center justify-center rounded-md border transition-colors shrink-0',
                        isSelected
                          ? 'border-violet-600 bg-violet-600 text-white'
                          : 'border-theme-border bg-theme-card-subtle'
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </button>
                    <div className="flex size-8 items-center justify-center rounded-full bg-theme-card-subtle border border-theme-border text-xs font-semibold text-theme-primary">
                      {friend.avatar || friend.name[0]}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-theme-primary">{friend.name}</span>
                      {friend.emailOrPhone && (
                        <div className="text-[10px] text-theme-muted">{friend.emailOrPhone}</div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    splitType === 'EQUAL' ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(equalSharePaise)}
                      </span>
                    ) : (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1"
                      >
                        <span className="text-xs text-theme-muted">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={exactAmounts[friend.id] !== undefined ? (exactAmounts[friend.id] / 100) : ''}
                          onChange={(e) => handleExactChange(friend.id, e.target.value)}
                          className="w-20 rounded-lg border border-theme-border bg-theme-input px-2 py-1 text-right text-xs font-bold text-theme-primary tabular-nums focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Modal Actions */}
      <div className="p-4 border-t border-theme-border flex gap-2 shrink-0 bg-theme-card">
        {initialSplitDetails && (
          <button
            type="button"
            onClick={() => {
              onRemove();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
          >
            Remove Split
          </button>
        )}
        <button
          type="button"
          disabled={splitType === 'EXACT' && exactDeltaPaise !== 0}
          onClick={() => {
            handleConfirm();
            onClose();
          }}
          className="flex-[2] py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md active:scale-95 transition-all"
        >
          {splitType === 'EXACT' && exactDeltaPaise !== 0
            ? 'Adjust to Total'
            : `Apply Split (${totalParticipantsCount} People)`}
        </button>
      </div>
    </div>
  );
};
