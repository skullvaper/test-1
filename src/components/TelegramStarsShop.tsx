import { useState, useCallback } from 'react';
import { Star, Gift, Zap, Coins, Shield, Clock, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '../i18n';
import { hapticImpact } from '../lib/telegram';

interface TelegramStarsShopProps {
  onPurchaseComplete?: (boosterId: string) => void;
  className?: string;
}

// Shop categories and items
export interface ShopItem {
  id: string;
  nameKey: string;
  descriptionKey: string;
  price: number; // Telegram Stars
  icon: typeof Star;
  category: 'resources' | 'boosters' | 'premium' | 'starter';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  effects: {
    type: 'currency' | 'xp_boost' | 'currency_boost' | 'energy' | 'offline' | 'expedition' | 'prestige';
    value: number;
    duration?: number; // minutes
  }[];
  limit?: {
    type: 'daily' | 'weekly' | 'once';
    max?: number;
  };
  cooldownMinutes?: number;
}

const SHOP_ITEMS: ShopItem[] = [
  // Starter Packs
  {
    id: 'starter_pack_basic',
    nameKey: 'shop.starter_basic_name',
    descriptionKey: 'shop.starter_basic_desc',
    price: 10,
    icon: Gift,
    category: 'starter',
    rarity: 'common',
    effects: [
      { type: 'currency', value: 1000 },
      { type: 'xp_boost', value: 2, duration: 30 },
    ],
    limit: { type: 'once' },
  },
  {
    id: 'starter_pack_plus',
    nameKey: 'shop.starter_plus_name',
    descriptionKey: 'shop.starter_plus_desc',
    price: 50,
    icon: Gift,
    category: 'starter',
    rarity: 'rare',
    effects: [
      { type: 'currency', value: 10000 },
      { type: 'xp_boost', value: 3, duration: 60 },
      { type: 'currency_boost', value: 2, duration: 60 },
    ],
    limit: { type: 'once' },
  },
  
  // Resources
  {
    id: 'currency_pack_small',
    nameKey: 'shop.currency_small_name',
    descriptionKey: 'shop.currency_small_desc',
    price: 5,
    icon: Coins,
    category: 'resources',
    effects: [{ type: 'currency', value: 500 }],
    limit: { type: 'daily', max: 10 },
  },
  {
    id: 'currency_pack_medium',
    nameKey: 'shop.currency_medium_name',
    descriptionKey: 'shop.currency_medium_desc',
    price: 20,
    icon: Coins,
    category: 'resources',
    effects: [{ type: 'currency', value: 5000 }],
    limit: { type: 'daily', max: 5 },
  },
  {
    id: 'currency_pack_large',
    nameKey: 'shop.currency_large_name',
    descriptionKey: 'shop.currency_large_desc',
    price: 100,
    icon: Coins,
    category: 'resources',
    rarity: 'rare',
    effects: [{ type: 'currency', value: 50000 }],
    limit: { type: 'daily', max: 2 },
  },
  
  // Boosters
  {
    id: 'xp_boost_1h',
    nameKey: 'shop.xp_boost_name',
    descriptionKey: 'shop.xp_boost_desc',
    price: 15,
    icon: Zap,
    category: 'boosters',
    effects: [{ type: 'xp_boost', value: 3, duration: 60 }],
    limit: { type: 'daily', max: 3 },
    cooldownMinutes: 60,
  },
  {
    id: 'currency_boost_1h',
    nameKey: 'shop.currency_boost_name',
    descriptionKey: 'shop.currency_boost_desc',
    price: 15,
    icon: Coins,
    category: 'boosters',
    effects: [{ type: 'currency_boost', value: 3, duration: 60 }],
    limit: { type: 'daily', max: 3 },
    cooldownMinutes: 60,
  },
  {
    id: 'expedition_speedup',
    nameKey: 'shop.expedition_speedup_name',
    descriptionKey: 'shop.expedition_speedup_desc',
    price: 25,
    icon: Clock,
    category: 'boosters',
    effects: [{ type: 'expedition', value: 2 }],
    limit: { type: 'daily', max: 5 },
  },
  {
    id: 'energy_restore',
    nameKey: 'shop.energy_restore_name',
    descriptionKey: 'shop.energy_restore_desc',
    price: 10,
    icon: Zap,
    category: 'boosters',
    effects: [{ type: 'energy', value: 500 }],
    limit: { type: 'daily', max: 3 },
  },
  
  // Premium
  {
    id: 'great_patron',
    nameKey: 'shop.patron_name',
    descriptionKey: 'shop.patron_desc',
    price: 200,
    icon: Shield,
    category: 'premium',
    rarity: 'epic',
    effects: [
      { type: 'offline', value: 9 }, // 9 hour offline cap
      { type: 'currency', value: 100000 },
    ],
    limit: { type: 'once' },
  },
  {
    id: 'support_dev',
    nameKey: 'shop.support_name',
    descriptionKey: 'shop.support_desc',
    price: 100,
    icon: Star,
    category: 'premium',
    rarity: 'legendary',
    effects: [
      { type: 'xp_boost', value: 5, duration: 120 },
      { type: 'currency', value: 50000 },
    ],
    limit: { type: 'once' },
  },
];

const CATEGORY_ORDER: ShopItem['category'][] = ['starter', 'resources', 'boosters', 'premium'];

const rarityColors: Record<string, string> = {
  common: '#8B949E',
  rare: '#00E5FF',
  epic: '#9747FF',
  legendary: '#FFC72C',
};

export function TelegramStarsShop({ onPurchaseComplete, className = '' }: TelegramStarsShopProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ShopItem['category']>('starter');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const categories = CATEGORY_ORDER.map(cat => ({
    id: cat,
    labelKey: `shop.category_${cat}`,
  }));

  const filteredItems = SHOP_ITEMS.filter(item => item.category === activeCategory);

  const handlePurchase = useCallback(async (item: ShopItem) => {
    hapticImpact('medium');
    setPurchasingId(item.id);
    setPurchaseError(null);
    setPurchaseSuccess(null);

    try {
      // In a real implementation, this would:
      // 1. Create a Telegram payment invoice using the Bot API
      // 2. Open the payment form
      // 3. Wait for payment confirmation
      // 4. Validate the payment with the server
      
      // For now, we'll simulate the purchase flow
      // In production, use: window.Telegram.WebApp.openTelegramLink() or openInvoice()
      
      // Example of how Telegram Stars payment would work:
      // const invoicePayload = JSON.stringify({ boosterId: item.id, type: 'stars' });
      // const providerToken = 'YOUR_PROVIDER_TOKEN'; // From @BotFather
      // window.Telegram.WebApp.openInvoice(`https://t.me/${botUsername}/${item.id}`, invoicePayload);

      // Simulate purchase for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPurchaseSuccess(item.id);
      onPurchaseComplete?.(item.id);
      
      // Clear success message after 3 seconds
      setTimeout(() => setPurchaseSuccess(null), 3000);
      
    } catch (err) {
      console.error('Purchase failed:', err);
      setPurchaseError(t('shop.purchase_failed'));
    } finally {
      setPurchasingId(null);
    }
  }, [onPurchaseComplete, t]);

  const getItemLimitText = (item: ShopItem): string | null => {
    if (!item.limit) return null;
    
    switch (item.limit.type) {
      case 'once':
        return t('shop.limit_once');
      case 'daily':
        return t('shop.limit_daily', { max: item.limit.max });
      case 'weekly':
        return t('shop.limit_weekly', { max: item.limit.max });
      default:
        return null;
    }
  };

  return (
    <div className={`bg-gray-900 rounded-2xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-6 h-6 text-yellow-400" />
        <h2 className="text-lg font-bold text-white">{t('shop.title')}</h2>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.map(item => {
          const IconComponent = item.icon;
          const isPurchasing = purchasingId === item.id;
          const isSuccess = purchaseSuccess === item.id;
          const isError = purchaseError && !isPurchasing;
          const rarityColor = item.rarity ? rarityColors[item.rarity] : '#8B949E';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div
                className={`relative rounded-xl p-3 border-2 transition-all ${
                  isSuccess
                    ? 'border-green-500 bg-green-500/10'
                    : isError
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                style={{
                  borderColor: isSuccess ? '#22C55E' : isError ? '#EF4444' : item.rarity ? rarityColor + '40' : undefined,
                }}
              >
                {/* Success overlay */}
                {isSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                )}

                {/* Rarity indicator */}
                {item.rarity && (
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: rarityColor }}
                  />
                )}

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: rarityColor + '20',
                    border: `1px solid ${rarityColor}40`,
                  }}
                >
                  <IconComponent className="w-5 h-5" style={{ color: rarityColor }} />
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-white mb-1">
                  {t(item.nameKey)}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                  {t(item.descriptionKey)}
                </p>

                {/* Price */}
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">
                    {item.price}
                  </span>
                </div>

                {/* Limit */}
                {item.limit && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Lock className="w-3 h-3" />
                    <span>{getItemLimitText(item)}</span>
                  </div>
                )}

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isPurchasing || isSuccess}
                  className={`w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isPurchasing
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : isSuccess
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95'
                  }`}
                >
                  {isPurchasing ? (
                    <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  ) : isSuccess ? (
                    <CheckCircle className="w-4 h-4 mx-auto" />
                  ) : (
                    t('shop.buy')
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error Message */}
      {purchaseError && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {purchaseError}
        </div>
      )}

      {/* Footer */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        {t('shop.footer')}
      </p>
    </div>
  );
}

export { SHOP_ITEMS };
