import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import {
  FlaskConical,
  Shield,
  BookOpen,
  Hammer,
  User,
  Sword,
  GraduationCap,
  X,
  MessageCircle,
  Coins,
  Briefcase,
  Pause,
} from 'lucide-react';
import { useExpeditionStore } from '../store';
import { npcColors, type Npc, type NpcRole } from '../data';
import { Button } from '../ui';
import { useTranslation } from '../../i18n';

const roleIcons: Record<NpcRole, typeof Shield> = {
  researcher: FlaskConical,
  guard: GraduationCap,
  archivist: BookOpen,
  restorer: Hammer,
  visitor: User,
  cossack: Sword,
};

function NpcMarker({ npc, onClick }: { npc: Npc; onClick: () => void }) {
  const Icon = roleIcons[npc.role];
  const color = npcColors[npc.role];
  return (
    <button
      onClick={onClick}
      className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
      style={{ left: `${npc.x}%`, top: `${npc.y}%` }}
    >
      <motion.div
        className="relative w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: `${color}22`,
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 10px ${color}80`,
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
        {npc.working && (
          <motion.span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </motion.div>
      <span
        className="mt-0.5 text-[8px] px-1 rounded whitespace-nowrap opacity-80 group-hover:opacity-100"
        style={{ color, backgroundColor: '#0D1117cc' }}
      >
        {npc.name}
      </span>
    </button>
  );
}

function NpcCard({ npc, onClick, t }: { npc: Npc; onClick: () => void; t: (key: string) => string }) {
  const Icon = roleIcons[npc.role];
  const color = npcColors[npc.role];
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-2 rounded-xl border bg-[#0D1117]/70 text-left transition-colors hover:bg-[#0D1117]"
      style={{ borderColor: `${color}55` }}
    >
      <span
        className="relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}22`, border: `1px solid ${color}` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
        {npc.working && (
          <motion.span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: '#10B981', boxShadow: '0 0 6px #10B981' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-xs truncate"
          style={{ fontFamily: "'Exo 2', sans-serif", color: '#E6EDF3' }}
        >
          {npc.name}
        </span>
        <span className="block text-[10px] text-muted-foreground truncate">{npc.roleLabel}</span>
      </span>
      <span
        className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
        style={{
          color: npc.working ? '#10B981' : '#8B949E',
          backgroundColor: npc.working ? '#10B98122' : '#30363D',
        }}
      >
        {npc.working ? t('expedition.npc_work') : t('expedition.npc_free')}
      </span>
    </button>
  );
}

export function NPCSystem() {
  const { t } = useTranslation();
  const npcs = useExpeditionStore((s) => s.npcs);
  const toggleNpcWork = useExpeditionStore((s) => s.toggleNpcWork);
  const collectNpc = useExpeditionStore((s) => s.collectNpc);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [line, setLine] = useState<string>('');

  const selected = npcs.find((n) => n.id === selectedId) || null;
  const color = selected ? npcColors[selected.role] : '#FFC72C';
  const Icon = selected ? roleIcons[selected.role] : User;

  const open = (npc: Npc) => {
    setSelectedId(npc.id);
    setLine(npc.dialogues[Math.floor(Math.random() * npc.dialogues.length)]);
  };

  const talk = () => {
    if (!selected) return;
    const others = selected.dialogues.filter((d) => d !== line);
    const pool = others.length ? others : selected.dialogues;
    setLine(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <div className="relative z-10 mt-6">
      <h2 className="text-lg mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        {t('expedition.npc_title')}
      </h2>

      {/* Animated courtyard scene */}
      <div
        className="relative h-40 rounded-2xl border border-white/10 overflow-hidden mb-3"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, rgba(255,199,44,0.06), transparent 60%), linear-gradient(180deg, #161B22 0%, #0D1117 100%)',
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-12"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.05))' }}
        />
        {npcs.map((npc) => (
          <NpcMarker key={npc.id} npc={npc} onClick={() => open(npc)} />
        ))}
        <span className="absolute top-1.5 right-2.5 text-[9px] text-muted-foreground">
          {t('npc.courtyard')}
        </span>
      </div>

      {/* Reliable tappable roster */}
      <div className="grid grid-cols-2 gap-2">
        {npcs.map((npc) => (
          <NpcCard key={npc.id} npc={npc} onClick={() => open(npc)} t={t} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        {t('npc.instruction')}
      </p>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              className="w-full max-w-sm bg-[#161B22] rounded-t-2xl border-t-2 p-4 mb-0"
              style={{ borderColor: color }}
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}22`, border: `1px solid ${color}` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base" style={{ fontFamily: "'Exo 2', sans-serif", color }}>
                    {selected.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{selected.roleLabel}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="p-1 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dialogue bubble */}
              <div className="bg-[#0D1117] rounded-xl p-3 mb-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-[10px] text-muted-foreground">{t('npc.dialogue')}</span>
                </div>
                <p className="text-sm leading-relaxed">«{line}»</p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between bg-[#0D1117] rounded-xl p-3 mb-3 border border-white/5">
                <div className="text-xs text-muted-foreground">
                  {t('npc.income')}: <span style={{ color: '#FFC72C' }}>{selected.ratePerMin}{t('common.per_minute')}</span>{' '}
                  · {t('npc.reputation')}: <span style={{ color: '#FF2A5F' }}>{selected.repPerMin}{t('common.per_minute')}</span>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{
                    color: selected.working ? '#10B981' : '#8B949E',
                    backgroundColor: selected.working ? '#10B98122' : '#30363D',
                  }}
                >
                  {selected.working ? t('expedition.npc_work') : t('npc.resting')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={talk}
                  style={{ borderColor: color, color }}
                  className="flex-col gap-1 py-2 text-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('expedition.npc_talk')}
                </Button>
                <Button
                  onClick={() => toggleNpcWork(selected.id)}
                  style={{
                    backgroundColor: selected.working ? '#30363D' : '#FFC72C',
                    color: selected.working ? '#E6EDF3' : '#0D1117',
                  }}
                  className="flex-col gap-1 py-2 text-xs"
                >
                  {selected.working ? <Pause className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  {selected.working ? t('expedition.npc_stop') : t('expedition.npc_assign')}
                </Button>
                <Button
                  onClick={() => collectNpc(selected.id)}
                  style={{ backgroundColor: '#00E5FF', color: '#0D1117' }}
                  className="flex-col gap-1 py-2 text-xs"
                  disabled={!selected.working}
                >
                  <Coins className="w-4 h-4" />
                  {t('expedition.npc_collect')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
