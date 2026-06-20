import { useExpeditionStore } from '../store';
import { motion } from 'motion/react';
import { FlaskConical, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Card, Badge, Progress, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '../ui';
import type { Rarity } from '../data';
import { useTickValue } from '../useTick';
import { useTranslation } from '../../i18n';

const rarityConfig: Record<Rarity, { color: string; labelKey: string }> = {
  common: { color: '#8B949E', labelKey: 'artifacts.rarity_common' },
  rare: { color: '#00E5FF', labelKey: 'artifacts.rarity_rare' },
  epic: { color: '#9747FF', labelKey: 'artifacts.rarity_epic' },
  legendary: { color: '#FF2A5F', labelKey: 'artifacts.rarity_legendary' },
};

export function Laboratory() {
  const { t } = useTranslation();
  const artifacts = useExpeditionStore((s) => s.artifacts);
  const beginRestoration = useExpeditionStore((s) => s.beginRestoration);
  const sendToMuseum = useExpeditionStore((s) => s.sendToMuseum);
  const now = useTickValue();

  const damaged = artifacts.filter((a) => a.status === 'damaged');
  const restoring = artifacts.filter((a) => a.status === 'restoring');
  const restored = artifacts.filter((a) => a.status === 'restored');

  return (
    <div className="min-h-full bg-[#0D1117] p-4 pb-20">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFC72C20', border: '1px solid #FFC72C' }}>
            <FlaskConical className="w-6 h-6" style={{ color: '#FFC72C' }} />
          </div>
          <div>
            <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('expedition.laboratory_title')}</h1>
            <p className="text-xs text-muted-foreground">{t('expedition.restoration_queue')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Card className="border-white/10 p-2 text-center">
            <div className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FF2A5F' }}>{damaged.length}</div>
            <div className="text-[10px] text-muted-foreground">{t('laboratory.damaged')}</div>
          </Card>
          <Card className="border-white/10 p-2 text-center">
            <div className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{restoring.length}</div>
            <div className="text-[10px] text-muted-foreground">{t('laboratory.in_progress')}</div>
          </Card>
          <Card className="border-white/10 p-2 text-center">
            <div className="text-lg" style={{ fontFamily: "'Exo 2', sans-serif", color: '#00E5FF' }}>{restored.length}</div>
            <div className="text-[10px] text-muted-foreground">{t('laboratory.ready')}</div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="restoring" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#161B22] mb-4">
          <TabsTrigger value="damaged" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('laboratory.damaged')}</TabsTrigger>
          <TabsTrigger value="restoring" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('laboratory.in_progress')}</TabsTrigger>
          <TabsTrigger value="restored" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('laboratory.ready')}</TabsTrigger>
        </TabsList>

        <TabsContent value="damaged" className="space-y-3">
          {damaged.length === 0 ? (
            <Card className="border-white/10 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2" style={{ color: '#00E5FF' }} />
              <p className="text-sm text-muted-foreground">{t('laboratory.no_damaged')}</p>
            </Card>
          ) : (
            damaged.map((artifact, index) => (
              <motion.div key={artifact.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                <Card className="border-white/10 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm mb-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>{artifact.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{artifact.era}</p>
                    </div>
                    <Badge style={{ backgroundColor: rarityConfig[artifact.rarity].color, color: '#0D1117' }}>{t(rarityConfig[artifact.rarity].labelKey)}</Badge>
                  </div>
                  <p className="text-xs mb-3 leading-relaxed text-muted-foreground">{artifact.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#0D1117] rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">{t('common.value')}</div>
                      <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{artifact.value.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#0D1117] rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">{t('expedition.historical_prestige')}</div>
                      <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FF2A5F' }}>+{artifact.prestigeBonus}</div>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => beginRestoration(artifact.id)} style={{ backgroundColor: '#FFC72C', color: '#0D1117', fontFamily: "'Exo 2', sans-serif" }}>
                    <FlaskConical className="w-4 h-4 mr-2" />
                    {t('expedition.start_restoration')}
                  </Button>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="restoring" className="space-y-3">
          {restoring.length === 0 ? (
            <Card className="border-white/10 p-8 text-center">
              <FlaskConical className="w-12 h-12 mx-auto mb-2" style={{ color: '#FFC72C' }} />
              <p className="text-sm text-muted-foreground">{t('laboratory.no_active')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('laboratory.select_damaged')}</p>
            </Card>
          ) : (
            restoring.map((artifact, index) => {
              const total = (artifact.restoreEndsAt || 0) - (artifact.restoreStartedAt || 0);
              const elapsed = now - (artifact.restoreStartedAt || 0);
              const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;
              const remaining = Math.max(0, Math.ceil(((artifact.restoreEndsAt || 0) - now) / 1000));
              return (
                <motion.div key={artifact.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                  <Card className="border-2 p-4" style={{ borderColor: '#FFC72C' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFC72C' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                          <h3 className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>{artifact.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{artifact.era}</p>
                        {artifact.restoredBy && <p className="text-xs" style={{ color: '#FFC72C' }}>{artifact.restoredBy}</p>}
                      </div>
                      <Badge style={{ backgroundColor: rarityConfig[artifact.rarity].color, color: '#0D1117' }}>{t(rarityConfig[artifact.rarity].labelKey)}</Badge>
                    </div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('common.progress')}</span>
                      <span className="text-xs" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{Math.floor(pct)}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t('common.remaining')}: {remaining}{t('common.per_second').replace('/', '')}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="restored" className="space-y-3">
          {restored.length === 0 ? (
            <Card className="border-white/10 p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('laboratory.no_completed')}</p>
            </Card>
          ) : (
            restored.map((artifact, index) => (
              <motion.div key={artifact.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                <Card className="border-2 p-4" style={{ borderColor: '#00E5FF' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#00E5FF' }} />
                        <h3 className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>{artifact.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{artifact.era}</p>
                    </div>
                    <Badge style={{ backgroundColor: rarityConfig[artifact.rarity].color, color: '#0D1117' }}>{t(rarityConfig[artifact.rarity].labelKey)}</Badge>
                  </div>
                  <p className="text-xs mb-3 leading-relaxed text-muted-foreground">{artifact.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#0D1117] rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">{t('common.value')}</div>
                      <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>{artifact.value.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#0D1117] rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">{t('expedition.historical_prestige')}</div>
                      <div className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FF2A5F' }}>+{artifact.prestigeBonus}</div>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => sendToMuseum(artifact.id)} style={{ backgroundColor: '#9747FF', color: '#fff', fontFamily: "'Exo 2', sans-serif" }}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('expedition.send_to_museum')}
                  </Button>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
