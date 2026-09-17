import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Compass,
  Zap,
  User,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  FinancialGoal,
  EmploymentType,
  UserProfile,
} from '../../domain/models/types';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../domain/engine/moneyUtils';

interface ProfileSetupScreenProps {
  initialName?: string;
  onComplete: (profile: Partial<UserProfile>) => void;
  onSkip: () => void;
}

const GOALS: {
  id: FinancialGoal;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}[] = [
  {
    id: 'SAVINGS_INVESTING',
    title: 'Grow Wealth',
    description: 'Save & invest consistently each month',
    icon: TrendingUp,
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/15 border-violet-500/30',
  },
  {
    id: 'EMERGENCY_FUND',
    title: 'Safety Cushion',
    description: 'Build 3–6 months emergency buffer',
    icon: ShieldCheck,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15 border-emerald-500/30',
  },
  {
    id: 'EXPENSE_CONTROL',
    title: 'Cut Overspending',
    description: 'Track spending leaks & impulse buys',
    icon: Compass,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15 border-amber-500/30',
  },
  {
    id: 'DEBT_FREE',
    title: 'Debt Freedom',
    description: 'Pay off credit card dues or personal loans',
    icon: Zap,
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/15 border-rose-500/30',
  },
];

const EMPLOYMENT_TYPES: { id: EmploymentType; label: string }[] = [
  { id: 'SALARIED', label: 'Salaried (Fixed)' },
  { id: 'FREELANCE_BUSINESS', label: 'Freelance / Business' },
  { id: 'STUDENT_OTHER', label: 'Student / Other' },
];

const SAVINGS_TARGETS = [10, 20, 30, 50];

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  initialName = 'User',
  onComplete,
  onSkip,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [name, setName] = useState(initialName);
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState('85000');
  const [primaryGoal, setPrimaryGoal] = useState<FinancialGoal>('SAVINGS_INVESTING');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('SALARIED');
  const [savingsTargetPercent, setSavingsTargetPercent] = useState<number>(20);
  const [budgetStartDay, setBudgetStartDay] = useState<number>(1);

  const numericIncome = Math.max(0, parseInt(monthlyIncomeInput.replace(/\D/g, '') || '0', 10));
  const calculatedSavingsAmount = Math.round((numericIncome * savingsTargetPercent) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: Partial<UserProfile> = {
      name: name.trim() || 'User',
      monthlyIncome: numericIncome * 100, // convert INR rupees to paise
      primaryGoal,
      employmentType,
      savingsTargetPercent,
      budgetStartDay,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    onComplete(profileData);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Screen-Specific Header */}
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Profile Setup</h1>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="flex h-10 items-center rounded-2xl border border-white/10 bg-zinc-900 px-3.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Skip
        </button>
      </header>

      {/* Header Description */}
      <p className="text-xs text-zinc-400 leading-relaxed -mt-2">
        Provide your baseline numbers so our analytics engine can calculate your real
        savings rate, runway, and monthly budgeting health.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
        {/* 1. Name & Income Card */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/85 p-4 shadow-sm backdrop-blur-md space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Preferred Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-white/10 bg-zinc-800/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Monthly Take-Home Income */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                Monthly In-Hand Income
              </label>
              <span className="text-[11px] text-zinc-500">After taxes</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={monthlyIncomeInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMonthlyIncomeInput(val);
                }}
                placeholder="85000"
                className="w-full rounded-xl border border-white/10 bg-zinc-800/80 py-2.5 pl-8 pr-3 text-sm font-semibold tabular-nums text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Powers your 50/30/20 ratio and spending velocity metrics.
            </p>
          </div>
        </div>

        {/* 2. Primary Financial Goal (2x2 Grid) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Primary Financial Priority
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {GOALS.map((g) => {
              const Icon = g.icon;
              const isSelected = primaryGoal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setPrimaryGoal(g.id)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-2xl border text-left transition-all',
                    isSelected
                      ? `${g.bgClass} shadow-md`
                      : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300'
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-xl border',
                        isSelected
                          ? `${g.bgClass} ${g.colorClass}`
                          : 'border-white/10 bg-zinc-800 text-zinc-400'
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    {isSelected && (
                      <span className="flex size-4 items-center justify-center rounded-full bg-violet-600 text-white">
                        <Check className="size-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-zinc-100">
                    {g.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">
                    {g.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Income Stability & Target Savings */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/85 p-4 shadow-sm backdrop-blur-md space-y-4">
          {/* Employment Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">
              Income Consistency
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {EMPLOYMENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setEmploymentType(type.id)}
                  className={cn(
                    'rounded-xl py-2 px-1 text-center text-[11px] font-medium transition-all border',
                    employmentType === type.id
                      ? 'border-violet-500/40 bg-violet-600 text-white shadow-md'
                      : 'border-white/5 bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Target Savings % */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300">Monthly Savings Target</span>
              <span className="font-semibold text-emerald-400 tabular-nums">
                {savingsTargetPercent}% ({formatCurrency(calculatedSavingsAmount * 100)}/mo)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {SAVINGS_TARGETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setSavingsTargetPercent(pct)}
                  className={cn(
                    'rounded-xl py-2 text-center text-xs font-semibold transition-all border',
                    savingsTargetPercent === pct
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-md'
                      : 'border-white/5 bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Budget Reset Date */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-300">Payday / Cycle Start</span>
              <span className="text-[10px] text-zinc-500">Day budget resets each month</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 5, 25].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setBudgetStartDay(day)}
                  className={cn(
                    'size-8 rounded-lg text-xs font-semibold transition-all border',
                    budgetStartDay === day
                      ? 'border-violet-500/40 bg-violet-600 text-white'
                      : 'border-white/5 bg-zinc-800 text-zinc-400'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex flex-col gap-2.5">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-900/40 transition-transform active:scale-[0.98]"
          >
            <span>Complete Setup & Launch</span>
            <ArrowRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2.5 text-center text-xs font-medium text-zinc-500 hover:text-zinc-300 active:text-zinc-100 transition-colors"
          >
            Skip for now (use smart defaults)
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSetupScreen;
