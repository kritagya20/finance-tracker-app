import { IntegerMoney } from './types';

export type NotificationType =
  | 'SMS_CAPTURED'
  | 'SALARY_CREDITED'
  | 'BUDGET_ALERT'
  | 'INSIGHT'
  | 'SYSTEM';

export type NotificationPriority = 'HIGH' | 'NORMAL' | 'LOW';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO 8601 string
  isRead: boolean;
  priority?: NotificationPriority;
  transactionId?: string;
  amount?: IntegerMoney;
  merchantName?: string;
  accountMask?: string;
  categoryName?: string;
  rawSmsText?: string;
}
