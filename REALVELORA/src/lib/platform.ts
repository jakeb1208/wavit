declare global {
  interface Window {
    Capacitor?: {
      getPlatform: () => string;
      isNativePlatform: () => boolean;
    };
  }
}

export type Platform = 'ios' | 'android' | 'web';

export function getPlatform(): Platform {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('preview');
    if (param === 'ios') return 'ios';
    if (param === 'android') return 'android';
    if (window.Capacitor) {
      const p = window.Capacitor.getPlatform();
      if (p === 'ios') return 'ios';
      if (p === 'android') return 'android';
    }
  }
  return 'web';
}

export function isNative(): boolean {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('preview');
    if (param === 'ios' || param === 'android') return true;
    return !!window.Capacitor?.isNativePlatform?.();
  }
  return false;
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}
