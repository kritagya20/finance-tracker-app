import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  CheckCheck,
  Trash2,
  Receipt,
  ArrowDownLeft,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BellOff,
  MessageSquareCode,
} from 'lucide-react';
import { AppNotification, NotificationType } from '../../domain/models/notifications';
import { SAMPLE_SMS_TEMPLATES, parseBankSms } from '../../domain/parsers/smsParser';
import { Transaction } from '../../domain/models/types';
import { cn } from '../../lib/utils';

interface NotificationScreenProps {
  notifications: AppNotification[];
  unreadCount: number;
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onNavigateToActivity?: (transactionId?: string) => void;
  onSimulateSms?: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, rawSms: string) => Promise<void>;
}

type FilterTab = 'ALL' | 'SMS_CAPTURED' | 'ALERTS' | 'SYSTEM';

function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 2) return 'Yesterday';
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return 'Recent';
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'SMS_CAPTURED':
      return <Receipt className="size-4 text-violet-400" />;
    case 'SALARY_CREDITED':
      return <ArrowDownLeft className="size-4 text-emerald-400" />;
    case 'BUDGET_ALERT':
      return <AlertTriangle className="size-4 text-amber-400" />;
    case 'INSIGHT':
      return <Sparkles className="size-4 text-sky-400" />;
    case 'SYSTEM':
    default:
      return <ShieldCheck className="size-4 text-blue-400" />;
  }
}

function getBadgeClass(type: NotificationType) {
  switch (type) {
    case 'SMS_CAPTURED':
      return 'bg-violet-500/15 border-violet-500/20 text-violet-400';
    case 'SALARY_CREDITED':
      return 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400';
    case 'BUDGET_ALERT':
      return 'bg-amber-500/15 border-amber-500/20 text-amber-400';
    case 'INSIGHT':
      return 'bg-sky-500/15 border-sky-500/20 text-sky-400';
    case 'SYSTEM':
    default:
      return 'bg-blue-500/15 border-blue-500/20 text-blue-400';
  }
}

interface SwipeableNotificationItemProps {
  item: AppNotification;
  onClear: (id: string) => void;
  onTap: (item: AppNotification) => void;
}

const SwipeableNotificationItem: React.FC<SwipeableNotificationItemProps> = ({
  item,
  onClear,
  onTap,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissDir, setDismissDir] = useState<'left' | 'right'>('left');

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const initialOffsetRef = useRef(0);
  const isHorizontalDragRef = useRef<boolean | null>(null);
  const hasDraggedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDismissed) return;
    if (e.button !== 0) return;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    initialOffsetRef.current = offsetX;
    isHorizontalDragRef.current = null;
    hasDraggedRef.current = false;
    setIsDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isDismissed) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    if (isHorizontalDragRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalDragRef.current = true;
        } else {
          isHorizontalDragRef.current = false;
          setIsDragging(false);
          return;
        }
      } else {
        return;
      }
    }

    if (!isHorizontalDragRef.current) return;
    e.preventDefault();

    hasDraggedRef.current = true;
    setOffsetX(initialOffsetRef.current + deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isDismissed) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Dismiss threshold: 75px slide
    if (Math.abs(offsetX) > 75) {
      const dir = offsetX > 0 ? 'right' : 'left';
      setDismissDir(dir);
      setIsDismissed(true);
      setTimeout(() => {
        onClear(item.id);
      }, 250);
    } else {
      setOffsetX(0);
    }
  };

  const handleClick = () => {
    if (hasDraggedRef.current || Math.abs(offsetX) > 6 || isDismissed) return;
    onTap(item);
  };

  const isSlidingLeft = offsetX < -10;
  const isSlidingRight = offsetX > 10;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl select-none transition-all duration-200',
        isDismissed ? 'max-h-0 opacity-0 -translate-y-2 scale-95 duration-250 ease-out mb-0' : 'max-h-24 mb-2'
      )}
    >
      {/* Background slide reveal layer (Red/Rose Dismiss Accent) */}
      <div
        className={cn(
          'absolute inset-0 flex items-center px-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 transition-opacity duration-150',
          Math.abs(offsetX) > 10 ? 'opacity-100' : 'opacity-0'
        )}
      >
        {isSlidingLeft && (
          <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-rose-500">
            <span>Cleared</span>
            <Trash2 className="size-4" />
          </div>
        )}
        {isSlidingRight && (
          <div className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-rose-500">
            <Trash2 className="size-4" />
            <span>Cleared</span>
          </div>
        )}
      </div>

      {/* Foreground Interactive Card */}
      <div
        style={{
          transform: isDismissed
            ? dismissDir === 'left'
              ? 'translateX(-115%)'
              : 'translateX(115%)'
            : `translateX(${offsetX}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        className={cn(
          'relative z-10 flex items-center gap-3 w-full p-3 rounded-2xl border transition-colors cursor-pointer bg-theme-card active:scale-[0.99] touch-pan-y',
          item.isRead
            ? 'border-theme-border opacity-85'
            : 'border-violet-500/35 ring-1 ring-violet-500/25 shadow-xs shadow-violet-950/20',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        {/* Leading Type Icon Badge */}
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl border pointer-events-none',
            getBadgeClass(item.type)
          )}
        >
          {getNotificationIcon(item.type)}
        </div>

        {/* 2-line Max Heading (NO description) */}
        <div className="flex-1 min-w-0 pointer-events-none">
          <h4 className="text-xs font-semibold text-theme-primary leading-snug line-clamp-2">
            {item.title}
          </h4>
        </div>

        {/* Trailing Timestamp & Unread Dot */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-1.5 pointer-events-none">
          <span className="text-[10px] text-theme-muted font-mono tabular-nums">
            {formatRelativeTime(item.timestamp)}
          </span>
          {!item.isRead && (
            <span className="size-2 rounded-full bg-violet-500 ring-2 ring-theme-card" />
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  notifications,
  unreadCount,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigateToActivity,
  onSimulateSms,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'SMS_CAPTURED') {
        return item.type === 'SMS_CAPTURED' || item.type === 'SALARY_CREDITED';
      }
      if (activeTab === 'ALERTS') {
        return item.type === 'BUDGET_ALERT' || item.type === 'INSIGHT';
      }
      if (activeTab === 'SYSTEM') {
        return item.type === 'SYSTEM';
      }
      return true;
    });
  }, [notifications, activeTab]);

  const handleSimulateTemplate = async (smsText: string) => {
    if (!onSimulateSms || isSimulating) return;
    try {
      setIsSimulating(true);
      const parsed = parseBankSms(smsText);
      if (parsed.success) {
        await onSimulateSms(
          {
            accountId: parsed.accountMask === '8819' ? 'acc_icici' : 'acc_hdfc',
            categoryId: parsed.suggestedCategoryId,
            type: parsed.type,
            amount: parsed.amount,
            currency: 'INR',
            merchantName: parsed.merchantName,
            date: new Date().toISOString(),
            source: 'AUTO_SMS',
            rawSmsText: parsed.rawSmsText,
            notes: `Auto-captured via SMS simulation`,
          },
          parsed.rawSmsText
        );
      }
      setIsSimulateOpen(false);
    } catch (e) {
      console.error('Failed to simulate SMS:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* 1. Screen Header */}
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover hover:text-theme-primary transition-all active:scale-[0.92] duration-100 shadow-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[11px] font-bold text-white shadow-sm shadow-violet-900/40">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              title="Mark all as read"
              className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:text-theme-primary transition-colors shadow-sm"
            >
              <CheckCheck className="size-4 text-emerald-500" />
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all notifications?')) {
                  onClearAll();
                }
              }}
              title="Clear all"
              className="flex size-10 items-center justify-center rounded-full border border-theme-border bg-theme-card text-theme-secondary hover:text-rose-500 transition-colors shadow-sm"
            >
              <Trash2 className="size-4 text-rose-400" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Simulation Trigger Banner */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-violet-500/10 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
              <MessageSquareCode className="size-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-theme-primary">
                SMS Ingestion Auto-Trigger
              </p>
              <p className="text-[11px] text-theme-muted">
                Simulate bank alerts to test auto-capture
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSimulateOpen(!isSimulateOpen)}
            className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-violet-900/30 hover:bg-violet-500 active:scale-95 transition-all"
          >
            <span>Simulate</span>
            {isSimulateOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        </div>

        {/* Dropdown presets */}
        {isSimulateOpen && (
          <div className="mt-3 pt-3 border-t border-violet-500/15 space-y-1.5">
            <p className="text-[11px] font-medium text-theme-muted">
              Tap a bank SMS to trigger instant parsing & notification:
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {SAMPLE_SMS_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleSimulateTemplate(tmpl.smsText)}
                  className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-card px-3 py-2 text-left text-xs text-theme-primary hover:bg-theme-card-hover active:scale-[0.99] transition-colors"
                >
                  <span className="font-medium truncate">{tmpl.label}</span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold shrink-0 ml-2">
                    Ingest SMS →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter Tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all shadow-sm',
            activeTab === 'ALL'
              ? 'border-violet-500/40 bg-violet-600 text-white'
              : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
          )}
        >
          All
          <span className="text-[10px] opacity-75">({notifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SMS_CAPTURED')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all shadow-sm',
            activeTab === 'SMS_CAPTURED'
              ? 'border-violet-500/40 bg-violet-600 text-white'
              : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
          )}
        >
          SMS Captured
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALERTS')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all shadow-sm',
            activeTab === 'ALERTS'
              ? 'border-violet-500/40 bg-violet-600 text-white'
              : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
          )}
        >
          Alerts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SYSTEM')}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all shadow-sm',
            activeTab === 'SYSTEM'
              ? 'border-violet-500/40 bg-violet-600 text-white'
              : 'border-theme-border bg-theme-card text-theme-secondary hover:bg-theme-card-hover'
          )}
        >
          System
        </button>
      </div>

      {/* 4. Notification Items List */}
      <div className="space-y-2.5">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-theme-border bg-theme-card py-12 px-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-theme-card-subtle text-theme-muted mb-3">
              <BellOff className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-theme-primary">
              All caught up!
            </h3>
            <p className="mt-1 max-w-[240px] text-xs text-theme-muted leading-relaxed">
              No notifications in this filter. As SMS data is ingested, alerts will drop here automatically.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <SwipeableNotificationItem
              key={item.id}
              item={item}
              onClear={onDeleteNotification}
              onTap={(clickedItem) => {
                if (!clickedItem.isRead) onMarkAsRead(clickedItem.id);
                onNavigateToActivity?.(clickedItem.transactionId);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
