import { useState, useEffect } from 'react';
import { useExpeditionStore } from '../store';
import { buildings } from '../data';
import { Card, Progress, Badge } from '../ui';
import { 
  Building2, Clock, Coins, ChevronRight, Check, Zap,
  TrendingUp, Users, FlaskConical, Landmark, BookOpen, Vault
} from 'lucide-react';
import { useTranslation } from '../../i18n';

const buildingIcons: Record<string, React.ReactNode> = {
  'building-1': <Zap className="w-6 h-6" />,
  'building-2': <Users className="w-6 h-6" />,
  'building-3': <FlaskConical className="w-6 h-6" />,
  'building-4': <Landmark className="w-6 h-6" />,
  'building-5': <BookOpen className="w-6 h-6" />,
  'building-6': <Vault className="w-6 h-6" />,
};

const buildingColors: Record<string, string> = {
  'building-1': '#FFC72C',
  'building-2': '#00E5FF',
  'building-3': '#9747FF',
  'building-4': '#10B981',
  'building-5': '#FF2A5F',
  'building-6': '#FF8C00',
};

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}г ${minutes % 60}хв`;
  }
  if (minutes > 0) {
    return `${minutes}хв ${seconds % 60}с`;
  }
  return `${seconds}с`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'М';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'К';
  return num.toLocaleString();
}

export function Buildings() {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());

  const karbovanets = useExpeditionStore((s) => s.karbovanets);
  const buildingLevels = useExpeditionStore((s) => s.buildingLevels);
  const buildingUpgradeEndTimes = useExpeditionStore((s) => s.buildingUpgradeEndTimes);
  const upgradeBuilding = useExpeditionStore((s) => s.upgradeBuilding);
  const collectBuildingUpgrade = useExpeditionStore((s) => s.collectBuildingUpgrade);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalLevels = Object.values(buildingLevels).reduce((sum, lvl) => sum + lvl, 0);

  return (
    <div className="min-h-full bg-[#0D1117] p-4 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#FFC72C20', border: '1px solid #FFC72C' }}
        >
          <Building2 className="w-6 h-6" style={{ color: '#FFC72C' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            {t('buildings.title')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('buildings.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-white/10 p-3">
          <div className="text-xs text-muted-foreground mb-1">{t('buildings.total_levels')}</div>
          <div className="text-2xl font-bold" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
            {totalLevels}
          </div>
        </Card>
        <Card className="border-white/10 p-3">
          <div className="text-xs text-muted-foreground mb-1">{t('buildings.karbovanets')}</div>
          <div className="text-2xl font-bold" style={{ fontFamily: "'Exo 2', sans-serif", color: '#10B981' }}>
            {formatNumber(karbovanets)}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {buildings.map((building) => {
          const currentLevel = buildingLevels[building.id] || 1;
          const isUpgrading = buildingUpgradeEndTimes[building.id] && buildingUpgradeEndTimes[building.id] > now;
          const upgradeEndTime = buildingUpgradeEndTimes[building.id] || 0;
          const timeRemaining = upgradeEndTime - now;
          const progress = isUpgrading ? Math.max(0, Math.min(100, (1 - timeRemaining / (building.upgradeTime * 1000 * Math.pow(1.3, currentLevel))) * 100)) : 0;
          const nextLevel = currentLevel + 1;
          const upgradeCost = Math.round(building.upgradeCost * Math.pow(1.5, currentLevel));
          const upgradeTime = Math.round(building.upgradeTime * Math.pow(1.3, currentLevel) * 1000);
          const canAfford = karbovanets >= upgradeCost;
          const color = buildingColors[building.id] || '#FFC72C';

          return (
            <Card
              key={building.id}
              className="border-white/10 p-4 overflow-hidden"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <span style={{ color }}>{buildingIcons[building.id]}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{building.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge style={{ backgroundColor: color, color: '#0D1117', fontSize: '10px' }}>
                        {t('buildings.level')} {currentLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{t('buildings.bonus')}</div>
                  <div className="text-sm font-medium" style={{ color }}>
                    {building.bonus}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {building.description}
              </p>

              {isUpgrading ? (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" style={{ color }} />
                      {t('buildings.upgrading')}
                    </span>
                    <span style={{ color }}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  
                  {timeRemaining <= 0 && (
                    <button
                      onClick={() => collectBuildingUpgrade(building.id)}
                      className="w-full mt-3 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: '#10B981', color: '#fff' }}
                    >
                      <Check className="w-4 h-4" />
                      {t('buildings.collect')}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-white/5 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {t('buildings.next_level')} {nextLevel}
                      </span>
                      <Badge variant="outline" style={{ borderColor: color, color }}>
                        {building.bonus}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3 h-3" style={{ color: '#FFC72C' }} />
                        <span style={{ color: canAfford ? '#10B981' : '#FF2A5F' }}>
                          {formatNumber(upgradeCost)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: '#00E5FF' }} />
                        <span>{formatTime(upgradeTime)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => upgradeBuilding(building.id)}
                    disabled={!canAfford}
                    className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: canAfford ? color : 'rgba(255,255,255,0.1)', 
                      color: canAfford ? '#0D1117' : '#666' 
                    }}
                  >
                    {canAfford ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        {t('buildings.upgrade')}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        {t('buildings.not_enough')}
                      </>
                    )}
                  </button>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
