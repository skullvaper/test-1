import { useExpeditionStore } from '../store';
import { expeditionSeconds } from '../store';
import { motion } from 'motion/react';
import { MapPin, Clock, Star, Lock, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, Badge, Button, Progress } from '../ui';
import { useState } from 'react';
import { UkrainianPattern } from '../components/UkrainianPattern';
import { useTickValue } from '../useTick';
import { useTranslation } from '../../i18n';

export function WorldMap() {
  const { t } = useTranslation();
  const regions = useExpeditionStore((s) => s.regions);
  const heroes = useExpeditionStore((s) => s.heroes);
  const expeditions = useExpeditionStore((s) => s.expeditions);
  const startExpedition = useExpeditionStore((s) => s.startExpedition);
  const collectExpedition = useExpeditionStore((s) => s.collectExpedition);

  const [selectedRegionId, setSelectedRegionId] = useState(regions[0].id);
  const [team, setTeam] = useState<string[]>([]);
  const now = useTickValue();

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const availableHeroes = heroes.filter((h) => !h.assigned);
  const activeExpeditions = expeditions.filter((e) => !e.collected);

  const toggleHero = (id: string) => {
    setTeam((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  };

  const handleStart = () => {
    if (startExpedition(selectedRegion.id, team)) {
      setTeam([]);
    }
  };

  const getStatusLabel = (status: string, ready: boolean) => {
    if (ready) return t('expedition.status_completed');
    switch (status) {
      case 'returning': return t('expedition.status_returning');
      case 'excavating': return t('expedition.status_excavating');
      default: return t('expedition.status_traveling');
    }
  };

  return (
    <div className="min-h-full bg-[#0D1117] relative overflow-hidden">
      <UkrainianPattern opacity={0.03} />

      {/* Map */}
      <div className="h-[260px] relative bg-gradient-to-b from-[#161B22] to-[#0D1117] border-b border-white/10">
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 390 260">
            <path
              d="M 50 130 Q 100 110, 150 120 T 250 130 Q 300 140, 340 120 L 350 150 Q 320 170, 280 180 T 200 190 Q 150 200, 100 180 L 80 160 Z"
              fill="none"
              stroke="#FFC72C"
              strokeWidth="2"
              opacity="0.3"
            />
            {regions.map((region, index) => {
              const angle = (index / regions.length) * Math.PI * 1.5 + Math.PI / 6;
              const radius = 60 + (index % 2) * 24;
              const x = 195 + Math.cos(angle) * radius;
              const y = 140 + Math.sin(angle) * radius;
              return (
                <g key={region.id}>
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={region.unlocked ? '#FFC72C' : '#30363D'}
                    stroke={selectedRegion.id === region.id ? '#00E5FF' : 'transparent'}
                    strokeWidth="3"
                    style={{ cursor: region.unlocked ? 'pointer' : 'default' }}
                    onClick={() => region.unlocked && setSelectedRegionId(region.id)}
                    animate={{ scale: selectedRegion.id === region.id ? [1, 1.2, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  {!region.unlocked && <Lock x={x - 6} y={y - 6} size={12} className="text-muted-foreground" />}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="absolute top-4 left-4 right-4">
          <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
            {t('expedition.world_map_title')}
          </h1>
          <p className="text-xs text-muted-foreground">{t('expedition.select_region')}</p>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Active expeditions */}
        {activeExpeditions.length > 0 && (
          <div className="mb-4 space-y-2">
            <h2 className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              {t('expedition.expedition_active')} ({activeExpeditions.length}/{useExpeditionStore.getState().expeditionSlots})
            </h2>
            {activeExpeditions.map((exp) => {
              const remaining = Math.max(0, Math.ceil((exp.endsAt - now) / 1000));
              const ratio = Math.min(100, ((exp.duration * 1000 - (exp.endsAt - now)) / (exp.duration * 1000)) * 100);
              const ready = now >= exp.endsAt;
              return (
                <Card key={exp.id} className="border-2 p-3" style={{ borderColor: ready ? '#10B981' : '#FFC72C' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>{exp.region}</span>
                    <Badge style={{ backgroundColor: ready ? '#10B981' : '#FFC72C', color: '#0D1117' }}>
                      {getStatusLabel(exp.status, ready)}
                    </Badge>
                  </div>
                  <Progress value={ready ? 100 : ratio} className="h-1.5 mb-2" />
                  {ready ? (
                    <Button
                      className="w-full"
                      onClick={() => collectExpedition(exp.id)}
                      style={{ backgroundColor: '#10B981', color: '#0D1117', fontFamily: "'Exo 2', sans-serif" }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('expedition.collect_result')}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {t('common.remaining')}: {remaining}{t('common.per_second')} · {t('expedition.success_chance')}: {exp.successChance}%
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <motion.div key={selectedRegion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-white/10 p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>{selectedRegion.name}</h2>
                <p className="text-xs text-muted-foreground mb-2">{selectedRegion.era}</p>
              </div>
              <Badge className="px-2 py-1" style={{ backgroundColor: '#FFC72C', color: '#0D1117' }}>
                {t('expedition.difficulty')} {selectedRegion.difficulty}
              </Badge>
            </div>

            <p className="text-sm mb-4 leading-relaxed">{selectedRegion.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0D1117] rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3" style={{ color: '#00E5FF' }} />
                  <span className="text-xs text-muted-foreground">{t('common.duration')}</span>
                </div>
                <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>
                  {expeditionSeconds(selectedRegion)}{t('common.per_second').replace('/', '')}
                </div>
              </div>
              <div className="bg-[#0D1117] rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3" style={{ color: '#FFC72C' }} />
                  <span className="text-xs text-muted-foreground">{t('expedition.base_chance')}</span>
                </div>
                <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
                  {selectedRegion.successChance}%
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4" style={{ color: '#FF2A5F' }} />
                <span className="text-xs" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('expedition.possible_artifacts')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedRegion.artifacts.map((artifact, index) => (
                  <Badge key={index} variant="outline" className="text-[10px]" style={{ borderColor: '#FF2A5F', color: '#FF2A5F' }}>
                    {artifact}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Team selection */}
            {selectedRegion.unlocked && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" style={{ color: '#9747FF' }} />
                  <span className="text-xs" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    {t('expedition.team')} ({team.length} {t('expedition.team_selected')})
                  </span>
                </div>
                {availableHeroes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('expedition.no_heroes_available')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableHeroes.map((h) => {
                      const sel = team.includes(h.id);
                      return (
                        <button
                          key={h.id}
                          onClick={() => toggleHero(h.id)}
                          className="text-[10px] px-2 py-1 rounded-md border transition-all"
                          style={{
                            borderColor: sel ? '#00E5FF' : 'rgba(255,255,255,0.15)',
                            backgroundColor: sel ? '#00E5FF22' : 'transparent',
                            color: sel ? '#00E5FF' : '#8B949E',
                          }}
                        >
                          {h.name} · {t('common.level')} {h.level}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedRegion.unlocked ? (
              <Button className="w-full" onClick={handleStart} style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontFamily: "'Exo 2', sans-serif" }}>
                <MapPin className="w-4 h-4 mr-2" />
                {t('expedition.start_expedition')}
              </Button>
            ) : (
              <Button className="w-full" disabled style={{ backgroundColor: '#30363D', color: '#8B949E', fontFamily: "'Exo 2', sans-serif" }}>
                <Lock className="w-4 h-4 mr-2" />
                {t('common.locked')}
              </Button>
            )}
          </Card>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {regions.map((region) => (
              <motion.div
                key={region.id}
                className="flex-shrink-0 w-12 h-12 rounded border cursor-pointer flex items-center justify-center"
                style={{
                  borderColor: selectedRegion.id === region.id ? '#00E5FF' : 'rgba(255,255,255,0.1)',
                  backgroundColor: region.unlocked ? '#161B22' : '#0D1117',
                }}
                onClick={() => region.unlocked && setSelectedRegionId(region.id)}
                whileTap={{ scale: 0.95 }}
              >
                {region.unlocked ? (
                  <MapPin className="w-5 h-5" style={{ color: '#FFC72C' }} />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
