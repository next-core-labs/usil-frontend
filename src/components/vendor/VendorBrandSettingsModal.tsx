import React, { useState } from 'react';
import { VendorBrandSettings } from '../../types';
import { FulfillmentLanePicker } from '../FulfillmentLanePicker';
import {
  X,
  Sparkles,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  Palette,
  FileText,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Stamp,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface VendorBrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VendorBrandSettings;
  onSave: (newSettings: VendorBrandSettings) => void;
}

export const VendorBrandSettingsModal: React.FC<VendorBrandSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<VendorBrandSettings>(settings);
  const [activeTab, setActiveTab] = useState<'profile' | 'invoice' | 'preview'>('profile');
  const [showSavedToast, setShowSavedToast] = useState(false);

  if (!isOpen) return null;

  const colorPresets = [
    { name: 'كحلي فاخر', value: '#0A1A33' },
    { name: 'أزرق ملكي', value: '#155EEF' },
    { name: 'ذهبي يوصل', value: '#99732B' },
    { name: 'زمردي راقي', value: '#065F46' },
    { name: 'عنابي ملكي', value: '#831843' },
    { name: 'فحمي عصري', value: '#1E293B' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 usil-modal-scroll">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 card-shadow z-10 my-auto text-right overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-navy text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sand text-xs font-medium border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>هوية المتجر الخاص (White-Label Branding)</span>
            </div>
            <h3 className="text-xl font-bold">
              تخصيص بيانات علامتك التجارية والفواتير
            </h3>
            <p className="text-xs text-slate-300 font-normal">
              جميع الفواتير الخارجية والكاشير وروابط التتبع ستظهر باسمك وشعارك ورقمك الضريبي 100% دون أي وسيط.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
           aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-action text-action'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>بيانات المنشأة والسجل</span>
          </button>

          <button
            onClick={() => setActiveTab('invoice')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'invoice'
                ? 'border-action text-action'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>تخصيص صيغة الفاتورة والختم</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-action text-action'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>معاينة فورية للفاتورة والكاشير</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    اسم البراند / المنشأة (كما يظهر للعميل) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-action focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    الشعار اللفظي (Slogan)
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-action focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    رقم السجل التجاري / وثيقة العمل الحر *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.crNumber}
                    onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-action focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    الرقم الضريبي (VAT Number - 15 رقم) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-action focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    رابط صورة شعار المتجر (Logo URL)
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-action focus:outline-none font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    رابط صورة الختم الرسمي / التوقيع (Stamp URL)
                  </label>
                  <input
                    type="url"
                    value={formData.stampUrl || ''}
                    onChange={(e) => setFormData({ ...formData, stampUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-action focus:outline-none font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    رقم الهاتف / الواتساب
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-action focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-action focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    المدينة والمقر الرئيسي
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-action focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  العنوان الوطني الكامل للمنشأة
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-action focus:outline-none"
                />
              </div>

              <FulfillmentLanePicker
                value={formData.fulfillment || []}
                onChange={(next) => setFormData({ ...formData, fulfillment: next })}
              />

              {/* Brand Color Picker */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-action" />
                    <span className="text-xs font-medium text-slate-900">لون الهوية الرئيسي للفواتير والإيصالات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg border border-slate-300" style={{ backgroundColor: formData.primaryColor }} />
                    <span className="text-xs font-mono font-medium text-slate-700">{formData.primaryColor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: preset.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        formData.primaryColor === preset.value
                          ? 'border-slate-900 ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.value }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-4">
              
              {/* Bank Transfer Details for Invoices */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-action" />
                  <h4 className="text-xs font-medium text-blue-900">
                    بيانات الحساب البنكي لاستقبال التحويلات المباشرة من العملاء
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-2xs font-medium text-slate-700 mb-1">
                      اسم البنك
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-medium text-slate-700 mb-1">
                      اسم المستفيد / الحساب
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-medium text-slate-700 mb-1">
                    رقم الآيبان (IBAN)
                  </label>
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Custom Header & Terms */}
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  رسالة الترحيب في رأس الفاتورة (Header Note)
                </label>
                <input
                  type="text"
                  value={formData.invoiceHeaderNote}
                  onChange={(e) => setFormData({ ...formData, invoiceHeaderNote: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-action focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  شروط وأحكام التوريد في أسفل الفاتورة (Terms & Conditions)
                </label>
                <textarea
                  rows={4}
                  value={formData.invoiceFooterNotes}
                  onChange={(e) => setFormData({ ...formData, invoiceFooterNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-action focus:outline-none leading-relaxed"
                />
              </div>

            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-6 rounded-3xl bg-white border-2 border-dashed border-slate-300 space-y-6 text-right">
              
              {/* Header Preview */}
              <div
                className="p-4 rounded-2xl text-white flex items-center justify-between"
                style={{ backgroundColor: formData.primaryColor }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={formData.logoUrl}
                    alt={formData.brandName}
                    className="w-12 h-12 rounded-xl object-cover border border-white/20 bg-white"
                  />
                  <div>
                    <h4 className="font-bold text-sm">{formData.brandName}</h4>
                    <p className="text-2xs text-white/80">{formData.slogan}</p>
                    <span className="text-2xs text-white/70 block font-mono">س.ت: {formData.crNumber} | ضريبي: {formData.vatNumber}</span>
                  </div>
                </div>

                <div className="text-left font-mono text-xs">
                  <div className="font-bold text-white">فاتورة ضريبية مبسطة</div>
                  <div className="text-white/70 text-2xs">INV-2026-SAMPLE</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                <span className="font-bold block mb-1">رسالة الترحيب:</span>
                <p className="text-slate-600 font-normal italic">{formData.invoiceHeaderNote}</p>
              </div>

              {/* Bank & Stamp Preview */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">التحويل البنكي المعتمد:</span>
                  <span className="text-slate-600 block">{formData.bankName} - {formData.accountHolder}</span>
                  <span className="font-mono text-slate-800 font-bold block">{formData.iban}</span>
                </div>

                {formData.stampUrl && (
                  <div className="text-center">
                    <img
                      src={formData.stampUrl}
                      alt="ختم المنشأة"
                      className="w-16 h-16 object-contain mix-blend-multiply opacity-85 mx-auto"
                    />
                    <span className="text-2xs text-slate-500 font-medium block">الختم والتوقيع الرسمي</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Action Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>يتم حفظ وتطبيق الهوية فورياً على جميع الفواتير والكاشير</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-action hover:bg-action-hover active:bg-action-pressed text-white text-xs sm:text-sm font-medium shadow-xs transition-colors"
              >
                حفظ بيانات الهوية والبراند
              </button>
            </div>
          </div>

          {showSavedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium text-center">
              ✓ تم حفظ وتحديث بيانات العلامة التجارية بنجاح
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
