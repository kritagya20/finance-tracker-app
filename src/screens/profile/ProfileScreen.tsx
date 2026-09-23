import React, { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  ChevronRight,
  Tag,
  CreditCard,
  SlidersHorizontal,
  ShieldCheck,
  LogOut,
  LifeBuoy,
  Info,
  Sun,
  Moon,
  Eye,
  EyeOff,
  BellRing,
  Globe,
  UserCheck,
  RotateCcw,
  KeyRound,
  Cloud,
} from 'lucide-react';
import { UserProfile, Account, Category } from '../../domain/models/types';
import { SupportModal } from './SupportModal';
import { AboutModal } from './AboutModal';
import { EditAccountDetailsDrawer } from './EditAccountDetailsDrawer';
import { ChangeMpinDrawer } from './ChangeMpinDrawer';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Switch } from '../../components/ui/Switch';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { cn } from '../../lib/utils';

interface ProfileScreenProps {
  profile: UserProfile | null;
  accounts: Account[];
  categories: Category[];
  onNavigateToCategories: () => void;
  onNavigateToAccounts: () => void;
  onNavigateToSetup: () => void;
  onNavigateToCurrency?: () => void;
  onNavigateToBackup?: () => void;
  hideBalances?: boolean;
  onToggleHideBalances?: () => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<UserProfile | void>;
  onResetData?: () => void;
  onLogout?: () => void;
}

interface CarouselSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  action: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  accounts: _accounts,
  categories: _categories,
  onNavigateToCategories,
  onNavigateToAccounts,
  onNavigateToSetup,
  onNavigateToCurrency,
  onNavigateToBackup,
  hideBalances,
  onToggleHideBalances,
  onUpdateProfile,
  onResetData,
  onLogout,
}) => {
  const { effectiveTheme, setThemePreference } = useTheme();
  const { currency, currencySymbol, numberingSystem } = useCurrency();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const userInteractedRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const touchStartXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const isVaultBackedUp = (() => {
    try {
      const saved = localStorage.getItem('vault_backup_status');
      if (saved) {
        return JSON.parse(saved).isBackedUp ?? true;
      }
    } catch {
      // fallback
    }
    return true;
  })();

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isChangeMpinOpen, setIsChangeMpinOpen] = useState(false);
  const [autoDetectSms, setAutoDetectSms] = useState(() => {
    return localStorage.getItem('auto_detect_sms') !== 'false';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Top 3 highest-priority profile management tabs matching below list content
  const slides: CarouselSlide[] = [
    {
      id: 'categories',
      icon: (
        <div className="flex size-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
          <Tag className="size-4" />
        </div>
      ),
      title: 'Categories',
      subtitle: 'Manage & Add Categories',
      action: onNavigateToCategories,
    },
    {
      id: 'accounts',
      icon: (
        <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
          <CreditCard className="size-4" />
        </div>
      ),
      title: 'Payment Options',
      subtitle: 'Bank Accounts, Cards & Wallets',
      action: onNavigateToAccounts,
    },
    {
      id: 'backup',
      icon: (
        <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
          <Cloud className="size-4" />
        </div>
      ),
      title: 'Backup Data',
      subtitle: 'Zero-Knowledge Encrypted Server Backup',
      trailing: (
        <span
          className={cn(
            'size-2.5 rounded-full shrink-0',
            isVaultBackedUp ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
          )}
          aria-label={isVaultBackedUp ? 'Vault backed up' : 'Backup pending'}
        />
      ),
      action: () => onNavigateToBackup?.(),
    },
  ];

  // Stop auto-scroll permanently when the user scrolls back/forward or interacts
  const stopAutoScroll = () => {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      setIsAutoScrollActive(false);
    }
  };

  const scrollToSlide = (idx: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    isProgrammaticScrollRef.current = true;
    container.scrollTo({
      left: idx * container.clientWidth,
      behavior: 'smooth',
    });
    setActiveSlide(idx);
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 600);
  };

  // Auto-scroll every 4.5 seconds until user scrolls or interacts
  useEffect(() => {
    if (!isAutoScrollActive) return;

    const timer = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const nextSlide = (activeSlide + 1) % slides.length;
      scrollToSlide(nextSlide);
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoScrollActive, activeSlide, slides.length]);

  // Handle native scroll event to sync active dot and detect user touch/wheel scrolling
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const width = container.clientWidth;
    if (width === 0) return;

    const newIndex = Math.round(container.scrollLeft / width);
    if (newIndex >= 0 && newIndex < slides.length && newIndex !== activeSlide) {
      setActiveSlide(newIndex);
    }

    if (!isProgrammaticScrollRef.current) {
      stopAutoScroll();
    }
  };

  const handleDotClick = (idx: number) => {
    stopAutoScroll();
    scrollToSlide(idx);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    isDraggingRef.current = false;
    stopAutoScroll();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - touchStartXRef.current) > 8) {
      isDraggingRef.current = true;
      stopAutoScroll();
    }
  };

  const handleWheel = () => {
    stopAutoScroll();
  };

  // Keep scroll aligned on window resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: activeSlide * scrollContainerRef.current.clientWidth,
          behavior: 'instant',
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSlide]);

  const handleResetSession = () => {
    if (window.confirm('Are you sure you want to reset demo session data?')) {
      if (onResetData) {
        onResetData();
        showToast('Demo data reset successfully');
      } else {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-16 animate-in fade-in duration-200 select-none">
      {/* 1. User Hero Section */}
      <section className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3.5">
          {/* Circular Avatar */}
          <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-violet-400 text-white font-bold text-lg shadow-md ring-2 ring-violet-500/20">
            {profile?.name
              ? profile.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'KC'}
          </div>

          <div className="flex flex-col">
            <h2 className="text-base font-semibold tracking-tight text-theme-primary">
              {profile?.name || 'Alex Morgan'}
            </h2>
            <span className="text-xs text-theme-secondary mt-0.5">
              Member since May, 2025
            </span>
          </div>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => setIsEditAccountOpen(true)}
          aria-label="Edit Account Details"
          className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover active:scale-[0.92] transition-all shadow-xs"
        >
          <Pencil className="size-4" />
        </button>
      </section>

      {/* 3. Highlight Carousel Card with Auto-Scroll & Swipe Support */}
      <section className="flex flex-col gap-2">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onWheel={handleWheel}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="w-full shrink-0 snap-center snap-always px-0.5"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (isDraggingRef.current) return;
                  slide.action();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    slide.action();
                  }
                }}
                className="group relative flex cursor-pointer items-center justify-between rounded-2xl border border-theme-border bg-theme-card/60 p-4 transition-all hover:bg-theme-card-hover shadow-xs"
              >
                <div className="flex items-center gap-3">
                  {slide.icon}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                      {slide.title}
                    </span>
                    <span className="text-[11px] text-theme-secondary mt-0.5">
                      {slide.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {slide.trailing}
                  <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
              onClick={() => handleDotClick(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                activeSlide === idx
                  ? 'w-5 bg-violet-500'
                  : 'w-1.5 bg-theme-muted hover:bg-theme-secondary'
              )}
            />
          ))}
        </div>
      </section>

      {/* 4. Grouped Section: PREFERENCES & MANAGEMENT */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Preferences & Management
        </span>
        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border">
          {/* Categories */}
          <button
            type="button"
            onClick={onNavigateToCategories}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Tag className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Categories
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Manage & Add Categories
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
          </button>

          {/* Payment Options */}
          <button
            type="button"
            onClick={onNavigateToAccounts}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <CreditCard className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Payment Options
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Bank Accounts, Cards & Wallets
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
          </button>

          {/* Financial Baseline */}
          <button
            type="button"
            onClick={onNavigateToSetup}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <SlidersHorizontal className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Financial Baseline
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Income, Savings Target & Primary Goal
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
          </button>
        </div>
      </section>

      {/* 5. Grouped Section: GENERAL SETTINGS */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          General Settings
        </span>
        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border">
          {/* Appearance / Theme Selector */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                {effectiveTheme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary">
                  Theme
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  {effectiveTheme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
                </span>
              </div>
            </div>
            <ThemeToggle
              isDark={effectiveTheme === 'dark'}
              onToggle={(isDark) => setThemePreference(isDark ? 'dark' : 'light')}
              ariaLabel="Toggle Light and Dark Theme"
            />
          </div>

          {/* Privacy Mode (Hide Balances) */}
          {onToggleHideBalances && (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  {hideBalances ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-theme-primary">
                    Privacy Mode
                  </span>
                  <span className="text-[11px] text-theme-secondary mt-0.5">
                    Mask Sensitive Balance Figures
                  </span>
                </div>
              </div>
              <Switch
                checked={Boolean(hideBalances)}
                onCheckedChange={onToggleHideBalances}
                ariaLabel="Privacy Mode"
              />
            </div>
          )}

          {/* SMS & Bank Detection */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <BellRing className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary">
                  SMS & Bank Detection
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Parse Financial SMS & Statements Locally
                </span>
              </div>
            </div>
            <Switch
              checked={autoDetectSms}
              onCheckedChange={(val) => {
                setAutoDetectSms(val);
                localStorage.setItem('auto_detect_sms', String(val));
                showToast(val ? 'SMS detection activated' : 'SMS detection paused');
              }}
              ariaLabel="SMS and bank detection"
            />
          </div>

          {/* Currency & Numbering Standard */}
          <button
            type="button"
            onClick={onNavigateToCurrency}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Globe className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Currency & Numbering
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  {currency} ({currencySymbol}) • {numberingSystem === 'indian' ? 'Lakhs & Crores' : 'Millions & Billions'}
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors shrink-0" />
          </button>

        </div>
      </section>

      {/* 6. Grouped Section: SECURITY & PRIVACY */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Security & Privacy
        </span>
        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border">
          {/* Zero-Knowledge Vault */}
          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Zero-Knowledge Vault
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Local-First On-Device Encrypted Storage
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                Active
              </span>
              <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
            </div>
          </button>

          {/* Change Security MPIN */}
          <button
            type="button"
            onClick={() => setIsChangeMpinOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <KeyRound className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Change Security MPIN
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Verify With Biometrics Or OTP To Update PIN
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
          </button>

          {/* Backup Data */}
          <button
            type="button"
            onClick={onNavigateToBackup}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Cloud className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Backup Data
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Zero-Knowledge Encrypted Server Backup
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className={cn(
                  'size-2.5 rounded-full shrink-0',
                  isVaultBackedUp
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-400'
                )}
                aria-label={isVaultBackedUp ? 'Vault backed up' : 'Backup pending'}
              />
              <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors shrink-0" />
            </div>
          </button>

          {/* Support & Guidance */}
          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <LifeBuoy className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Support & Guidance
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  FAQs, Privacy Architecture & Helpdesk
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
          </button>

          {/* About */}
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Info className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  About Finance Tracker
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Version 1.0.0 • Local-First Zero-Knowledge
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
          </button>
        </div>
      </section>

      {/* 7. Grouped Section: ACCOUNT */}
      <section className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted px-1">
          Account
        </span>
        <div className="flex flex-col rounded-2xl border border-theme-border bg-theme-card/50 divide-y divide-theme-border">
          {/* Edit Account Details */}
          <button
            type="button"
            onClick={() => setIsEditAccountOpen(true)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <UserCheck className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Edit Account Details
                </span>
                <span className="text-[11px] text-theme-secondary mt-0.5">
                  Name, Email & Security Credentials
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
          </button>

          {/* Reset Session Data */}
          <button
            type="button"
            onClick={handleResetSession}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-rose-500/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                <RotateCcw className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-rose-400">
                  Reset Session Data
                </span>
                <span className="text-[11px] text-rose-400/70 mt-0.5">
                  Clears Local Storage And Reloads Demo State
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 text-rose-400/50 group-hover:text-rose-400 transition-colors" />
          </button>

          {/* Sign Out */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-theme-card-hover/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-500/10 text-zinc-400">
                  <LogOut className="size-4" />
                </div>
                <span className="text-xs font-semibold text-theme-primary group-hover:text-violet-400 transition-colors">
                  Sign Out
                </span>
              </div>
              <ChevronRight className="size-4 text-theme-muted group-hover:text-theme-primary transition-colors" />
            </button>
          )}
        </div>
      </section>

      {/* Edit Account Details Drawer */}
      <EditAccountDetailsDrawer
        isOpen={isEditAccountOpen}
        onClose={() => setIsEditAccountOpen(false)}
        profile={profile}
        onSave={async (updates) => {
          if (onUpdateProfile) {
            await onUpdateProfile(updates);
          }
          showToast('Account details updated successfully');
        }}
      />

      {/* Change Security MPIN Drawer */}
      <ChangeMpinDrawer
        isOpen={isChangeMpinOpen}
        onClose={() => setIsChangeMpinOpen(false)}
        phoneNumber={profile?.phone || '+91 98765 43210'}
        onMpinChanged={async (newMpin) => {
          localStorage.setItem('user_mpin', newMpin);
          showToast('Security MPIN updated successfully');
        }}
      />

      {/* Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        onShowToast={showToast}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-violet-500/40 bg-zinc-900/95 px-4 py-2.5 text-xs text-theme-primary shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
