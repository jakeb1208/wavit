import { Shop } from '../types';
import { useQueueStore } from '../store/queueStore';

interface ShopCardProps {
  shop: Shop;
  showJoinLink?: boolean;
}

export default function ShopCard({ shop, showJoinLink = false }: ShopCardProps) {
  const calcWaitRange = useQueueStore(s => s.calcWaitRange);
  const activeQueue = shop.queue.filter(t => !t.exitedAt);
  const waitRange = calcWaitRange(shop);

  const queueColor =
    activeQueue.length === 0
      ? 'text-emerald-600 bg-emerald-50'
      : activeQueue.length <= 3
        ? 'text-amber-600 bg-amber-50'
        : 'text-red-600 bg-red-50';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{shop.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
              {shop.category}
            </span>
          </div>
          <p className="text-sm text-gray-500">{shop.phone}</p>
          <p className="text-xs text-gray-400 mt-1">Avg service: {shop.avgServiceMinutes} min</p>
        </div>

        <div className="text-right shrink-0">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold ${queueColor}`}>
            {waitRange}
          </span>
          <p className="text-xs text-gray-400 mt-1.5">{activeQueue.length} in queue</p>
        </div>
      </div>

      {showJoinLink && activeQueue.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400 italic">
            📱 Join available via QR code at the storefront
          </p>
        </div>
      )}
    </div>
  );
}
