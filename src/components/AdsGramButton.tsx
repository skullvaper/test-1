// AdsGramButton component - wrapper for showing reward ads
import { useState, useCallback } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { showRewardAd, AdShowResult, initAdsgram } from '../services/adsgram';
import { hapticNotification } from '../lib/telegram';

interface AdsGramButtonProps {
  onReward: () => void | Promise<void>;
  onClose?: () => void;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
}

export function AdsGramButton({
  onReward,
  onClose,
  disabled = false,
  label = 'Переглянути рекламу',
  icon,
  variant = 'default',
}: AdsGramButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      // Initialize ADSGRAM if not already
      await initAdsgram();

      // Show the ad
      const result = await showRewardAd();

      switch (result) {
        case AdShowResult.COMPLETED:
          hapticNotification('success');
          await onReward();
          onClose?.();
          break;
        
        case AdShowResult.CLOSED:
          hapticNotification('warning');
          setError('Рекламу закрито достроково');
          break;
        
        case AdShowResult.NO_AD:
          hapticNotification('warning');
          setError('Реклама недоступна');
          break;
        
        case AdShowResult.NOT_INITIALIZED:
          hapticNotification('error');
          setError('Помилка ініціалізації');
          break;
        
        case AdShowResult.ERROR:
        default:
          hapticNotification('error');
          setError('Помилка показу реклами');
          break;
      }
    } catch (err) {
      console.error('AdsGramButton error:', err);
      hapticNotification('error');
      setError('Сталася помилка');
    } finally {
      setLoading(false);
    }
  }, [loading, disabled, onReward, onClose]);

  const baseClasses = 'flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const variantClasses = {
    default: 'bg-yellow-500 text-black hover:bg-yellow-400',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600',
    outline: 'border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10',
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} w-full`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : icon ? (
          icon
        ) : (
          <Play className="w-5 h-5" />
        )}
        <span>{loading ? 'Завантаження...' : label}</span>
      </button>
      
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
