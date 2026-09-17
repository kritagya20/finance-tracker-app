import { useState, useCallback } from 'react';
import { AppNotification } from '../domain/models/notifications';
import { Transaction } from '../domain/models/types';

const NOTIFICATIONS_STORAGE_KEY = 'app_notifications_v1';

const INITIAL_SEEDED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_seed_1',
    type: 'SMS_CAPTURED',
    title: 'SMS Ingested · ₹280.00 at Starbucks',
    message: 'Auto-captured from HDFC Bank A/C **4102. Categorized as Food & Dining.',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 mins ago
    isRead: false,
    priority: 'NORMAL',
    amount: 28000,
    merchantName: 'Starbucks',
    accountMask: '4102',
    categoryName: 'Food & Dining',
    rawSmsText: 'Sent Rs.280.00 from HDFC Bank A/C **4102 to STARBUCKS on 17-Sep-26.',
  },
  {
    id: 'notif_seed_2',
    type: 'SMS_CAPTURED',
    title: 'SMS Ingested · ₹450.00 at Uber Trip',
    message: 'Auto-captured from HDFC Bank A/C **4102. Categorized as Transport.',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
    isRead: false,
    priority: 'NORMAL',
    amount: 45000,
    merchantName: 'Uber Trip',
    accountMask: '4102',
    categoryName: 'Transport',
    rawSmsText: 'Debited Rs.450.00 at UBER TRIP from HDFC Bank A/C **4102 on 17-Sep-26.',
  },
  {
    id: 'notif_seed_3',
    type: 'SALARY_CREDITED',
    title: 'Salary Credited · ₹85,000.00 to HDFC Bank',
    message: 'Monthly payroll deposit received from TechCorp Solutions.',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000 * 16).toISOString(), // 16 days ago
    isRead: true,
    priority: 'HIGH',
    amount: 8500000,
    merchantName: 'TechCorp Solutions Payroll',
    accountMask: '4102',
    categoryName: 'Salary & Income',
    rawSmsText: 'INR 85,000.00 credited to HDFC Bank A/C **4102 on 01-Sep-26 by TECHCORP SOLUTIONS PAYROLL.',
  },
  {
    id: 'notif_seed_4',
    type: 'BUDGET_ALERT',
    title: 'Budget Alert · Food & Dining at 82%',
    message: 'You have spent ₹14,800 of your ₹18,000 monthly food budget.',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Yesterday
    isRead: true,
    priority: 'HIGH',
    categoryName: 'Food & Dining',
  },
  {
    id: 'notif_seed_5',
    type: 'SYSTEM',
    title: 'Local On-Device Engine Active',
    message: 'Zero-knowledge SMS bank feed listener running locally on device.',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000 * 2).toISOString(), // 2 days ago
    isRead: true,
    priority: 'LOW',
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_SEEDED_NOTIFICATIONS;
  });

  const saveNotifications = useCallback((items: AppNotification[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist notifications:', e);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    (id: string) => {
      saveNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
    [notifications, saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    saveNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  }, [notifications, saveNotifications]);

  const deleteNotification = useCallback(
    (id: string) => {
      saveNotifications(notifications.filter((n) => n.id !== id));
    },
    [notifications, saveNotifications]
  );

  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  const addNotification = useCallback(
    (item: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
      const newNotif: AppNotification = {
        ...item,
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      const updated = [newNotif, ...notifications];
      saveNotifications(updated);
      return newNotif;
    },
    [notifications, saveNotifications]
  );

  const notifyTransactionCreated = useCallback(
    (tx: Transaction, rawSms?: string) => {
      if (tx.source !== 'AUTO_SMS' && !rawSms) return;

      const isCredit = tx.type === 'INCOME';
      const formattedAmount = (tx.amount / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      addNotification({
        type: isCredit ? 'SALARY_CREDITED' : 'SMS_CAPTURED',
        title: isCredit
          ? `Income Credited · ₹${formattedAmount} from ${tx.merchantName}`
          : `SMS Ingested · ₹${formattedAmount} at ${tx.merchantName}`,
        message: `Auto-captured from on-device SMS feed. Account: ${tx.accountId}.`,
        priority: isCredit ? 'HIGH' : 'NORMAL',
        transactionId: tx.id,
        amount: tx.amount,
        merchantName: tx.merchantName,
        categoryName: tx.categoryId,
        rawSmsText: rawSms || tx.rawSmsText,
      });
    },
    [addNotification]
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification,
    notifyTransactionCreated,
  };
}
