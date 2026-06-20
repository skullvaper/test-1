import { useExpeditionStore } from './store';

/**
 * Returns the store's `lastTick` timestamp, which advances once per second while
 * the game loop runs. Components that read this re-render every tick — handy for
 * live countdowns and progress bars.
 */
export function useTickValue(): number {
  return useExpeditionStore((s) => s.lastTick);
}
