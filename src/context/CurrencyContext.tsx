import React, { createContext, useContext, useState, useCallback } from 'react';
import { IntegerMoney } from '../domain/models/types';
import { financeRepository } from '../services/adapters/MockFinanceRepository';

export type NumberingSystem = 'indian' | 'international';
export type DecimalPrecisionMode = 'auto' | 'always';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  country: string;
  flag: string;
  defaultNumbering: NumberingSystem;
  locale: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    country: 'India',
    flag: '🇮🇳',
    defaultNumbering: 'indian',
    locale: 'en-IN',
    decimals: 2,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    country: 'United States',
    flag: '🇺🇸',
    defaultNumbering: 'international',
    locale: 'en-US',
    decimals: 2,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    country: 'European Union',
    flag: '🇪🇺',
    defaultNumbering: 'international',
    locale: 'en-IE',
    decimals: 2,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    country: 'United Kingdom',
    flag: '🇬🇧',
    defaultNumbering: 'international',
    locale: 'en-GB',
    decimals: 2,
  },
  {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    defaultNumbering: 'international',
    locale: 'en-AE',
    decimals: 2,
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    country: 'Japan',
    flag: '🇯🇵',
    defaultNumbering: 'international',
    locale: 'ja-JP',
    decimals: 0,
  },
  {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    country: 'Canada',
    flag: '🇨🇦',
    defaultNumbering: 'international',
    locale: 'en-CA',
    decimals: 2,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    country: 'Australia',
    flag: '🇦🇺',
    defaultNumbering: 'international',
    locale: 'en-AU',
    decimals: 2,
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    country: 'Singapore',
    flag: '🇸🇬',
    defaultNumbering: 'international',
    locale: 'en-SG',
    decimals: 2,
  },
  {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    country: 'Switzerland',
    flag: '🇨🇭',
    defaultNumbering: 'international',
    locale: 'de-CH',
    decimals: 2,
  },
];

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  currencyConfig: CurrencyOption;
  numberingSystem: NumberingSystem;
  decimalMode: DecimalPrecisionMode;
  supportedCurrencies: CurrencyOption[];
  setCurrency: (code: string) => void;
  setNumberingSystem: (system: NumberingSystem) => void;
  setDecimalMode: (mode: DecimalPrecisionMode) => void;
  formatMoney: (amount: IntegerMoney, showDecimals?: boolean | 'auto' | 'always') => string;
}


const STORAGE_KEY_CURRENCY = 'app_currency_code';
const STORAGE_KEY_NUMBERING = 'app_numbering_system';
const STORAGE_KEY_DECIMALS = 'app_decimal_mode';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENCY);
      if (stored && SUPPORTED_CURRENCIES.some((c) => c.code === stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'INR';
  });

  const [numberingSystem, setNumberingSystemState] = useState<NumberingSystem>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NUMBERING);
      if (stored === 'indian' || stored === 'international') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'indian';
  });

  const [decimalMode, setDecimalModeState] = useState<DecimalPrecisionMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DECIMALS);
      if (stored === 'auto' || stored === 'always') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'auto';
  });

  const currencyConfig =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];

  const setCurrency = useCallback((code: string) => {
    const config = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (!config) return;

    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, code);
      // If user hasn't explicitly customized numbering, adapt to currency default
      const userCustomized = localStorage.getItem('app_numbering_customized') === 'true';
      if (!userCustomized) {
        setNumberingSystemState(config.defaultNumbering);
        localStorage.setItem(STORAGE_KEY_NUMBERING, config.defaultNumbering);
      }
    } catch (e) {
      console.error('Failed to save currency:', e);
    }

    // Sync with mock database profile
    financeRepository.updateProfile({
      currency: config.code,
      currencySymbol: config.symbol,
    }).catch(console.error);
  }, []);

  const setNumberingSystem = useCallback((system: NumberingSystem) => {
    setNumberingSystemState(system);
    try {
      localStorage.setItem(STORAGE_KEY_NUMBERING, system);
      localStorage.setItem('app_numbering_customized', 'true');
    } catch (e) {
      console.error('Failed to save numbering system:', e);
    }
  }, []);

  const setDecimalMode = useCallback((mode: DecimalPrecisionMode) => {
    setDecimalModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_DECIMALS, mode);
    } catch (e) {
      console.error('Failed to save decimal mode:', e);
    }
  }, []);

  const formatMoney = useCallback(
    (amount: IntegerMoney, showDecimals: boolean | 'auto' | 'always' = decimalMode): string => {

      const isNegative = amount < 0;
      const absPaise = Math.abs(amount);
      const absUnits = absPaise / 100;
      const hasFractions = absPaise % 100 !== 0;

      // Determine decimal fraction digits
      let fractions = 0;
      if (currencyConfig.decimals === 0) {
        fractions = 0;
      } else if (showDecimals === 'auto') {
        fractions = hasFractions ? 2 : 0;
      } else if (showDecimals === true || showDecimals === 'always') {
        fractions = 2;
      }

      // Format number using requested numbering system
      const locale = numberingSystem === 'indian' ? 'en-IN' : 'en-US';
      const numberPart = new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractions,
        maximumFractionDigits: fractions,
      }).format(absUnits);

      const symbol = currencyConfig.symbol;
      const result = `${symbol} ${numberPart}`;
      return isNegative ? `-${result}` : result;
    },
    [currencyConfig, numberingSystem, decimalMode]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol: currencyConfig.symbol,
        currencyConfig,
        numberingSystem,
        decimalMode,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        setCurrency,
        setNumberingSystem,
        setDecimalMode,
        formatMoney,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
