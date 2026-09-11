import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { LISTING_MAX_IMAGES, LISTING_MIN_IMAGES } from '../../contracts/vendors/vendor-listings';

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ prefix: 'listing', dataUrl }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.url) throw new Error(String(body?.error || 'تعذر رفع الصورة، جرّب مرة ثانية'));
  return String(body.url);
}

export function ProductImagesPicker({
  value,
  onChange,
  onUploadingChange,
  deferUpload = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  /** Keep photos as data URLs until the parent submits (vendor registration). */
  deferUpload?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');

  const setBusy = (count: number) => {
    setUploading(count);
    onUploadingChange?.(count > 0);
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError('');
    const room = LISTING_MAX_IMAGES - value.length;
    if (room <= 0) {
      setError(`الحد الأقصى ${LISTING_MAX_IMAGES} صور للمنتج`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);
    if (Array.from(files).length > room) setError(`الحد الأقصى ${LISTING_MAX_IMAGES} صور للمنتج`);

    const valid: File[] = [];
    for (const file of chosen) {
      if (!ACCEPTED.includes(file.type)) {
        setError('الصيغة غير مدعومة — jpg أو png أو webp فقط');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError('حجم الصورة كبير — الحد الأقصى 5 ميغابايت');
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) return;

    setBusy(valid.length);
    const uploaded: string[] = [];
    for (const file of valid) {
      try {
        uploaded.push(deferUpload ? await readAsDataUrl(file) : await uploadImage(file));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'تعذر رفع الصورة');
      }
      setBusy(valid.length - uploaded.length);
    }
    setBusy(0);
    if (uploaded.length) onChange([...value, ...uploaded].slice(0, LISTING_MAX_IMAGES));
  };

  const removeAt = (index: number) => {
    setError('');
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <fieldset className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] p-3 space-y-2 text-right">
      <legend className="px-1 text-sm font-extrabold text-[#0A1A33]">
        صور المنتج
        <span className="text-rose-600"> *</span>
      </legend>
      <p className="text-[11px] text-[#475467] leading-relaxed">
        ارفع صور المنتج من جوالك أو جهازك — صورتين على الأقل. أول صورة هي الصورة الرئيسية في السوق.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-[#E4E7EC] bg-white">
            <img src={url} alt={`صورة المنتج ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
            {index === 0 ? (
              <span className="absolute bottom-0 inset-x-0 bg-[#0A1A33]/85 text-white text-[9px] font-extrabold text-center py-0.5">
                الصورة الرئيسية
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`حذف صورة ${index + 1}`}
              className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white/95 border border-[#E4E7EC] text-rose-600 inline-flex items-center justify-center shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {uploading > 0
          ? Array.from({ length: uploading }).map((_, index) => (
              <div
                key={`pending-${index}`}
                className="aspect-square rounded-xl border border-dashed border-[#155EEF]/40 bg-white inline-flex items-center justify-center"
              >
                <Loader2 className="w-5 h-5 text-[#155EEF] animate-spin" />
              </div>
            ))
          : null}

        {value.length + uploading < LISTING_MAX_IMAGES ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-[#155EEF]/50 bg-white text-[#155EEF] inline-flex flex-col items-center justify-center gap-1 hover:border-[#155EEF] hover:bg-[#155EEF]/5"
            aria-label="أضف صور المنتج"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-[10px] font-extrabold">أضف صورة</span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          void pickFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {uploading > 0 ? <p className="text-[11px] font-bold text-[#155EEF]">جاري رفع الصور…</p> : null}
      {error ? <p className="text-[11px] font-bold text-rose-600">{error}</p> : null}
      {value.length < LISTING_MIN_IMAGES ? (
        <p className="text-[11px] font-bold text-rose-600">مطلوب: أضف صورتين على الأقل</p>
      ) : null}
    </fieldset>
  );
}
