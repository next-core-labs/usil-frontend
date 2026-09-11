import React, { useMemo, useState } from 'react';
import { Check, PackagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FulfillmentLane } from '../../types';
import { FulfillmentLanePicker } from '../FulfillmentLanePicker';
import { ProductImagesPicker } from './ProductImagesPicker';
import { PlaceMultiPicker } from '../PlaceMultiPicker';
import { formatSelectionCoverage, toggleCoverage } from '../../data/saudiPlaces';
import {
  FULFILLMENT_AR_LABEL,
  LISTING_CATEGORIES,
  LISTING_MIN_IMAGES,
  LISTING_PRICE_UNITS,
  LISTING_BOOKING_MODES,
  BOOKING_MODE_AR_LABEL,
  BOOKING_MODE_AR_HINT,
  DEFAULT_BOOKING_MODE,
  parseBookingMode,
  parseListingImages,
  type ListingBookingMode,
  type VendorListing,
} from '../../contracts/vendors/vendor-listings';

const inputClass =
  'w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]';

type ListingDraft = {
  title: string;
  category: VendorListing['category'];
  shortDesc: string;
  price: string;
  priceUnit: VendorListing['priceUnit'];
  cities: string[];
  images: string[];
  fulfillment: FulfillmentLane[];
  bookingMode: ListingBookingMode;
};

const emptyDraft = (): ListingDraft => ({
  title: '',
  category: 'hospitality',
  shortDesc: '',
  price: '',
  priceUnit: 'للمناسبة',
  cities: ['الرياض'],
  images: [],
  fulfillment: [],
  bookingMode: DEFAULT_BOOKING_MODE,
});

function draftFromListing(item: VendorListing): ListingDraft {
  return {
    title: item.title,
    category: item.category,
    shortDesc: item.shortDesc,
    price: String(item.price),
    priceUnit: item.priceUnit,
    cities: item.cities.length ? item.cities : ['الرياض'],
    images: parseListingImages(item.images, item.image),
    fulfillment: [...item.fulfillment],
    bookingMode: parseBookingMode(item.bookingMode),
  };
}

export function VendorListingsPanel({
  listings,
  vendorName,
  onAdd,
  onEdit,
  onDelete,
}: {
  listings: VendorListing[];
  vendorName: string;
  onAdd: (item: Omit<VendorListing, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>) => void;
  onEdit: (item: VendorListing) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VendorListing | null>(null);
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const title = editing ? 'تعديل منتج' : 'تسجيل منتج';

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setError('');
    setOpen(true);
  };

  const openEdit = (item: VendorListing) => {
    setEditing(item);
    setDraft(draftFromListing(item));
    setError('');
    setOpen(true);
  };

  const toggleCity = (city: string) => {
    setDraft((prev) => ({
      ...prev,
      cities: toggleCoverage(prev.cities, city),
    }));
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError('اكتب اسم المنتج');
      return;
    }
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError('أدخل سعراً أكبر من صفر');
      return;
    }
    if (draft.images.length < LISTING_MIN_IMAGES) {
      setError('أضف صورتين على الأقل لصور المنتج');
      return;
    }
    if (!draft.fulfillment.length) {
      setError('اختر مساراً واحداً على الأقل في «مسار يوصل»');
      return;
    }
    if (!(LISTING_BOOKING_MODES as readonly string[]).includes(draft.bookingMode)) {
      setError('اختر طريقة تأكيد الحجز');
      return;
    }
    if (uploading) {
      setError('انتظر انتهاء رفع الصور');
      return;
    }
    const payload = {
      vendorName,
      title: draft.title.trim(),
      category: draft.category,
      categoryName: LISTING_CATEGORIES.find((cat) => cat.id === draft.category)?.name || draft.category,
      shortDesc: draft.shortDesc.trim() || draft.title.trim(),
      price,
      priceUnit: draft.priceUnit,
      cities: draft.cities.length ? draft.cities : ['الرياض'],
      images: draft.images,
      image: draft.images[0],
      fulfillment: draft.fulfillment,
      bookingMode: draft.bookingMode,
    };
    if (editing) {
      onEdit({
        ...editing,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAdd(payload);
    }
    setOpen(false);
  };

  const countByLane = useMemo(() => {
    const counts: Record<string, number> = { hour: 0, same_day: 0, tomorrow: 0, instant: 0 };
    for (const item of listings) {
      for (const lane of item.fulfillment || []) counts[lane] = (counts[lane] || 0) + 1;
    }
    return counts;
  }, [listings]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-5 text-right text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">منتجاتي في السوق</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            سجّل كل منتج بسعر بالريال وصورتين حقيقيتين. بدون صورة وسعر ما يظهر في السوق ولا يُدفع عبر ميسر.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="h-11 px-4 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          تسجيل منتج
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(FULFILLMENT_AR_LABEL) as Array<keyof typeof FULFILLMENT_AR_LABEL>).map((lane) => (
          <span key={lane} className="px-2.5 py-1 rounded-full bg-[#F7F8FA] border border-[#E4E7EC] text-[11px] font-bold text-[#344054]">
            {FULFILLMENT_AR_LABEL[lane]} · {countByLane[lane] || 0}
          </span>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center space-y-2">
          <PackagePlus className="w-8 h-8 mx-auto text-[#155EEF]" />
          <p className="font-extrabold text-slate-900">ما أضفت منتجات بعد. اضغط تسجيل منتج.</p>
          <p className="text-xs text-slate-500">أضف صورتين وسعر بالريال حتى تظهر البطاقة في السوق.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              {parseListingImages(item.images, item.image)[0] ? (
                <img
                  src={parseListingImages(item.images, item.image)[0]}
                  alt={item.title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  loading="lazy"
                />
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.categoryName} ·{' '}
                  {Number(item.price) > 0 ? `${item.price} ر.س ${item.priceUnit}` : 'بدون سعر بعد — ثبّته قبل ميسر'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{formatSelectionCoverage(item.cities)}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(item.fulfillment || []).map((lane) => (
                    <span key={lane} className="px-2 py-0.5 rounded-full bg-[#155EEF] text-white text-[10px] font-extrabold">
                      {FULFILLMENT_AR_LABEL[lane]}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded-full bg-[#0A1A33] text-white text-[10px] font-extrabold">
                    {BOOKING_MODE_AR_LABEL[parseBookingMode(item.bookingMode)]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 inline-flex items-center justify-center"
                  aria-label={`حذف ${item.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 usil-modal-scroll">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">مسار يوصل مطلوب لكل منتج — تقدر تختار أكثر من مسار.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-xl bg-slate-100 text-slate-600" aria-label="إغلاق">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-3 text-xs">
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-700">اسم المنتج *</span>
                <input
                  className={inputClass}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="مثال: قهوة سعودية جاهزة"
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-700">القسم *</span>
                <select
                  className={inputClass}
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value as ListingDraft['category'] })}
                >
                  {LISTING_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-700">وصف قصير</span>
                <textarea
                  className={`${inputClass} min-h-[72px]`}
                  value={draft.shortDesc}
                  onChange={(e) => setDraft({ ...draft, shortDesc: e.target.value })}
                  placeholder="وش يوصل العميل مع هذا المنتج"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="font-bold text-slate-700">السعر *</span>
                  <input
                    className={`${inputClass} font-mono`}
                    type="number"
                    min="1"
                    step="1"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    required
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="font-bold text-slate-700">وحدة السعر</span>
                  <select
                    className={inputClass}
                    value={draft.priceUnit}
                    onChange={(e) => setDraft({ ...draft, priceUnit: e.target.value as ListingDraft['priceUnit'] })}
                  >
                    {LISTING_PRICE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700">التغطية</span>
                <PlaceMultiPicker value={draft.cities} onToggle={toggleCity} />
              </div>
              <ProductImagesPicker
                value={draft.images}
                onChange={(next) => {
                  setDraft((prev) => ({ ...prev, images: next }));
                  setError('');
                }}
                onUploadingChange={setUploading}
              />

              <FulfillmentLanePicker
                heading="مسار يوصل"
                required
                variant="chips"
                hint="يوصل ساعة · يوصل اليوم · يوصل بكرا · حجز فوري — تقدر تختار أكثر من واحد لنفس المنتج."
                value={draft.fulfillment}
                onChange={(next) => {
                  setDraft({ ...draft, fulfillment: next });
                  setError('');
                }}
              />

              <fieldset className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] p-3 space-y-2 text-right">
                <legend className="px-1 text-sm font-extrabold text-[#0A1A33]">
                  طريقة تأكيد الحجز
                  <span className="text-rose-600"> *</span>
                </legend>
                <p className="text-[11px] text-[#475467] leading-relaxed">
                  هذي غير «مسار يوصل» — هنا تحدد هل حجز العميل يتأكد مباشرة أو ينتظر موافقتك.
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="طريقة تأكيد الحجز">
                  {LISTING_BOOKING_MODES.map((mode) => {
                    const checked = draft.bookingMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => {
                          setDraft({ ...draft, bookingMode: mode });
                          setError('');
                        }}
                        className={`px-3 min-h-[40px] rounded-full text-[12px] font-extrabold border transition-colors ${
                          checked
                            ? 'bg-[#155EEF] border-[#155EEF] text-white'
                            : 'bg-white border-[#E4E7EC] text-[#0A1A33] hover:border-[#155EEF]'
                        }`}
                      >
                        {BOOKING_MODE_AR_LABEL[mode]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#475467] leading-relaxed">
                  {BOOKING_MODE_AR_LABEL[draft.bookingMode]} — {BOOKING_MODE_AR_HINT[draft.bookingMode]}
                  {draft.bookingMode === 'approval'
                    ? ' · زر العميل في السوق: «اطلب الحجز».'
                    : ' · زر العميل في السوق: «احجز الآن».'}
                </p>
              </fieldset>

              {error ? <p className="text-rose-600 font-bold">{error}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploading || draft.images.length < LISTING_MIN_IMAGES || !draft.fulfillment.length}
                  className="px-5 h-10 rounded-xl bg-[#0A1A33] hover:bg-[#155EEF] text-white font-black inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0A1A33]"
                >
                  <Check className="w-4 h-4" />
                  {editing ? 'حفظ التعديلات' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
