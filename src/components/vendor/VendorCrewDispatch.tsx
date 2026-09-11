import React, { useState } from 'react';
import { CrewMember, VendorBooking, CrewWorkHourLog } from '../../types';
import {
  Users,
  Truck,
  PhoneCall,
  CheckCircle,
  Clock,
  Plus,
  ShieldCheck,
  Calendar,
  Sparkles,
  DollarSign,
  Briefcase,
  History,
  FileSpreadsheet,
  X,
  CreditCard,
} from 'lucide-react';

interface VendorCrewDispatchProps {
  crewMembers: CrewMember[];
  bookings: VendorBooking[];
  onAddCrewMember: (crew: CrewMember) => void;
  onUpdateCrewStatus: (crewId: string, newStatus: CrewMember['status']) => void;
  onAddWorkLog?: (crewId: string, log: CrewWorkHourLog) => void;
  onNavigateToPayroll?: () => void;
}

export const VendorCrewDispatch: React.FC<VendorCrewDispatchProps> = ({
  crewMembers,
  bookings,
  onAddCrewMember,
  onUpdateCrewStatus,
  onAddWorkLog,
  onNavigateToPayroll,
}) => {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [selectedCrewForLog, setSelectedCrewForLog] = useState<CrewMember | null>(null);

  // Add Crew Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<CrewMember['role']>('مباشر قهوة');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [bankIban, setBankIban] = useState('');
  const [bankName, setBankName] = useState('مصرف الراجحي');

  // New Work Log Form State
  const [logBookingId, setLogBookingId] = useState(bookings[0]?.id || '');
  const [logRegularHours, setLogRegularHours] = useState<number>(5);
  const [logOvertimeHours, setLogOvertimeHours] = useState<number>(1);
  const [logHourlyRate, setLogHourlyRate] = useState<number>(50);
  const [logNotes, setLogNotes] = useState('');
  const [logSuccessNotice, setLogSuccessNotice] = useState('');

  const handleRoleChange = (newRole: CrewMember['role']) => {
    setRole(newRole);
    const defaultRates: Record<CrewMember['role'], number> = {
      'مشرف ضيافة': 70,
      'مباشر قهوة': 50,
      'شيف بوفيه': 80,
      'فني صوت وإضاءة': 65,
      'سائق توصيل': 45,
      'مصور': 90,
    };
    setHourlyRate(defaultRates[newRole] || 50);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCrew: CrewMember = {
      id: `crew-${Date.now()}`,
      name,
      role,
      phone: phone || '05XXXXXXXX',
      avatar: '',
      status: 'available',
      assignedBookingsCount: 0,
      hourlyRate,
      overtimeMultiplier: 1.5,
      bankName,
      bankIban: bankIban || 'SA92 8000 0211 4455 6677 4012',
      totalLoggedHours: 0,
      workLogs: [],
    };

    onAddCrewMember(newCrew);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setBankIban('');
  };

  const handleOpenWorkLogModal = (member: CrewMember) => {
    setSelectedCrewForLog(member);
    setLogHourlyRate(member.hourlyRate || 60);
    setLogRegularHours(5);
    setLogOvertimeHours(0);
    setLogNotes('');
    setShowWorkLogModal(true);
  };

  const handleWorkLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrewForLog) return;

    const booking = bookings.find((b) => b.id === logBookingId) || bookings[0];
    const totalEarned =
      logRegularHours * logHourlyRate + logOvertimeHours * (logHourlyRate * 1.5);

    const newLog: CrewWorkHourLog = {
      id: `wl-${Date.now()}`,
      crewId: selectedCrewForLog.id,
      crewName: selectedCrewForLog.name,
      bookingId: booking?.id,
      eventTitle: booking
        ? `${booking.serviceTitle} (${booking.customerName})`
        : 'مناسبة خارجية عامة',
      eventDate: booking ? booking.date : new Date().toISOString().split('T')[0],
      regularHours: logRegularHours,
      overtimeHours: logOvertimeHours,
      hourlyRate: logHourlyRate,
      overtimeRate: logHourlyRate * 1.5,
      totalEarned,
      status: 'unprocessed',
      notes: logNotes || 'تسجيل ساعات مناوبة عمل ميدانية معتمدة',
      recordedAt: new Date().toISOString().split('T')[0],
    };

    if (onAddWorkLog) {
      onAddWorkLog(selectedCrewForLog.id, newLog);
    } else {
      // Direct push to member's workLogs
      if (!selectedCrewForLog.workLogs) selectedCrewForLog.workLogs = [];
      selectedCrewForLog.workLogs.unshift(newLog);
      selectedCrewForLog.totalLoggedHours =
        (selectedCrewForLog.totalLoggedHours || 0) + logRegularHours + logOvertimeHours;
    }

    setLogSuccessNotice(
      `تم تسجيل المناوبة بنجاح لعضو الطاقم (${selectedCrewForLog.name}) بإجمالي ${totalEarned.toLocaleString('ar-SA')} ر.س، وجاهزة للأتمتة في مسير الرواتب!`
    );
    setTimeout(() => {
      setLogSuccessNotice('');
      setShowWorkLogModal(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <Users className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>إدارة الطاقم الميداني وساعات العمل (Crew & Work Hours Dispatch)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            جدولة طاقم العمل وتوثيق ساعات المناوبات
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            توزيع المباشرين والمشرفين على المناسبات، وتوثيق عدد ساعات العمل الفعلية والإضافية لكل فرد لحساب مسير الرواتب تلقائياً.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عضو فريق جديد</span>
          </button>
        </div>
      </div>

      {/* Grid of Crew Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {crewMembers.map((member) => {
          const isBusy = member.status === 'on_mission';
          const defaultRate =
            member.hourlyRate ||
            (member.role === 'مشرف ضيافة'
              ? 70
              : member.role === 'مباشر قهوة'
              ? 50
              : member.role === 'شيف بوفيه'
              ? 80
              : member.role === 'فني صوت وإضاءة'
              ? 65
              : 45);

          const unprocLogs =
            member.workLogs?.filter((l) => l.status === 'unprocessed') || [];

          return (
            <div
              key={member.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div className="space-y-3.5">
                
                {/* Avatar & Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{member.name}</h4>
                      <span className="text-xs text-blue-700 font-bold block">{member.role}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isBusy
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : member.status === 'available'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isBusy ? 'في مهمة حالياً' : member.status === 'available' ? 'متاح' : 'إجازة'}
                  </span>
                </div>

                {/* Rates and Hours Info Box */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>أجر الساعة الأساسي:</span>
                    <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {defaultRate} ر.س / ساعة
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>إجمالي الساعات المسجلة:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {member.totalLoggedHours || 28} ساعة
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>رقم الجوال:</span>
                    <span className="font-mono text-slate-800">{member.phone}</span>
                  </div>

                  {member.bankIban && (
                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>الآيبان البنكي:</span>
                      <span className="text-slate-800">{member.bankIban.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>

                {/* Action button to log hours */}
                <button
                  onClick={() => handleOpenWorkLogModal(member)}
                  className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>تسجيل مناوبة وساعات عمل</span>
                  {unprocLogs.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold">
                      {unprocLogs.length}
                    </span>
                  )}
                </button>

              </div>

              {/* Status Switcher Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateCrewStatus(member.id, 'available')}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    member.status === 'available'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  متاح
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCrewStatus(member.id, 'on_mission')}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    member.status === 'on_mission'
                      ? 'bg-amber-50 border-amber-200 text-amber-800 font-extrabold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  في مهمة
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateCrewStatus(member.id, 'off_duty')}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    member.status === 'off_duty'
                      ? 'bg-slate-200 border-slate-300 text-slate-800 font-extrabold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  راحة
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Crew Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs text-right">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 card-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">إضافة عضو فريق جديد</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: يوسف العتيبي"
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-[#155EEF] text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدور الوظيفي *</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-[#155EEF] text-right"
                  >
                    <option value="مشرف ضيافة">مشرف ضيافة</option>
                    <option value="مباشر قهوة">مباشر قهوة سعودية</option>
                    <option value="شيف بوفيه">شيف بوفيه ومأكولات</option>
                    <option value="فني صوت وإضاءة">فني صوت وإضاءة</option>
                    <option value="سائق توصيل">سائق توصيل وتجهيز</option>
                    <option value="مصور">مصور فوتوغرافي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">أجر الساعة (ر.س) *</label>
                  <input
                    type="number"
                    min={10}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#155EEF] text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الجوال *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#155EEF] text-right"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الآيبان البنكي للصرف</label>
                <input
                  type="text"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="SA00 0000 0000 0000 0000 0000"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#155EEF] text-right"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  حفظ وإضافة إلى الطاقم
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Work Hours & Shift Modal */}
      {showWorkLogModal && selectedCrewForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs text-right">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 card-shadow max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedCrewForLog.avatar}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    تسجيل ساعات ومناوبة عمل: {selectedCrewForLog.name}
                  </h3>
                  <span className="text-xs text-blue-700 font-bold">{selectedCrewForLog.role}</span>
                </div>
              </div>
              <button
                onClick={() => setShowWorkLogModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {logSuccessNotice ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{logSuccessNotice}</span>
              </div>
            ) : (
              <form onSubmit={handleWorkLogSubmit} className="space-y-4 text-xs">
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المناسبة / الحجز المرتبط *</label>
                  <select
                    value={logBookingId}
                    onChange={(e) => setLogBookingId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-[#155EEF] text-right"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.customerName} - {b.serviceTitle} ({b.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ساعات أساسية *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={24}
                      value={logRegularHours}
                      onChange={(e) => setLogRegularHours(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ساعات إضافية</label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={logOvertimeHours}
                      onChange={(e) => setLogOvertimeHours(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-800 font-mono font-bold text-right"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">أجر الساعة (ر.س)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={logHourlyRate}
                      onChange={(e) => setLogHourlyRate(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-right"
                    />
                  </div>
                </div>

                {/* Real-time Calculation Summary */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1.5 text-blue-950">
                  <div className="flex justify-between items-center text-xs">
                    <span>الأجر الأساسي ({logRegularHours} ساعات × {logHourlyRate} ر.س):</span>
                    <span className="font-mono font-bold">{logRegularHours * logHourlyRate} ر.س</span>
                  </div>
                  {logOvertimeHours > 0 && (
                    <div className="flex justify-between items-center text-xs text-amber-800 font-bold">
                      <span>الأجر الإضافي ({logOvertimeHours} ساعات × {logHourlyRate * 1.5} ر.س):</span>
                      <span className="font-mono">+{logOvertimeHours * (logHourlyRate * 1.5)} ر.س</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-blue-200 flex justify-between items-center text-sm font-extrabold text-blue-950">
                    <span>إجمالي المستحق المحسوب:</span>
                    <span className="font-mono text-emerald-800 text-base">
                      {(
                        logRegularHours * logHourlyRate +
                        logOvertimeHours * (logHourlyRate * 1.5)
                      ).toLocaleString('ar-SA')}{' '}
                      ر.س
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات المناوبة والمهمة الميدانية</label>
                  <input
                    type="text"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="مثال: تجهيز الدلال واستقبال الضيوف VIP بقاعة نيارة"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-right"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-colors"
                  >
                    حفظ وتوثيق ساعات العمل
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWorkLogModal(false)}
                    className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            )}

            {/* Previous Work Logs for this Member */}
            {selectedCrewForLog.workLogs && selectedCrewForLog.workLogs.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h5 className="font-extrabold text-xs text-slate-800">
                  سجل المناوبات السابقة ({selectedCrewForLog.workLogs.length})
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedCrewForLog.workLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{log.eventTitle}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.eventDate} • {log.regularHours} س أساسي {log.overtimeHours > 0 ? `+ ${log.overtimeHours} س إضافي` : ''}
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <div className="font-extrabold text-emerald-800">{log.totalEarned} ر.س</div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            log.status === 'processed_in_payroll'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.status === 'processed_in_payroll' ? 'مدرج بالمسير' : 'بانتظار الأتمتة'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
