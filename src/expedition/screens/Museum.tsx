import { useState } from 'react';
import { useExpeditionStore } from '../store';
import { Landmark, Settings } from 'lucide-react';
import { Card } from '../ui';
import { MuseumSystem } from '../components/MuseumSystem';
import { useTranslation } from '../../i18n';
import { getReputationLevel } from '../museumData';

export function Museum() {
  const { t } = useTranslation();
  const [showFullMuseum, setShowFullMuseum] = useState(false);

  const artifacts = useExpeditionStore((s) => s.artifacts);
  const museumState = useExpeditionStore((s) => s.museumState);

  const museumArtifacts = artifacts.filter((a) => a.status === 'museum');
  const totalValue = museumArtifacts.reduce((sum, a) => sum + a.value, 0);
  const exhibitedCount = museumState.exhibitions.filter((ex) => ex.artifactId).length;
  const repLevel = getReputationLevel(museumState.reputation);

  return (
    <>
      <div className="min-h-full bg-[#0D1117] p-4 pb-20">
        {/* Header with Full System Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#9747FF20', border: '1px solid #9747FF' }}>
              <Landmark className="w-6 h-6" style={{ color: '#9747FF' }} />
            </div>
            <div>
              <h1 className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif" }}>{t('museum.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('museum.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowFullMuseum(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ backgroundColor: '#9747FF20', border: '1px solid #9747FF' }}
          >
            <Settings className="w-4 h-4" style={{ color: '#9747FF' }} />
            <span className="text-sm" style={{ color: '#9747FF' }}>{t('museum.open_system')}</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="border-white/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('museum.exhibits')}</div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#9747FF' }}>
              {exhibitedCount} / {museumState.exhibitions.length}
            </div>
          </Card>
          <Card className="border-white/10 p-3">
            <div className="text-xs text-muted-foreground mb-1">{t('museum.reputation_level')}</div>
            <div className="text-xl" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {repLevel.level}
            </div>
          </Card>
        </div>

        {/* Collection Progress */}
        <Card className="border-white/10 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">{t('museum.collections')}</span>
            <span className="text-sm" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {museumState.completedCollections.length} / 5
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded"
                style={{
                  backgroundColor: museumState.completedCollections.length >= i ? '#FFC72C' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </Card>

        {/* Museum Value */}
        <Card className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border-white/10 p-4 mb-4">
          <div className="text-center">
            <div className="text-3xl mb-1" style={{ fontFamily: "'Exo 2', sans-serif", color: '#FFC72C' }}>
              {totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{t('museum.total_collection_value')}</p>
          </div>
        </Card>

        {/* Quick Actions */}
        <button
          onClick={() => setShowFullMuseum(true)}
          className="w-full py-4 rounded-xl font-bold text-lg"
          style={{ backgroundColor: '#9747FF', color: '#fff' }}
        >
          🏛️ {t('museum.open_museum_system')}
        </button>

        {/* Open Full Museum System Modal */}
        <MuseumSystem isOpen={showFullMuseum} onClose={() => setShowFullMuseum(false)} />
      </div>
    </>
  );
}
