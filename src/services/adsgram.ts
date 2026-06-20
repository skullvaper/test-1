// ADSGRAM Ad SDK wrapper
// Documentation: https://github.com/adsgram/react

// ADSGRAM Block ID - this is a placeholder, replace with actual ID
export const ADSGRAM_BLOCK_ID = import.meta.env.VITE_ADSGRAM_BLOCK_ID || 'YOUR_BLOCK_ID_HERE';

// Ad show result
export enum AdShowResult {
  // Ad was shown and completed
  COMPLETED = 'completed',
  // User closed ad before completion
  CLOSED = 'closed',
  // No ad available
  NO_AD = 'no_ad',
  // SDK not initialized
  NOT_INITIALIZED = 'not_initialized',
  // Error occurred
  ERROR = 'error',
}

// Initialize ADSGRAM SDK
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initAdsgram(): Promise<void> {
  if (isInitialized) return;
  
  if (initPromise) return initPromise;
  
  initPromise = new Promise(async (resolve, reject) => {
    try {
      // Dynamic import ADSGRAM
      const AdsgramSdk = (await import('@adsgram/react')).default;
      
      // Initialize with block ID
      const ad = AdsgramSdk({
        block: ADSGRAM_BLOCK_ID,
        debug: !import.meta.env.PROD,
      });
      
      isInitialized = true;
      resolve();
    } catch (error) {
      console.error('Failed to initialize ADSGRAM:', error);
      reject(error);
    }
  });
  
  return initPromise;
}

// Check if ADSGRAM is available
export function isAdsgramAvailable(): boolean {
  return isInitialized;
}

// Show reward ad
export async function showRewardAd(): Promise<AdShowResult> {
  if (!isInitialized) {
    console.warn('ADSGRAM not initialized');
    return AdShowResult.NOT_INITIALIZED;
  }
  
  try {
    const AdsgramSdk = (await import('@adsgram/react')).default;
    
    const ad = AdsgramSdk({
      block: ADSGRAM_BLOCK_ID,
      debug: !import.meta.env.PROD,
    });
    
    const result = await ad.rewarded();
    
    if (result) {
      return AdShowResult.COMPLETED;
    } else {
      return AdShowResult.CLOSED;
    }
  } catch (error) {
    console.error('ADSGRAM showRewardAd error:', error);
    return AdShowResult.ERROR;
  }
}

// Mock implementation for development
export async function showRewardAdMock(): Promise<AdShowResult> {
  return new Promise((resolve) => {
    // Simulate ad showing
    setTimeout(() => {
      resolve(AdShowResult.COMPLETED);
    }, 1500);
  });
}

// Check if we should show ad (based on daily limits)
export function shouldShowAd(
  dailyAdViews: { energy_ads?: number; offline_ads?: number; chest_ads?: number; last_reset?: string },
  adType: 'energy' | 'offline' | 'chest'
): boolean {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset counters if new day
  if (dailyAdViews.last_reset !== today) {
    return true;
  }
  
  // Check limits based on ad type
  const limits: Record<string, number> = {
    energy: 5,
    offline: 3,
    chest: 10,
  };
  
  const counts: Record<string, number> = {
    energy: dailyAdViews.energy_ads || 0,
    offline: dailyAdViews.offline_ads || 0,
    chest: dailyAdViews.chest_ads || 0,
  };
  
  return (counts[adType] || 0) < limits[adType];
}

// Track ad view
export function trackAdView(
  dailyAdViews: { energy_ads?: number; offline_ads?: number; chest_ads?: number; last_reset?: string },
  adType: 'energy' | 'offline' | 'chest'
): { energy_ads?: number; offline_ads?: number; chest_ads?: number; last_reset?: string } {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset if new day
  if (dailyAdViews.last_reset !== today) {
    return {
      last_reset: today,
      energy_ads: adType === 'energy' ? 1 : 0,
      offline_ads: adType === 'offline' ? 1 : 0,
      chest_ads: adType === 'chest' ? 1 : 0,
    };
  }
  
  // Increment counter
  return {
    ...dailyAdViews,
    energy_ads: adType === 'energy' ? (dailyAdViews.energy_ads || 0) + 1 : dailyAdViews.energy_ads,
    offline_ads: adType === 'offline' ? (dailyAdViews.offline_ads || 0) + 1 : dailyAdViews.offline_ads,
    chest_ads: adType === 'chest' ? (dailyAdViews.chest_ads || 0) + 1 : dailyAdViews.chest_ads,
  };
}
