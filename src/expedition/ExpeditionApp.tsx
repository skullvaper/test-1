import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Map, Users, FlaskConical, Landmark, HardHat, Gift } from 'lucide-react';
import { useExpeditionStore } from './store';
import { useAcademySync } from './expeditionSync';
import { Academy } from './screens/Academy';
import { WorldMap } from './screens/WorldMap';
import { Heroes } from './screens/Heroes';
import { Laboratory } from './screens/Laboratory';
import { Museum } from './screens/Museum';
import { Treasury } from './screens/Treasury';
import { Buildings } from './screens/Buildings';
import { DailyRewards } from './screens/DailyRewards';

type ScreenId = 'academy' | 'map' | 'heroes' | 'laboratory' | 'museum' | 'treasury' | 'buildings' | 'daily';

const navigation: { id: ScreenId; name: string; icon: typeof Map }[] = [
  { id: 'academy', name: 'Академія', icon: Building2 },
  { id: 'map', name: 'Карта', icon: Map },
  { id: 'heroes', name: 'Герої', icon: Users },
  { id: 'laboratory', name: 'Лаб', icon: FlaskConical },
  { id: 'museum', name: 'Музей', icon: Landmark },
  { id: 'daily', name: 'Нагороди', icon: Gift },
  { id: 'buildings', name: 'Будівлі', icon: HardHat },
];

function ToastStack() {
  const toasts = useExpeditionStore((s) => s.toasts);
  const dismissToast = useExpeditionStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) => setTimeout(() => dismissToast(t.id), 3500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[360px] px-2 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-xl px-3 py-2 text-sm shadow-lg border bg-[#161B22]"
            style={{ borderColor: t.color, color: '#E6EDF3' }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ExpeditionApp() {
  const tick = useExpeditionStore((s) => s.tick);
  const [screen, setScreen] = useState<ScreenId>('academy');
  
  // Supabase sync - loads from server and syncs changes
  const { syncToServer } = useAcademySync();

  useEffect(() => {
    tick();
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Sync to Supabase periodically + on page unload
  useEffect(() => {
    syncToServer();
    const syncInterval = setInterval(() => syncToServer(), 30000);
    
    // Sync on page unload
    const handleUnload = () => syncToServer();
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [syncToServer]);

  return (
    <div
      className="expedition-root h-screen w-full overflow-hidden flex flex-col bg-[#0D1117] text-foreground mx-auto"
      style={{ maxWidth: '430px' }}
    >
      <ToastStack />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {screen === 'academy' && <Academy />}
        {screen === 'map' && <WorldMap />}
        {screen === 'heroes' && <Heroes />}
        {screen === 'laboratory' && <Laboratory />}
        {screen === 'museum' && <Museum />}
        {screen === 'daily' && <DailyRewards />}
        {screen === 'treasury' && <Treasury />}
        {screen === 'buildings' && <Buildings />}
      </div>

      <nav className="bg-[#161B22] border-t border-white/10 shrink-0">
        <div className="grid grid-cols-7 h-16">
          {navigation.map((item) => {
            const isActive = screen === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                className="relative flex flex-col items-center justify-center gap-1 px-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeExpTab"
                    className="absolute inset-0 bg-primary/10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span
                  className={`text-[10px] relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
