import { useState, useEffect, useCallback } from 'react';
import { useExpeditionStore } from '../store';
import { dailyRewardService, DailyReward, DailyRewardState } from '../dailyRewardsService';
import { Gift, Calendar, Star, Coins, Sparkles, Clock, Check, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { useTranslation } from '../../i18n';
import { useAcademySync } from '../expeditionSync';

const rewardIcons: Record<string, React.ReactNode> = {
  karbovanets: <Coins className="w-8 h-8 text-[#FFC72C]" />,
  xp: <Star className="w-8 h-8 text-[#9747FF]" />,
  artifact: <Sparkles className="w-8 h-8 text-[#00E5FF]" />,
  boost: <Gift className="w-8 h-8 text-[#FF2A5F]" />,
};

const rewardColors: Record<string, string> = {
  karbovanets: '#FFC72C',
  xp: '#9747FF',
  artifact: '#00E5FF',
  boost: '#FF2A5F',
};

export function DailyRewards() {
  const { t } = useTranslation();
  const { syncToServer } = useAcademySync();
  
  const addKarbovanets = useExpeditionStore((s) => s.addKarbovanets);
  
  // Local state for daily rewards
  const [rewardState, setRewardState] = useState<DailyRewardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [currentReward, setCurrentReward] = useState<DailyReward | null>(null);

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      const state = await dailyRewardService.loadState();
      setRewardState(state);
      
      // Check if can claim
      setClaimedToday(!dailyRewardService.canClaimToday(state));
      
      // Get current reward day
      const day = dailyRewardService.getCurrentRewardDay(state);
      setCurrentReward(dailyRewardService.getRewardForDay(day));
      
      setLoading(false);
    };
    
    loadState();
  }, []);

  // Update timer
  useEffect(() => {
    if (claimedToday) {
      const interval = setInterval(() => {
        const remaining = dailyRewardService.getTimeUntilNextReward(rewardState);
        setTimeUntilNext(remaining);
        
        // Check if midnight passed (new day)
        if (remaining === 0) {
          setClaimedToday(false);
          const day = dailyRewardService.getCurrentRewardDay(rewardState);
          setCurrentReward(dailyRewardService.getRewardForDay(day));
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [claimedToday, rewardState]);

  const handleClaim = useCallback(async () => {
    if (claiming || claimedToday) return;
    
    setClaiming(true);
    
    const result = await dailyRewardService.claimReward(rewardState);
    
    if (result) {
      // Grant reward
      switch (result.reward.type) {
        case 'karbovanets':
          addKarbovanets(result.reward.amount);
          break;
        // Other reward types would be handled similarly
      }
      
      // Update local state
      setRewardState(result.newState);
      setClaimedToday(true);
      
      // Trigger sync
      syncToServer();
    }
    
    setClaiming(false);
  }, [claiming, claimedToday, rewardState, addKarbovanets, syncToServer]);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00:00';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStreakMessage = (): string => {
    if (!rewardState) return t('expedition.daily_reward_start');
    if (rewardState.currentStreak === 1) return t('expedition.daily_reward_first');
    return t('expedition.daily_reward_streak', { count: rewardState.currentStreak });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFC72C]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">{t('expedition.daily_rewards')}</h2>
        <p className="text-sm text-gray-400">{getStreakMessage()}</p>
      </div>

      {/* Current Streak */}
      <Card className="border-[#FFC72C]/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFC72C]/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#FFC72C]" />
            </div>
            <div>
              <div className="text-sm text-gray-400">{t('expedition.daily_streak')}</div>
              <div className="text-2xl font-bold text-[#FFC72C]">
                {rewardState?.currentStreak || 0} {t('expedition.daily_days')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{t('expedition.daily_best')}</div>
            <div className="text-lg font-bold text-white">
              {rewardState?.longestStreak || 0}
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Reward */}
      {currentReward && (
        <Card className={`border ${claimedToday ? 'border-green-500/30' : 'border-[#FFC72C]/30'} p-4`}>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: rewardColors[currentReward.type] + '20' }}
            >
              {rewardIcons[currentReward.type]}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">
                {t('expedition.daily_day')} {dailyRewardService.getCurrentRewardDay(rewardState)}
              </div>
              <div className="text-lg font-bold text-white">{currentReward.label}</div>
              <div className="text-xs text-gray-400">{currentReward.type}</div>
            </div>
            {claimedToday && (
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Claim Button or Timer */}
      {claimedToday ? (
        <Card className="border-white/10 p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <div className="text-sm text-gray-400 mb-1">{t('expedition.daily_next_reward')}</div>
          <div className="text-2xl font-bold text-white font-mono">
            {formatTime(timeUntilNext)}
          </div>
        </Card>
      ) : (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-4 rounded-xl bg-[#FFC72C] text-[#0D1117] font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {claiming ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Gift className="w-6 h-6" />
              {t('expedition.daily_claim')}
            </>
          )}
        </button>
      )}

      {/* Reward Calendar Preview */}
      <Card className="border-white/10 p-4">
        <h3 className="text-sm font-medium text-white mb-3">{t('expedition.daily_calendar')}</h3>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            const isCurrent = dailyRewardService.getCurrentRewardDay(rewardState) === day;
            const isClaimed = day < dailyRewardService.getCurrentRewardDay(rewardState);
            
            return (
              <div
                key={day}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${
                  isCurrent
                    ? 'bg-[#FFC72C]/30 border border-[#FFC72C]'
                    : isClaimed
                    ? 'bg-green-500/20'
                    : 'bg-white/5'
                }`}
              >
                <span className={isCurrent ? 'text-[#FFC72C] font-bold' : 'text-gray-400'}>
                  {day}
                </span>
                {isClaimed && <Check className="w-3 h-3 text-green-500" />}
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#FFC72C]" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-white/10 p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {rewardState?.totalClaims || 0}
          </div>
          <div className="text-xs text-gray-400">{t('expedition.daily_total_claimed')}</div>
        </Card>
        <Card className="border-white/10 p-3 text-center">
          <div className="text-2xl font-bold text-[#FFC72C]">
            {rewardState?.longestStreak || 0}
          </div>
          <div className="text-xs text-gray-400">{t('expedition.daily_longest_streak')}</div>
        </Card>
      </div>
    </div>
  );
}
