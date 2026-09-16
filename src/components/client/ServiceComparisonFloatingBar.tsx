import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { ServiceItem } from '../../types';
import { Scale, X, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceComparisonFloatingBarProps {
  comparedServices: ServiceItem[];
  onOpenCompareModal: () => void;
  onRemoveService: (serviceId: string) => void;
  onClearAll: () => void;
}

export const ServiceComparisonFloatingBar: React.FC<ServiceComparisonFloatingBarProps> = ({
  comparedServices,
  onOpenCompareModal,
  onRemoveService,
  onClearAll,
}) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  if (comparedServices.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-2xl w-full pointer-events-auto"
      >
        <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          
          {/* Left / Info & Thumbnails */}
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs sm:text-sm text-white">
                  مقارنة الخدمات
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-mono text-2xs font-medium">
                  {comparedServices.length}/4
                </span>
              </div>
              <span className="text-2xs text-slate-400 block -mt-0.5">
                {comparedServices.length === 1
                  ? 'اختر خدمة أخرى للمقارنة جنباً إلى جنب'
                  : 'جاهز للمقارنة الفنية الفورية'}
              </span>
            </div>

            {/* Selected Thumbnails */}
            <div className="flex items-center gap-1.5 mr-2">
              {comparedServices.map((srv) => (
                <div key={srv.id} className="relative group shrink-0">
                  <img
                    src={srv.image}
                    alt={srv.title}
                    className="w-9 h-9 rounded-xl object-cover border-2 border-slate-700 group-hover:border-blue-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveService(srv.id);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-2xs shadow-xs"
                    title="إزالة"
                  >
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right / Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClearAll}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="إفراغ قائمة المقارنة" aria-label="إفراغ قائمة المقارنة"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCompareModal}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 transition-all border border-blue-400/30 cursor-pointer"
            >
              <span>عرض جدول المقارنة ({comparedServices.length})</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
