import React from 'react';
import { FulfillmentLane } from '../types';
import { FULFILLMENT_LANES } from '../data/saudiMarket';

interface FulfillmentLanePickerProps {
  value: FulfillmentLane[];
  onChange: (next: FulfillmentLane[]) => void;
  heading?: string;
  hint?: string;
  required?: boolean;
  variant?: 'cards' | 'chips';
}

export const FulfillmentLanePicker: React.FC<FulfillmentLanePickerProps> = ({
  value,
  onChange,
  heading = 'أقدر أخدم في',
  hint = 'اختر المسارات التي تقدر تبدأ أو تصل فيها فعلًا داخل المدينة. ليست ساعي ١٥ دقيقة ولا تتبع وهمي على الخريطة.',
  required = false,
  variant = 'cards',
}) => {
  const toggle = (id: FulfillmentLane) => {
    if (value.includes(id)) {
      onChange(value.filter((lane) => lane !== id));
      return;
    }
    onChange([...value, id]);
  };

  return (
    <fieldset className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] p-3 space-y-2 text-right">
      <legend className="px-1 text-sm font-extrabold text-[#0A1A33]">
        {heading}
        {required ? <span className="text-rose-600"> *</span> : null}
      </legend>
      {hint ? <p className="text-[11px] text-[#475467] leading-relaxed">{hint}</p> : null}
      {variant === 'chips' ? (
        <div className="flex flex-wrap gap-2">
          {FULFILLMENT_LANES.map((lane) => {
            const checked = value.includes(lane.id);
            return (
              <button
                key={lane.id}
                type="button"
                onClick={() => toggle(lane.id)}
                aria-pressed={checked}
                className={`px-3 min-h-[40px] rounded-full text-[12px] font-extrabold border transition-colors ${
                  checked
                    ? 'bg-[#155EEF] border-[#155EEF] text-white'
                    : 'bg-white border-[#E4E7EC] text-[#0A1A33] hover:border-[#155EEF]'
                }`}
              >
                {lane.chip}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {FULFILLMENT_LANES.map((lane) => {
            const checked = value.includes(lane.id);
            return (
              <label
                key={lane.id}
                className={`flex items-start gap-2 rounded-xl border p-2.5 cursor-pointer ${
                  checked ? 'border-[#155EEF] bg-white' : 'border-[#E4E7EC] bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(lane.id)}
                  className="mt-0.5 accent-[#155EEF]"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-extrabold text-[#0A1A33]">{lane.chip}</span>
                  <span className="block text-[11px] text-[#475467] leading-snug">{lane.meaning}</span>
                  <span className="block text-[10px] text-[#667085] mt-0.5">{lane.examples}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}
      {required && value.length === 0 ? (
        <p className="text-[11px] font-bold text-rose-600">مطلوب: اختر مساراً واحداً على الأقل</p>
      ) : null}
    </fieldset>
  );
};
