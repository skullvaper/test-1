// Main game hook - handles all game logic for the clicker
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { GameState, EpochId, DailyTasksState } from '../types/game';
import { EPOCHS, getEpochById, getGeneratorCost, getGeneratorProduction } from '../data/epochs';
import { shouldRefreshDailyTasks, createDailyTasksState, isTaskComplete, pickDailyTasks } from '../data/tasks';
import { formatNumber, getTodayDateStr, isSameDay, deepClone } from '../lib/utils';
import { getTelegramUserId } from '../lib/telegram';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'game_state';
const SYNC_INTERVAL = 30000; // 30 seconds

interface UseGameReturn {
  // State
  state: GameState;
  epoch: ReturnType<typeof getEpochById>;
  tapEvents: Array<{ id: string; x: number; y: number; value: number; createdAt: number }>;
  
  // Tap actions
  tap: (x: number, y: number) => void;
  
  // Generator actions
  buyGenerator: (generatorId: string) => boolean;
  
  // Tap power
  upgradeTapPower: () => boolean;
  tapPowerCost: number;
  
  // Epoch actions
  switchEpoch: (epochId: EpochId) => boolean;
  
  // Server rewards
  processServerRewards: (action: string) => void;
  
  // Artifact actions
  upgradeArtifactLevel: (artifactId: string) => boolean;
  
  // Gacha
  deductGachaCost: (amount: number) => boolean;
  recordGachaOpen: () => void;
  
  // Daily tasks
  claimDailyTask: (taskId: string) => void;
  
  // Loading & User
  isLoading: boolean;
  telegramId: number | null;
  
  // Leaderboard
  leaderboard: unknown[];
  userRank: unknown | null;
  leaderboardLoading: boolean;
  loadLeaderboard: () => Promise<void>;
  
  // Multipliers
  artifactMultipliers: { xp: number; currency: number; passive: number };
  boosterMultipliers: { xp: number; currency: number };
  refreshBoosters: () => void;
  
  // Offline gains
  offlineGains: { xp: number; currency: number; time: number } | null;
  dismissOfflineGains: () => void;
  
  // Duplicate tab
  duplicateTab: { isDuplicate: boolean; dismiss: () => void };
  
  // Streak modal
  streakModal: { streak: number; reward: { xp: number; currency: number } } | null;
  dismissStreakModal: () => void;
  
  // Sync status
  syncStatus: 'synced' | 'syncing' | 'error';
  connectionError: string | null;
  dismissConnectionError: () => void;
  
  // Daily rewards
  showDailyRewards: boolean;
  claimDailyReward: (index: number) => void;
  skipDailyRewards: () => void;
  
  // Prestige
  canPrestige: boolean;
  performPrestige: () => void;
  buyPrestigeUpgrade: (upgradeId: string) => boolean;
  
  // Energy
  getEnergyMultiplier: () => number;
}

// Default initial state
function getDefaultState(): GameState {
  return {
    epochId: 'trypillia',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalXp: 0,
    currency: 50, // Start with some currency
    totalCurrencyEarned: 50,
    ownedGenerators: [],
    tapPower: 1,
    passiveXpPerSecond: 0,
    unlockedEpochs: ['trypillia'],
    lastSavedAt: Date.now(),
    artifactParts: {},
    artifactLevels: {},
    completedArtifacts: [],
    artifactDupes: {},
    referrerId: null,
    referralsCount: 0,
    referralEarnings: 0,
    activeBoosters: {},
    dailyStreak: 0,
    bestStreak: 0,
    lastLoginDate: null,
    dailyTasksState: null,
    lastCheckIn: null,
    checkInStreak: 0,
    prestigeLevel: 0,
    prestigePoints: 0,
    prestigeResearch: {},
    energy: 100,
    maxEnergy: 100,
    lastOnlineAt: Date.now(),
    sessionStartAt: Date.now(),
    dailyAdViews: { last_reset: getTodayDateStr() },
  };
}

export function useGame(): UseGameReturn {
  const [state, setState] = useState<GameState>(() => {
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GameState;
        return { ...getDefaultState(), ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load game state:', e);
    }
    return getDefaultState();
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<unknown[]>([]);
  const [userRank, setUserRank] = useState<unknown | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [offlineGains, setOfflineGains] = useState<{ xp: number; currency: number; time: number } | null>(null);
  const [duplicateTab, setDuplicateTab] = useState<{ isDuplicate: boolean; dismiss: () => void }>({ isDuplicate: false, dismiss: () => setDuplicateTab(prev => ({ ...prev, isDuplicate: false })) });
  const [streakModal, setStreakModal] = useState<{ streak: number; reward: { xp: number; currency: number } } | null>(null);
  const [tapEvents, setTapEvents] = useState<Array<{ id: string; x: number; y: number; value: number; createdAt: number }>>([]);
  
  const telegramId = getTelegramUserId();
  const lastSaveRef = useRef<number>(Date.now());
  
  // Get current epoch
  const epoch = useMemo(() => getEpochById(state.epochId), [state.epochId]);
  
  // Calculate multipliers from artifacts
  const artifactMultipliers = useMemo(() => {
    let xp = 1;
    let currency = 1;
    let passive = 1;
    
    state.completedArtifacts.forEach(artifactId => {
      // This would be expanded based on actual artifact bonuses
      const level = state.artifactLevels[artifactId] || 0;
      xp += level * 0.05;
      currency += level * 0.03;
      passive += level * 0.02;
    });
    
    return { xp, currency, passive };
  }, [state.completedArtifacts, state.artifactLevels]);
  
  // Calculate booster multipliers
  const boosterMultipliers = useMemo(() => {
    let xp = 1;
    let currency = 1;
    
    const now = Date.now();
    const boosters = state.activeBoosters;
    
    // XP boost
    if (boosters.xp_boost_end && boosters.xp_boost_end > now) {
      xp *= boosters.xp_boost_mult || 2;
    }
    
    // Super boost (XP + currency)
    if (boosters.super_boost_end && boosters.super_boost_end > now) {
      xp *= boosters.super_boost_mult || 2;
      currency *= boosters.super_boost_mult || 2;
    }
    
    // Currency boost
    if (boosters.currency_boost_end && boosters.currency_boost_end > now) {
      currency *= boosters.currency_boost_mult || 2;
    }
    
    return { xp, currency };
  }, [state.activeBoosters]);
  
  // Calculate tap power cost
  const tapPowerCost = useMemo(() => {
    return Math.floor(10 * Math.pow(1.5, state.tapPower));
  }, [state.tapPower]);
  
  // Check prestige eligibility
  const canPrestige = useMemo(() => {
    return state.level >= 100;
  }, [state.level]);
  
  // Energy multiplier (after prestige 1+)
  const getEnergyMultiplier = useCallback(() => {
    if (state.prestigeLevel < 1 || state.energy <= 0) return 1;
    return 5; // x5 energy multiplier
  }, [state.prestigeLevel, state.energy]);
  
  // Save state to localStorage
  const saveState = useCallback((newState: GameState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      lastSaveRef.current = Date.now();
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }, []);
  
  // Sync to server
  const syncToServer = useCallback(async () => {
    if (!telegramId || !supabase) return;
    
    setSyncStatus('syncing');
    try {
      const { error } = await supabase
        .from('game_progress')
        .upsert({
          telegram_id: telegramId,
          state: state,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      setSyncStatus('synced');
      setConnectionError(null);
    } catch (e) {
      console.error('Sync error:', e);
      setSyncStatus('error');
      setConnectionError('Не вдалося синхронізувати');
    }
  }, [telegramId, state, supabase]);
  
  // Load from server
  const loadFromServer = useCallback(async () => {
    if (!telegramId || !supabase) {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('state')
        .eq('telegram_id', telegramId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data?.state) {
        // Merge server state with local (server wins for conflicts)
        const serverState = data.state as GameState;
        setState(prev => {
          const merged = { ...prev, ...serverState };
          saveState(merged);
          return merged;
        });
        
        // Calculate offline gains
        const offlineTime = Date.now() - (serverState.lastOnlineAt || Date.now());
        const maxOfflineTime = 6 * 60 * 60 * 1000; // 6 hours max
        const effectiveTime = Math.min(offlineTime, maxOfflineTime);
        
        if (effectiveTime > 60000) { // More than 1 minute
          const passiveXp = Math.floor((serverState.passiveXpPerSecond || 0) * (effectiveTime / 1000));
          const offlineCurrency = Math.floor(passiveXp * 0.1);
          
          setOfflineGains({
            xp: passiveXp,
            currency: offlineCurrency,
            time: effectiveTime,
          });
        }
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [telegramId, supabase, saveState]);
  
  // Check for daily streak
  useEffect(() => {
    const today = getTodayDateStr();
    const lastLogin = state.lastLoginDate;
    
    if (!lastLogin) {
      // First login
      setStreakModal({ streak: 1, reward: { xp: 100, currency: 50 } });
    } else {
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive login
        const newStreak = state.dailyStreak + 1;
        const rewards = { xp: newStreak * 100, currency: newStreak * 50 };
        setStreakModal({ streak: newStreak, reward: rewards });
      } else if (daysDiff > 1) {
        // Streak broken
        setStreakModal({ streak: 1, reward: { xp: 100, currency: 50 } });
      }
    }
    
    // Check daily check-in
    if (state.lastCheckIn !== today) {
      setShowDailyRewards(true);
    }
  }, []);
  
  // Initialize game
  useEffect(() => {
    loadFromServer();
    
    // Periodic sync
    const syncInterval = setInterval(syncToServer, SYNC_INTERVAL);
    return () => clearInterval(syncInterval);
  }, [loadFromServer, syncToServer]);
  
  // Tap action
  const tap = useCallback((x: number, y: number) => {
    const effectiveTapPower = state.tapPower * artifactMultipliers.xp * boosterMultipliers.xp;
    const xpGained = Math.round(effectiveTapPower);
    
    setState(prev => {
      let newXp = prev.xp + xpGained;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNextLevel;
      let newTotalXp = prev.totalXp + xpGained;
      
      // Level up check
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = Math.floor(newXpToNext * 1.5);
        
        // Haptic feedback for level up
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          window.Telegram.WebApp.HapticFeedback?.notificationOccurred?.('success');
        }
      }
      
      // Update daily task counters
      const newTasksState = prev.dailyTasksState
        ? {
            ...prev.dailyTasksState,
            counters: {
              ...prev.dailyTasksState.counters,
              tap: prev.dailyTasksState.counters.tap + 1,
              earn_xp: prev.dailyTasksState.counters.earn_xp + xpGained,
            },
          }
        : null;
      
      const newState = {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        totalXp: newTotalXp,
        lastSavedAt: Date.now(),
        dailyTasksState: newTasksState,
      };
      
      saveState(newState);
      return newState;
    });
    
    // Add tap event for animation
    setTapEvents(prev => [
      ...prev.slice(-20), // Keep last 20
      { id: `tap-${Date.now()}`, x, y, value: xpGained, createdAt: Date.now() },
    ]);
  }, [state.tapPower, artifactMultipliers, boosterMultipliers, saveState]);
  
  // Buy generator
  const buyGenerator = useCallback((generatorId: string): boolean => {
    const epochGenerators = epoch?.generators || [];
    const generator = epochGenerators.find(g => g.id === generatorId);
    if (!generator) return false;
    
    const ownedLevel = state.ownedGenerators.find(g => g.generatorId === generatorId)?.level || 0;
    const cost = getGeneratorCost(generator, ownedLevel);
    
    if (state.currency < cost) return false;
    
    setState(prev => {
      const existingIndex = prev.ownedGenerators.findIndex(g => g.generatorId === generatorId);
      let newOwned: typeof prev.ownedGenerators;
      
      if (existingIndex >= 0) {
        newOwned = prev.ownedGenerators.map((g, i) =>
          i === existingIndex ? { ...g, level: g.level + 1 } : g
        );
      } else {
        newOwned = [...prev.ownedGenerators, { generatorId, level: 1 }];
      }
      
      // Recalculate passive XP
      const newPassiveXp = newOwned.reduce((sum, owned) => {
        const gen = epochGenerators.find(g => g.id === owned.generatorId);
        if (!gen) return sum;
        return sum + getGeneratorProduction(gen, owned.level);
      }, 0);
      
      const newState = {
        ...prev,
        currency: prev.currency - cost,
        ownedGenerators: newOwned,
        passiveXpPerSecond: newPassiveXp,
        dailyTasksState: prev.dailyTasksState
          ? {
              ...prev.dailyTasksState,
              counters: {
                ...prev.dailyTasksState.counters,
                buy_generator: prev.dailyTasksState.counters.buy_generator + 1,
              },
            }
          : null,
      };
      
      saveState(newState);
      return newState;
    });
    
    return true;
  }, [epoch, state.ownedGenerators, state.currency, saveState]);
  
  // Upgrade tap power
  const upgradeTapPower = useCallback((): boolean => {
    if (state.currency < tapPowerCost) return false;
    
    setState(prev => {
      const newState = {
        ...prev,
        currency: prev.currency - tapPowerCost,
        tapPower: prev.tapPower + 1,
        dailyTasksState: prev.dailyTasksState
          ? {
              ...prev.dailyTasksState,
              counters: {
                ...prev.dailyTasksState.counters,
                upgrade_tap: prev.dailyTasksState.counters.upgrade_tap + 1,
              },
            }
          : null,
      };
      
      saveState(newState);
      return newState;
    });
    
    return true;
  }, [state.currency, tapPowerCost, saveState]);
  
  // Switch epoch
  const switchEpoch = useCallback((epochId: EpochId): boolean => {
    if (!state.unlockedEpochs.includes(epochId)) return false;
    
    setState(prev => {
      const newState = { ...prev, epochId, lastSavedAt: Date.now() };
      saveState(newState);
      return newState;
    });
    
    return true;
  }, [state.unlockedEpochs, saveState]);
  
  // Process server rewards
  const processServerRewards = useCallback((action: string) => {
    // This would typically call an RPC to validate and process rewards
    console.log('Process rewards:', action);
  }, []);
  
  // Upgrade artifact
  const upgradeArtifactLevel = useCallback((artifactId: string): boolean => {
    const parts = state.artifactParts[artifactId] || 0;
    const currentLevel = state.artifactLevels[artifactId] || 0;
    const requiredParts = (currentLevel + 1) * 10;
    
    if (parts < requiredParts) return false;
    
    setState(prev => ({
      ...prev,
      artifactParts: { ...prev.artifactParts, [artifactId]: parts - requiredParts },
      artifactLevels: { ...prev.artifactLevels, [artifactId]: currentLevel + 1 },
    }));
    
    return true;
  }, [state.artifactParts, state.artifactLevels]);
  
  // Deduct gacha cost
  const deductGachaCost = useCallback((amount: number): boolean => {
    if (state.currency < amount) return false;
    
    setState(prev => {
      const newState = {
        ...prev,
        currency: prev.currency - amount,
      };
      saveState(newState);
      return newState;
    });
    
    return true;
  }, [state.currency, saveState]);
  
  // Record gacha open
  const recordGachaOpen = useCallback(() => {
    setState(prev => ({
      ...prev,
      dailyTasksState: prev.dailyTasksState
        ? {
            ...prev.dailyTasksState,
            counters: {
              ...prev.dailyTasksState.counters,
              open_gacha: prev.dailyTasksState.counters.open_gacha + 1,
            },
          }
        : null,
    }));
  }, []);
  
  // Claim daily task
  const claimDailyTask = useCallback((taskId: string) => {
    setState(prev => {
      if (!prev.dailyTasksState) return prev;
      if (prev.dailyTasksState.claimed.includes(taskId)) return prev;
      
      const newState = {
        ...prev,
        dailyTasksState: {
          ...prev.dailyTasksState,
          claimed: [...prev.dailyTasksState.claimed, taskId],
        },
      };
      
      saveState(newState);
      return newState;
    });
  }, [saveState]);
  
  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    if (!supabase) return;
    
    setLeaderboardLoading(true);
    try {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(50);
      
      setLeaderboard(data || []);
      
      if (telegramId) {
        const { data: rank } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('telegram_id', telegramId)
          .single();
        setUserRank(rank);
      }
    } catch (e) {
      console.error('Leaderboard error:', e);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [supabase, telegramId]);
  
  // Refresh boosters from server
  const refreshBoosters = useCallback(() => {
    loadFromServer();
  }, [loadFromServer]);
  
  // Dismiss offline gains
  const dismissOfflineGains = useCallback(() => {
    setState(prev => {
      if (!offlineGains) return prev;
      
      const newState = {
        ...prev,
        xp: prev.xp + offlineGains.xp,
        currency: prev.currency + offlineGains.currency,
        lastOnlineAt: Date.now(),
      };
      
      saveState(newState);
      return newState;
    });
    
    setOfflineGains(null);
  }, [offlineGains, saveState]);
  
  // Dismiss streak modal
  const dismissStreakModal = useCallback(() => {
    setStreakModal(null);
    setState(prev => ({
      ...prev,
      dailyStreak: streakModal?.streak || prev.dailyStreak,
      bestStreak: Math.max(prev.bestStreak, streakModal?.streak || 1),
      lastLoginDate: getTodayDateStr(),
    }));
  }, [streakModal, saveState]);
  
  // Claim daily reward
  const claimDailyReward = useCallback((index: number) => {
    // This would add the reward to the player
    console.log('Claim daily reward:', index);
  }, []);
  
  // Skip daily rewards
  const skipDailyRewards = useCallback(() => {
    setShowDailyRewards(false);
    setState(prev => ({
      ...prev,
      lastCheckIn: getTodayDateStr(),
      checkInStreak: prev.checkInStreak + 1,
    }));
  }, []);
  
  // Perform prestige
  const performPrestige = useCallback(() => {
    if (!canPrestige) return;
    
    setState(prev => {
      const newPrestigePoints = Math.floor(prev.totalXp / 1000);
      
      const newState: GameState = {
        ...getDefaultState(),
        prestigeLevel: prev.prestigeLevel + 1,
        prestigePoints: prev.prestigePoints + newPrestigePoints,
        prestigeResearch: prev.prestigeResearch,
        referrerId: prev.referrerId,
        referralsCount: prev.referralsCount,
        referralEarnings: prev.referralEarnings,
        lastLoginDate: getTodayDateStr(),
      };
      
      saveState(newState);
      return newState;
    });
  }, [canPrestige, saveState]);
  
  // Buy prestige upgrade
  const buyPrestigeUpgrade = useCallback((upgradeId: string): boolean => {
    const costs: Record<string, number> = {
      rare_artifact_chance: 10,
      passive_income: 15,
      xp_gain: 20,
    };
    
    const cost = costs[upgradeId] || 10;
    
    if (state.prestigePoints < cost) return false;
    
    setState(prev => ({
      ...prev,
      prestigePoints: prev.prestigePoints - cost,
      prestigeResearch: {
        ...prev.prestigeResearch,
        [upgradeId]: (prev.prestigeResearch[upgradeId as keyof typeof prev.prestigeResearch] || 0) + 1,
      },
    }));
    
    return true;
  }, [state.prestigePoints]);
  
  // Dismiss connection error
  const dismissConnectionError = useCallback(() => {
    setConnectionError(null);
  }, []);
  
  return {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    tapPowerCost,
    switchEpoch,
    processServerRewards,
    upgradeArtifactLevel,
    deductGachaCost,
    recordGachaOpen,
    claimDailyTask,
    isLoading,
    telegramId,
    leaderboard,
    userRank,
    leaderboardLoading,
    loadLeaderboard,
    artifactMultipliers,
    boosterMultipliers,
    refreshBoosters,
    offlineGains,
    dismissOfflineGains,
    duplicateTab,
    streakModal,
    dismissStreakModal,
    syncStatus,
    connectionError,
    dismissConnectionError,
    showDailyRewards,
    claimDailyReward,
    skipDailyRewards,
    canPrestige,
    performPrestige,
    buyPrestigeUpgrade,
    getEnergyMultiplier,
  };
}
