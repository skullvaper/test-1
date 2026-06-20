// Telegram WebApp integration
import type { TelegramWebApp } from '../types/game';

let tgInstance: TelegramWebApp | null = null;

export function initTelegramMiniApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  
  if (window.Telegram?.WebApp) {
    tgInstance = window.Telegram.WebApp as unknown as TelegramWebApp;
    tgInstance.ready();
    tgInstance.expand();
    
    // Apply theme colors
    const theme = tgInstance.themeParams;
    document.documentElement.style.setProperty('--tg-bg', theme.bg_color || '#1a1a2e');
    document.documentElement.style.setProperty('--tg-text', theme.text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-hint', theme.hint_color || '#8B949E');
    document.documentElement.style.setProperty('--tg-button', theme.button_color || '#FFC72C');
    document.documentElement.style.setProperty('--tg-button-text', theme.button_text_color || '#000000');
    
    return tgInstance;
  }
  
  // Return mock for development
  return createMockTelegram();
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (tgInstance) return tgInstance;
  return initTelegramMiniApp();
}

export function getTelegramUserId(): number | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user?.id ?? null;
}

export function getTelegramUsername(): string | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user?.username ?? null;
}

export function getTelegramFirstName(): string | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user?.first_name ?? null;
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  const tg = getTelegramWebApp();
  tg?.HapticFeedback?.impactOccurred?.(style);
}

export function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  const tg = getTelegramWebApp();
  tg?.HapticFeedback?.notificationOccurred?.(type);
}

export function hapticSelection() {
  const tg = getTelegramWebApp();
  tg?.HapticFeedback?.selectionChanged?.();
}

// Development mock
function createMockTelegram(): TelegramWebApp {
  return {
    ready: () => console.log('[Telegram Mock] ready()'),
    expand: () => console.log('[Telegram Mock] expand()'),
    close: () => console.log('[Telegram Mock] close()'),
    initData: 'mock_init_data',
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'TestUser',
        username: 'test_user',
        language_code: 'uk',
      },
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'mock_hash',
    },
    themeParams: {
      bg_color: '#1a1a2e',
      text_color: '#ffffff',
      hint_color: '#8B949E',
      button_color: '#FFC72C',
      button_text_color: '#000000',
    },
    platform: 'web',
    colorScheme: 'dark',
    version: '7.0',
    isVersionAtLeast: () => true,
    setHeaderColor: () => {},
    setBackgroundColor: () => {},
    enableClosingConfirmation: () => {},
    disableClosingConfirmation: () => {},
    showPopup: () => {},
    showAlert: (message: string) => console.log('[Telegram Mock] Alert:', message),
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {
      console.log('[Telegram Mock] Confirm:', message);
      callback?.(true);
    },
    MainButton: {
      text: '',
      color: '',
      textColor: '',
      isVisible: false,
      isActive: false,
      isProgressVisible: false,
      show: () => {},
      hide: () => {},
      enable: () => {},
      disable: () => {},
      showProgress: () => {},
      hideProgress: () => {},
      onClick: () => {},
      offClick: () => {},
    },
    BackButton: {
      isVisible: false,
      show: () => {},
      hide: () => {},
      onClick: () => {},
      offClick: () => {},
    },
    HapticFeedback: {
      impactOccurred: () => console.log('[Telegram Mock] hapticImpact'),
      notificationOccurred: () => console.log('[Telegram Mock] hapticNotification'),
      selectionChanged: () => console.log('[Telegram Mock] hapticSelection'),
    },
    openTelegramLink: (url: string) => console.log('[Telegram Mock] openTelegramLink:', url),
    openLink: (url: string) => console.log('[Telegram Mock] openLink:', url),
    openInvoice: (url: string, callback) => {
      console.log('[Telegram Mock] openInvoice:', url);
      callback?.('paid');
    },
  };
}

export function getRawInitData(): string {
  const tg = getTelegramWebApp();
  return tg?.initData ?? '';
}
