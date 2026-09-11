import React, { useState } from 'react';
import { VendorBooking, ExpenseRecord, EventUnitCosting } from '../../../types';
import {
  Calculator,
  PieChart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  Coffee,
  Truck,
  ArrowRight,
  Info,
  ChevronDown,
} from 'lucide-react';

interface VendorEventCostingProps {
  bookings: VendorBooking[];
  expenses: ExpenseRecord[];
}

export const VendorEventCosting: React.FC<VendorEventCostingProps> = ({
  bookings,
  expenses,
}) => {
  // Smart Event Quote Calculator States
  const [calcGuestCount, setCalcGuestCount] = useState<number>(100);
  const [calcRawMaterials, setCalcRawMaterials] = useState<number>(650);
  const [calcCrewCount, setCalcCrewCount] = useState<number>(2);
  const [calcCrewRate, setCalcCrewRate] = useState<number>(250);
  const [calcTransportCost, setCalcTransportCost] = useState<number>(150);
  const [calcConsumables, setCalcConsumables] = useState<number>(120);
  const [calcTargetMargin, setCalcTargetMargin] = useState<number>(45); // Target Margin %

  // Dynamic calculations for the Smart Quoting Tool
  const calcTotalDirectLabor = calcCrewCount * calcCrewRate;
  const calcTotalDirectCost =
    calcRawMaterials + calcTotalDirectLabor + calcTransportCost + calcConsumables;
  
  // Suggested Price = Cost / (1 - Margin%)
  const suggestedSellingPrice =
    calcTargetMargin < 100
      ? calcTotalDirectCost / (1 - calcTargetMargin / 100)
      : calcTotalDirectCost * 2;
  const estimatedProfit = suggestedSellingPrice - calcTotalDirectCost;
  const costPerGuest = calcGuestCount > 0 ? calcTotalDirectCost / calcGuestCount : 0;
  const pricePerGuest = calcGuestCount > 0 ? suggestedSellingPrice / calcGuestCount : 0;

  // Build Event Costing Breakdown List for Real Bookings
  const eventsCostingList: EventUnitCosting[] = bookings.map((b) => {
    // Find expenses explicitly tagged with this booking
    const linkedExpenses = expenses.filter((e) => e.relatedBookingId === b.id);
    
    // Estimate or calculate raw materials & direct labor
    const rawCost =
      linkedExpenses
        .filter((e) => e.category === 'raw_materials')
        .reduce((sum, e) => sum + e.amount, 0) || Math.round(b.totalAmount * 0.22);

    const laborCost =
      linkedExpenses
        .filter((e) => e.category === 'direct_labor')
        .reduce((sum, e) => sum + e.amount, 0) || ((b.assignedCrew?.length || 2) * 250);

    const transportCost =
      linkedExpenses
        .filter((e) => e.category === 'fuel_transport')
        .reduce((sum, e) => sum + e.amount, 0) || 120;

    const consumablesCost = Math.round(b.totalAmount * 0.05);
    const platformFeeCost = b.source === 'platform' ? b.totalAmount * 0.15 : 0;

    const totalDirectCost = rawCost + laborCost + transportCost + consumablesCost + platformFeeCost;
    const grossProfit = b.totalAmount - totalDirectCost;
    const profitMarginPercent = b.totalAmount > 0 ? (grossProfit / b.totalAmount) * 100 : 0;

    let status: EventUnitCosting['status'] = 'normal_profit';
    if (profitMarginPercent >= 50) status = 'high_profit';
    else if (profitMarginPercent < 25) status = 'low_margin';
    else if (grossProfit < 0) status = 'loss';

    return {
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      clientName: b.customerName,
      serviceTitle: b.serviceTitle,
      eventDate: b.date,
      revenue: b.totalAmount,
      rawMaterialsCost: rawCost,
      directLaborCost: laborCost,
      transportCost,
      consumablesCost,
      platformFeeCost,
      totalDirectCost,
      grossProfit,
      profitMarginPercent,
      status,
    };
  });

  const avgMargin =
    eventsCostingList.length > 0
      ? eventsCostingList.reduce((sum, e) => sum + e.profitMarginPercent, 0) / eventsCostingList.length
      : 0;

  return (
    <div className="space-y-8 text-right">
      
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 text-xs font-bold border border-purple-200">
            <Calculator className="w-3.5 h-3.5 text-purple-600" />
            <span>تحليل تكلفة المناسبات وهوامش الربحية (Unit Economics & Job Order Costing)</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">
            محلل ربحية كل مناسبة وحاسبة التسعير الذكي
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            اكتشف التكلفة المباشرة الحقيقية لكل حفل ومناسبة، وتفادَ تسعير المناسبات بهوامش خاسرة.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-left shrink-0">
          <span className="text-[10px] text-purple-800 font-bold block">متوسط هامش ربح المناسبات</span>
          <span className="text-xl font-extrabold font-mono text-purple-900">%{avgMargin.toFixed(1)}</span>
        </div>
      </div>

      {/* SMART PRICING & QUOTING CALCULATOR TOOL (أداة تسعير المناسبات الجديدة) */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 card-shadow space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>حاسبة التسعير الهندسي للمناسبات الجديدة</span>
            </div>
            <h4 className="text-lg font-extrabold text-white">
              احسب التكلفة وحدد سعر البيع المناسب للعميل لضمان ربحك
            </h4>
          </div>
          <p className="text-xs text-slate-300 max-w-md">
            أدخل التكاليف المتوقعة للمناسبة وسيقوم النظام باقتراح سعر البيع العادل للعميل بناءً على هامش الربح المستهدف.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Inputs Column (7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Guest Count */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                عدد الضيوف المتوقع:
              </label>
              <input
                type="number"
                min={10}
                value={calcGuestCount}
                onChange={(e) => setCalcGuestCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold focus:outline-none focus:border-emerald-400 text-right"
              />
            </div>

            {/* Target Margin % */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                نسبة هامش الربح المستهدفة (%):
              </label>
              <input
                type="number"
                min={10}
                max={90}
                value={calcTargetMargin}
                onChange={(e) => setCalcTargetMargin(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400 text-right"
              />
            </div>

            {/* Raw Materials (بن، تمور، لحوم) */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                تكلفة الخامات والمواد (ر.س):
              </label>
              <input
                type="number"
                min={0}
                value={calcRawMaterials}
                onChange={(e) => setCalcRawMaterials(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold focus:outline-none focus:border-emerald-400 text-right"
              />
            </div>

            {/* Crew Count & Rate */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                طاقم العمل (المباشرين):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="العدد"
                  value={calcCrewCount}
                  onChange={(e) => setCalcCrewCount(Number(e.target.value))}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold text-center"
                />
                <input
                  type="number"
                  min={100}
                  placeholder="أجر الفرد"
                  value={calcCrewRate}
                  onChange={(e) => setCalcCrewRate(Number(e.target.value))}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold text-center"
                />
              </div>
            </div>

            {/* Transport / Fuel */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                تكلفة النقل والتوصيل الميداني (ر.س):
              </label>
              <input
                type="number"
                min={0}
                value={calcTransportCost}
                onChange={(e) => setCalcTransportCost(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold focus:outline-none focus:border-emerald-400 text-right"
              />
            </div>

            {/* Packaging & Consumables */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                مستهلكات وتغليف وفناجيل (ر.س):
              </label>
              <input
                type="number"
                min={0}
                value={calcConsumables}
                onChange={(e) => setCalcConsumables(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-mono font-bold focus:outline-none focus:border-emerald-400 text-right"
              />
            </div>

          </div>

          {/* Results Column (5 Cols) */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-bold block">
                نتائج التسعير المقترحة للمناسبة
              </span>

              {/* Total Direct Cost */}
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-slate-300">إجمالي التكلفة المباشرة (COGS):</span>
                <span className="font-mono font-bold text-amber-400">
                  {calcTotalDirectCost.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              {/* Cost per Guest */}
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-slate-300">التكلفة التقديرية للشخص الواحد:</span>
                <span className="font-mono text-slate-300">
                  {costPerGuest.toFixed(1)} ر.س / ضيف
                </span>
              </div>

              {/* Estimated Net Profit */}
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-slate-300">صافي الربح المتوقع:</span>
                <span className="font-mono font-extrabold text-emerald-400">
                  +{estimatedProfit.toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ر.س
                </span>
              </div>
            </div>

            {/* Highlighted Price */}
            <div className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-500/40 text-center space-y-1">
              <span className="text-[11px] text-emerald-200 font-bold block">
                السعر المقترح للبيع للعميل (لتحقيق هامش %{calcTargetMargin})
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {suggestedSellingPrice.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}{' '}
                <span className="text-xs font-sans text-emerald-300">ر.س</span>
              </div>
              <span className="text-[10px] text-slate-300 block">
                (ما يعادل {pricePerGuest.toFixed(1)} ر.س للضيف الواحد)
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Per-Event Profitability Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 card-shadow overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="text-base font-extrabold text-slate-900">
              جدول ربحية الحجوزات والمناسبات الفعلية
            </h4>
          </div>
          <span className="text-xs text-slate-500">حساب فوري للأرباح الصافية لكل مناسبة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">المناسبة والعميل</th>
                <th className="py-3.5 px-4">سعر البيع (الإيراد)</th>
                <th className="py-3.5 px-4">تكلفة الخامات</th>
                <th className="py-3.5 px-4">أجور المباشرين</th>
                <th className="py-3.5 px-4">النقل والمستهلكات</th>
                <th className="py-3.5 px-4">إجمالي التكلفة</th>
                <th className="py-3.5 px-4 text-emerald-700">صافي ربح المناسبة</th>
                <th className="py-3.5 px-4">هامش الربح %</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {eventsCostingList.map((item) => {
                const isHighProfit = item.profitMarginPercent >= 50;
                const isLowMargin = item.profitMarginPercent < 25;

                return (
                  <tr key={item.bookingId} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Booking Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.clientName}</div>
                      <div className="text-[11px] text-blue-600 font-bold">{item.serviceTitle}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.bookingNumber} • {item.eventDate}
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.revenue.toLocaleString('ar-SA')} ر.س
                    </td>

                    {/* Raw Materials */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.rawMaterialsCost.toLocaleString('ar-SA')} ر.س
                    </td>

                    {/* Labor Cost */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.directLaborCost.toLocaleString('ar-SA')} ر.س
                    </td>

                    {/* Transport & Consumables */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {(item.transportCost + item.consumablesCost).toLocaleString('ar-SA')} ر.س
                    </td>

                    {/* Total Direct Cost */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                      {item.totalDirectCost.toLocaleString('ar-SA')} ر.س
                    </td>

                    {/* Gross Profit */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                      +{item.grossProfit.toLocaleString('ar-SA')} ر.س
                    </td>

                    {/* Margin Badge */}
                    <td className="py-3.5 px-4">
                      {isHighProfit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-mono font-extrabold text-[11px]">
                          %{item.profitMarginPercent.toFixed(1)} ⭐️
                        </span>
                      ) : isLowMargin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          %{item.profitMarginPercent.toFixed(1)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 font-mono font-bold text-[11px]">
                          %{item.profitMarginPercent.toFixed(1)}
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
