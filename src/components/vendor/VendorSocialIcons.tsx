import React from 'react';
import { Instagram, Music2, Youtube, MessageCircle, BadgeCheck } from 'lucide-react';
import type { VendorSocialLink } from '../../contracts/vendors/vendor-socials';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  tiktok: Music2,
  snapchat: MessageCircle,
  x: XMark,
  youtube: Youtube,
  whatsapp: MessageCircle,
};

const LABELS: Record<string, string> = {
  instagram: 'إنستغرام',
  tiktok: 'تيك توك',
  snapchat: 'سناب شات',
  x: 'إكس',
  youtube: 'يوتيوب',
  whatsapp: 'واتساب',
};

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M14.7 10.2 22 2h-2.2l-6.1 6.8L8.7 2H2l7.7 10.9L2 22h2.2l6.6-7.4L15.3 22H22l-7.3-11.8Zm-2.3 2.6-.8-1.1L5 3.6h2.6l5.1 7.2.8 1.1L19.2 20.4h-2.6l-4.2-7.6Z" />
    </svg>
  );
}

export function VendorSocialIcons({
  links,
  emptyLabel = 'المورد ما ربط حسابات بعد',
  compact = false,
}: {
  links?: Array<Pick<VendorSocialLink, 'network' | 'url' | 'status' | 'handle'>>;
  emptyLabel?: string;
  compact?: boolean;
}) {
  const shown = (links || []).filter((link) => link.url);
  if (!shown.length) {
    if (compact) return null;
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className={`flex flex-wrap items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {shown.map((link) => {
        const Icon = ICONS[link.network] || Instagram;
        return (
          <a
            key={link.network}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            title={LABELS[link.network] || link.network}
            className={`inline-flex items-center gap-1 rounded-full border transition-colors ${
              compact
                ? 'w-7 h-7 justify-center border-slate-200 bg-white text-slate-700 hover:border-action hover:text-action'
                : 'px-2.5 py-1 border-slate-200 bg-white text-slate-800 hover:border-action'
            }`}
          >
            <Icon className={compact ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} />
            {!compact ? <span className="text-2xs font-medium">{LABELS[link.network]}</span> : null}
            {link.status === 'verified' ? (
              <span className="inline-flex items-center gap-0.5 text-2xs font-medium text-emerald-700">
                <BadgeCheck className="w-3 h-3" />
                {!compact ? 'موثّق' : null}
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}

export function hasInstagramLink(links?: Array<{ network: string; url?: string }>): boolean {
  return Boolean(links?.some((link) => link.network === 'instagram' && link.url));
}
