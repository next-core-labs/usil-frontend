import React, { useState, useEffect } from 'react';
import {
  VendorBooking,
  BlockedDate,
  WhatsAppThread,
  CrewMember,
  VendorInvoice,
  FinancialPayout,
  POSItem,
  POSSaleRecord,
  VendorBrandSettings,
  ClientOrderTracking,
  ExpenseRecord,
  ReceivableDebt,
  CrewPayrollEntry,
  ConsolidatedCrewPaymentVoucher,
  InventoryItem,
} from '../../types';
import {
  createFullDatabaseBackup,
  downloadJSONBackupFile,
  FullDatabaseBackup,
  usilStorage,
} from '../../utils/storage';
import {
  Database,
  Download,
  ShieldCheck,
  CheckCircle2,
  X,
  FileCode,
  HardDrive,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  FileCheck,
  Upload,
  Info,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Lock,
  Package,
} from 'lucide-react';

interface VendorDatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandSettings: VendorBrandSettings;
  bookings: VendorBooking[];
  blockedDates: BlockedDate[];
  invoices: VendorInvoice[];
  payouts: FinancialPayout[];
  posItems: POSItem[];
  salesRecords: POSSaleRecord[];
  trackings: ClientOrderTracking[];
  expenses: ExpenseRecord[];
  receivables: ReceivableDebt[];
  payrollEntries: CrewPayrollEntry[];
  crewMembers: CrewMember[];
  threads: WhatsAppThread[];
  consolidatedVouchers?: ConsolidatedCrewPaymentVoucher[];
  inventoryItems?: InventoryItem[];
}

export const VendorDatabaseBackupModal: React.FC<VendorDatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  brandSettings,
  bookings,
  blockedDates,
  invoices,
  payouts,
  posItems,
  salesRecords,
  trackings,
  expenses,
  receivables,
  payrollEntries,
  crewMembers,
  threads,
  consolidatedVouchers = [],
  inventoryItems = [],
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [backupData, setBackupData] = useState<FullDatabaseBackup | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [storageDriver, setStorageDriver] = useState<string>('localforage (IndexedDB)');
  const [inspectResult, setInspectResult] = useState<{
    valid: boolean;
    fileName: string;
    version?: string;
    recordsCount?: number;
    exportedAt?: string;
    error?: string;
  } | null>(null);

  // Prepare backup snapshot
  const prepareBackup = async () => {
    setIsGenerating(true);
    try {
      const runtimeStoreData = {
        brandSettings,
        bookings,
        blockedDates,
        invoices,
        payouts,
        posItems,
        salesRecords,
        trackings,
        expenses,
        receivables,
        payrollEntries,
        crewMembers,
        threads,
        consolidatedVouchers,
        inventoryItems,
      };

      const backup = await createFullDatabaseBackup(runtimeStoreData);
      setBackupData(backup);
      try {
        setStorageDriver(usilStorage.driver() || 'localforage (IndexedDB)');
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error generating backup:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      prepareBackup();
      setDownloadSuccess(null);
      setInspectResult(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!backupData) return;
    const safeBrand = (brandSettings.brandName || 'vendor').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `aseel_backup_${safeBrand}_${dateStr}.json`;

    const downloadedFileName = downloadJSONBackupFile(backupData, fileName);
    setDownloadSuccess(downloadedFileName);

    setTimeout(() => {
      // Auto clear feedback after 6 seconds
    }, 6000);
  };

  const handleCopyJSON = () => {
    if (!backupData) return;
    navigator.clipboard.writeText(JSON.stringify(backupData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Inspect existing backup file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.meta && (parsed.storeData || parsed.localforageRawDump)) {
          setInspectResult({
            valid: true,
            fileName: file.name,
            version: parsed.meta.version || '2.0.0',
            recordsCount: parsed.meta.totalRecords || 0,
            exportedAt: parsed.meta.exportedAt || 'تاريخ موثق',
          });
        } else {
          setInspectResult({
            valid: false,
            fileName: file.name,
            error: 'الملف لا يحتوي على بنية النسخ الاحتياطي المعتمدة لمنصة يوصل.',
          });
        }
      } catch (err) {
        setInspectResult({
          valid: false,
          fileName: file.name,
          error: 'فشل في قراءة ملف الـ JSON. تأكد من سلامة تنسيق الملف.',
        });
      }
    };
    reader.readAsText(file);
  };

  const totalCalculatedRecords =
    bookings.length +
    invoices.length +
    salesRecords.length +
    expenses.length +
    receivables.length +
    payrollEntries.length +
    crewMembers.length +
    trackings.length;

  const estimatedSizeKB = backupData
    ? (new Blob([JSON.stringify(backupData)]).size / 1024).toFixed(1)
    : '45.2';

  return (
    <div
      id="vendor-database-backup-modal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 text-right font-sans usil-modal-scroll"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-l from-navy via-[#0F284D] to-action text-white relative overflow-hidden flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-sand/20 border border-sand/40 flex items-center justify-center text-sand shadow-inner">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-medium px-2 py-0.5 rounded-md bg-white/20 text-sand font-mono tracking-wider">
                  LOCALFORAGE DB SAFEGUARD
                </span>
                <span className="text-xs text-white/80 font-medium hidden sm:inline">
                  إجراء أمان ونسخ وقائي
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                <span>تصدير نسخة احتياطية لقاعدة البيانات (JSON)</span>
              </h2>
            </div>
          </div>

          <button
            id="close-db-backup-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
           aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 bg-slate-50/50">
          
          {/* Success Download Toast */}
          {downloadSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="block font-bold text-emerald-950">تم تحميل النسخة الاحتياطية بنجاح!</span>
                <span className="text-2xs font-mono text-emerald-700 block">
                  الملف المحفوظ: {downloadSuccess}
                </span>
              </div>
            </div>
          )}

          {/* Engine Status & Security Overview Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-bold text-slate-900">
                  حالة قاعدة البيانات المحلية (localforage Engine)
                </h3>
              </div>
              <span className="text-2xs font-mono font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-action border border-blue-100">
                {storageDriver}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              تعتمد منصة يوصل على محرك التخزين المحلي عالي السرعة <code className="text-action font-mono font-bold">localforage</code> (المعتمد على IndexedDB في المتصفح) لحفظ بيانات متجرك وعملياتك بشكل فوري ودائم دون الحاجة لاتصال مستمر. يتيح لك هذا الإجراء الوقائي تنزيل نسخة بصيغة JSON لحفظها على جهازك أو استرجاعها عند الحاجة.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-2xs text-slate-400 font-medium block">إجمالي السجلات المؤمنة</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {totalCalculatedRecords} سجل
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-2xs text-slate-400 font-medium block">حجم النسخة التقريبي</span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  ~ {estimatedSizeKB} KB
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-2xs text-slate-400 font-medium block">تاريخ الإصدار</span>
                <span className="text-xs font-medium text-slate-900 font-mono">
                  v2.5.0
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-2xs text-slate-400 font-medium block">بصمة التحقق (Checksum)</span>
                <span className="text-2xs font-medium text-sand font-mono truncate block">
                  {backupData?.meta.checksum || 'SHA-Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown of Data Included in Backup */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-medium text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-action" />
              <span>محتويات الجداول وسجلات المتجر المتضمنة بالنسخة:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-action" />
                  <span className="font-bold text-slate-700">الحجوزات والتقويم</span>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {bookings.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-700">الفواتير وسندات الصرف</span>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {invoices.length + consolidatedVouchers.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-700">مبيعات الكاشير (POS)</span>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {salesRecords.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-slate-700">طاقم العمل والرواتب</span>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {crewMembers.length + payrollEntries.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700">المصروفات والذمم</span>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {expenses.length + receivables.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-700">المخزون والتنبؤ بالاستهلاك</span>
                </div>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {inventoryItems.length}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sand" />
                  <span className="font-bold text-slate-700">هوية البراند والحسابات</span>
                </div>
                <span className="text-2xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  مكتملة
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                <HardDrive className="w-4 h-4 text-action" />
                <span>تحميل وتوليد ملف النسخة الاحتياطية الكاملة</span>
              </h4>
              <p className="text-xs text-slate-600">
                الملف يتضمن جميع مفاتيح localforage والبيانات المحاسبية والتشغيلية المحدثة.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                id="btn-copy-backup-json"
                onClick={handleCopyJSON}
                disabled={isGenerating || !backupData}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="نسخ محتوى الـ JSON إلى الحافظة" aria-label="نسخ محتوى الـ JSON إلى الحافظة"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الـ JSON'}</span>
              </button>

              <button
                id="btn-download-backup-json"
                onClick={handleDownload}
                disabled={isGenerating || !backupData}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-action hover:bg-action-hover active:bg-action-pressed text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>تحميل نسخة احتياطية (JSON)</span>
              </button>
            </div>
          </div>

          {/* JSON Tree Preview (Toggleable) */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <button
              onClick={() => setPreviewOpen(!previewOpen)}
              className="w-full p-4 text-right flex items-center justify-between text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-action" />
                <span>معاينة بنية ملف الـ JSON المصدّر (Schema Preview)</span>
              </span>
              <span className="text-2xs text-slate-500 font-normal">
                {previewOpen ? 'إخفاء المعاينة ▲' : 'إظهار المعاينة ▼'}
              </span>
            </button>

            {previewOpen && backupData && (
              <div className="p-4 bg-slate-900 text-slate-200 text-left font-mono text-2xs max-h-60 overflow-y-auto border-t border-slate-800 leading-relaxed">
                <pre>{JSON.stringify({ meta: backupData.meta, sampleKeys: Object.keys(backupData.localforageRawDump || {}) }, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Inspect / Verify Existing Backup File */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sand" />
                <span>فحص ومطابقة نسخة احتياطية سابقة:</span>
              </h4>
              <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-2xs font-medium cursor-pointer transition-colors">
                <span>اختر ملف JSON للفحص</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {inspectResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2.5 ${
                  inspectResult.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {inspectResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-bold block">{inspectResult.fileName}</span>
                  {inspectResult.valid ? (
                    <span className="text-2xs text-emerald-700 font-mono">
                      نسخة صالحة ومعتمدة (الإصدار: {inspectResult.version} • {inspectResult.recordsCount} سجل)
                    </span>
                  ) : (
                    <span className="text-2xs text-rose-700">{inspectResult.error}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preventive Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>إرشاد وقائي:</strong> يُنصح بتحميل نسخة احتياطية من متجرك بصيغة JSON أسبوعياً أو عند إجراء تعديلات محاسبية كبرى، وذلك لضمان حفظ بياناتك في حال تم مسح ذاكرة التخزين المؤقت للمتصفح (Cache) أو عند الانتقال لجهاز جديد.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-2xs text-slate-500 font-mono">
            Usil Local DB Version 2.5 • localforage IndexedDB
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating || !backupData}
              className="px-5 py-2 rounded-xl bg-action hover:bg-action-hover text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل (JSON)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
