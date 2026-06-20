/**
 * Academy Timeline Sync Service
 *
 * Syncs Academy Timeline state to Supabase using edge functions.
 * All writes go through secure edge functions with HMAC validation.
 * 
 * Security:
 * - All writes use expedition-sync edge function
 * - HMAC validation of telegram_id via init_data
 * - SERVICE_ROLE used for database writes
 * - Client cannot write directly to database
 */

import { supabase } from '../lib/supabase';
import { getTelegramUserId, getRawInitData } from '../lib/telegram';
import type { MuseumState } from './museumData';
import type { StoryProgress } from './storyData';
import type { Hero, Artifact, Region, Expedition, Npc } from './data';

const EXPEDITION_SYNC_KEY = 'academy_sync_pending';
const SYNC_DEBOUNCE_MS = 3000;

interface ExpeditionData {
  academyLevel: number;
  reputation: number;
  karbovanets: number;
  historicalPrestige: number;
  heroes: Hero[];
  artifacts: Artifact[];
  regions: Region[];
  expeditions: Expedition[];
  npcs: Npc[];
  expeditionSlots: number;
  lastTick: number;
  incomeBuffer: number;
  buildingLevels: Record<string, number>;
  buildingUpgradeEndTimes: Record<string, number>;
}

interface SyncResult {
  ok: boolean;
  error?: string;
  data?: unknown;
}

class AcademySyncService {
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Call edge function with HMAC-validated request
   */
  private async callEdgeFunction(action: string, data?: Record<string, unknown>): Promise<SyncResult> {
    const initData = getRawInitData();
    if (!initData || !supabase) {
      return { ok: false, error: 'Not in Telegram or no Supabase' };
    }

    try {
      const { data: result, error } = await supabase.functions.invoke('expedition-sync', {
        body: { action, init_data: initData, data },
      });

      if (error) {
        console.error(`Edge function error (${action}):`, error);
        return { ok: false, error: error.message };
      }

      return result as SyncResult;
    } catch (e) {
      console.error(`Edge function call error (${action}):`, e);
      return { ok: false, error: String(e) };
    }
  }

  /**
   * Save expedition data via edge function
   */
  async saveExpeditionData(data: ExpeditionData): Promise<boolean> {
    const result = await this.callEdgeFunction('save_expedition', {
      academyLevel: data.academyLevel,
      reputation: data.reputation,
      karbovanets: data.karbovanets,
      historicalPrestige: data.historicalPrestige,
      heroes: data.heroes,
      artifacts: data.artifacts,
      regions: data.regions,
      expeditions: data.expeditions,
      npcs: data.npcs,
      expeditionSlots: data.expeditionSlots,
      lastTick: data.lastTick,
      incomeBuffer: data.incomeBuffer,
      buildingLevels: data.buildingLevels,
      buildingUpgradeEndTimes: data.buildingUpgradeEndTimes,
    });

    if (!result.ok) {
      console.error('Failed to save expedition data:', result.error);
      this.queuePendingSync('expedition', data);
      return false;
    }

    return true;
  }

  /**
   * Load expedition data from expedition_state table (reads allowed)
   */
  async loadExpeditionData(): Promise<ExpeditionData | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('expedition_state')
        .select('state_data, updated_at')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load expedition data:', error);
        return null;
      }

      if (!data?.state_data) return null;

      return data.state_data as unknown as ExpeditionData;
    } catch (e) {
      console.error('Expedition load error:', e);
      return null;
    }
  }

  /**
   * Save story/progress data via edge function
   */
  async saveStoryData(storyState: StoryProgress): Promise<boolean> {
    const result = await this.callEdgeFunction('save_story', {
      currentChapter: storyState.currentChapter,
      completedChapters: storyState.completedChapters,
      activeQuests: storyState.activeQuests,
      completedQuests: storyState.completedQuests,
      npcRelationships: storyState.npcRelationships,
    });

    if (!result.ok) {
      console.error('Failed to save story data:', result.error);
      this.queuePendingSync('story', storyState);
      return false;
    }

    return true;
  }

  /**
   * Load story data from story_progress table (reads allowed)
   */
  async loadStoryData(): Promise<StoryProgress | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('story_progress')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load story data:', error);
        return null;
      }

      if (!data) return null;

      return {
        currentChapter: data.current_chapter,
        completedChapters: data.completed_chapters || [],
        activeQuests: data.active_quests || [],
        completedQuests: data.completed_quests || [],
        npcRelationships: (data.npc_relationships || {}) as Record<string, import('./storyData').NpcRelationship>,
      };
    } catch (e) {
      console.error('Story load error:', e);
      return null;
    }
  }

  /**
   * Save museum data via edge function
   */
  async saveMuseumData(museumState: MuseumState, reputation: number, visitors: number): Promise<boolean> {
    const result = await this.callEdgeFunction('save_museum', {
      museumState,
      reputation,
      totalVisitors: visitors,
    });

    if (!result.ok) {
      if (result.error && result.error.includes('does not exist')) {
        console.warn('Museum table not found, skipping sync');
        return true;
      }
      console.error('Failed to save museum data:', result.error);
      this.queuePendingSync('museum', { museumState, reputation, visitors });
      return false;
    }

    return true;
  }

  /**
   * Load museum data from museum_progress table (reads allowed)
   */
  async loadMuseumData(): Promise<{ museumState: MuseumState; reputation: number; totalVisitors: number } | null> {
    const telegramId = getTelegramUserId();
    if (!telegramId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('museum_progress')
        .select('museum_state, reputation, total_visitors')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (error) {
        console.warn('Museum load skipped:', error.message);
        return null;
      }

      if (!data) return null;

      return {
        museumState: data.museum_state as unknown as MuseumState,
        reputation: data.reputation || 0,
        totalVisitors: data.total_visitors || 0,
      };
    } catch (e) {
      console.error('Museum load error:', e);
      return null;
    }
  }

  /**
   * Queue failed sync for retry
   */
  private queuePendingSync(type: string, data: unknown): void {
    localStorage.setItem(EXPEDITION_SYNC_KEY, JSON.stringify({
      type,
      data,
      timestamp: Date.now(),
    }));
  }

  /**
   * Debounced sync all Academy data
   */
  debouncedFullSync(expeditionData: ExpeditionData, storyData: StoryProgress, museumState: MuseumState, museumRep: number, museumVis: number): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(async () => {
      await Promise.all([
        this.saveExpeditionData(expeditionData),
        this.saveStoryData(storyData),
        this.saveMuseumData(museumState, museumRep, museumVis),
      ]);
      localStorage.removeItem(EXPEDITION_SYNC_KEY);
    }, SYNC_DEBOUNCE_MS);
  }

  /**
   * Force immediate full sync
   */
  async forceFullSync(expeditionData: ExpeditionData, storyData: StoryProgress, museumState: MuseumState, museumRep: number, museumVis: number): Promise<void> {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    await Promise.all([
      this.saveExpeditionData(expeditionData),
      this.saveStoryData(storyData),
      this.saveMuseumData(museumState, museumRep, museumVis),
    ]);
  }

  /**
   * Check if there's a pending sync
   */
  hasPendingSync(): boolean {
    const pending = localStorage.getItem(EXPEDITION_SYNC_KEY);
    if (!pending) return false;

    try {
      const { timestamp } = JSON.parse(pending);
      return Date.now() - timestamp < 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  /**
   * Retry pending sync
   */
  async retryPendingSync(): Promise<boolean> {
    const pending = localStorage.getItem(EXPEDITION_SYNC_KEY);
    if (!pending) return true;

    try {
      const { type, data, timestamp } = JSON.parse(pending);

      if (Date.now() - timestamp > 60 * 60 * 1000) {
        localStorage.removeItem(EXPEDITION_SYNC_KEY);
        return true;
      }

      switch (type) {
        case 'expedition':
          return await this.saveExpeditionData(data as ExpeditionData);
        case 'story':
          return await this.saveStoryData(data as StoryProgress);
        case 'museum':
          const mData = data as { museumState: MuseumState; reputation: number; visitors: number };
          return await this.saveMuseumData(mData.museumState, mData.reputation, mData.visitors);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Complete expedition with server-side validation (P0-2)
   */
  async completeExpeditionServerValidated(
    expeditionId: string,
    heroId: string
  ): Promise<SyncResult & { success?: boolean; rewards?: Record<string, unknown> }> {
    return await this.callEdgeFunction('complete_expedition', {
      expedition_id: expeditionId,
      hero_id: heroId,
    });
  }
}

export const academySync = new AcademySyncService();

import { useEffect, useCallback, useRef } from 'react';
import { useExpeditionStore } from './store';

export function useAcademySync() {
  const store = useExpeditionStore((s) => s);
  const hasHydrated = useRef(false);

  useEffect(() => {
    const loadFromServer = async () => {
      if (hasHydrated.current) return;

      const [expeditionData, storyData, museumData] = await Promise.all([
        academySync.loadExpeditionData(),
        academySync.loadStoryData(),
        academySync.loadMuseumData(),
      ]);

      if (expeditionData) {
        const updates: Partial<ReturnType<typeof useExpeditionStore.getState>> = {};
        if (expeditionData.academyLevel !== undefined) updates.academyLevel = expeditionData.academyLevel;
        if (expeditionData.reputation !== undefined) updates.reputation = expeditionData.reputation;
        if (expeditionData.karbovanets !== undefined) updates.karbovanets = expeditionData.karbovanets;
        if (expeditionData.historicalPrestige !== undefined) updates.historicalPrestige = expeditionData.historicalPrestige;
        if (expeditionData.heroes?.length) updates.heroes = expeditionData.heroes;
        if (expeditionData.artifacts?.length) updates.artifacts = expeditionData.artifacts;
        if (expeditionData.regions?.length) updates.regions = expeditionData.regions;
        if (expeditionData.expeditions?.length) updates.expeditions = expeditionData.expeditions;
        if (expeditionData.npcs?.length) updates.npcs = expeditionData.npcs;
        if (expeditionData.expeditionSlots !== undefined) updates.expeditionSlots = expeditionData.expeditionSlots;
        if (expeditionData.lastTick !== undefined) updates.lastTick = expeditionData.lastTick;
        if (expeditionData.incomeBuffer !== undefined) updates.incomeBuffer = expeditionData.incomeBuffer;
        if (expeditionData.buildingLevels) updates.buildingLevels = expeditionData.buildingLevels;
        if (expeditionData.buildingUpgradeEndTimes) updates.buildingUpgradeEndTimes = expeditionData.buildingUpgradeEndTimes;
        useExpeditionStore.setState(updates);
      }

      if (storyData) {
        useExpeditionStore.setState({ storyState: storyData });
      }

      if (museumData) {
        const updates: Partial<ReturnType<typeof useExpeditionStore.getState>> = {};
        if (museumData.museumState) updates.museumState = museumData.museumState;
        if (museumData.reputation !== undefined) updates.reputation = museumData.reputation;
        if (museumData.totalVisitors !== undefined) updates.museumVisitors = museumData.totalVisitors;
        useExpeditionStore.setState(updates);
      }

      hasHydrated.current = true;
      console.log('Academy data hydrated from Supabase');
    };

    loadFromServer();
    academySync.retryPendingSync();
  }, []);

  const syncToServer = useCallback(() => {
    const expeditionData: ExpeditionData = {
      academyLevel: store.academyLevel,
      reputation: store.reputation,
      karbovanets: store.karbovanets,
      historicalPrestige: store.historicalPrestige,
      heroes: store.heroes,
      artifacts: store.artifacts,
      regions: store.regions,
      expeditions: store.expeditions,
      npcs: store.npcs,
      expeditionSlots: store.expeditionSlots,
      lastTick: store.lastTick,
      incomeBuffer: store.incomeBuffer,
      buildingLevels: store.buildingLevels,
      buildingUpgradeEndTimes: store.buildingUpgradeEndTimes,
    };

    academySync.debouncedFullSync(
      expeditionData,
      store.storyState,
      store.museumState,
      store.reputation,
      store.museumVisitors,
    );
  }, [store]);

  useEffect(() => {
    const unsubscribe = useExpeditionStore.subscribe(
      (state, prevState) => {
        const significantChanges = [
          state.storyState.completedQuests.length !== prevState.storyState.completedQuests.length,
          state.storyState.npcRelationships !== prevState.storyState.npcRelationships,
          JSON.stringify(state.buildingLevels) !== JSON.stringify(prevState.buildingLevels),
          JSON.stringify(state.buildingUpgradeEndTimes) !== JSON.stringify(prevState.buildingUpgradeEndTimes),
          JSON.stringify(state.museumState) !== JSON.stringify(prevState.museumState),
          state.expeditions.length !== prevState.expeditions.length,
          state.heroes.length !== prevState.heroes.length,
          Math.abs(state.karbovanets - prevState.karbovanets) > 100,
        ];

        if (significantChanges.some(Boolean)) {
          syncToServer();
        }
      }
    );

    return unsubscribe;
  }, [syncToServer]);

  return { syncToServer };
}

export const useExpeditionSync = useAcademySync;
