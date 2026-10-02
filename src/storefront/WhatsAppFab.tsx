import React from 'react';
import { MessageCircle } from 'lucide-react';
import { usilWhatsAppUrl } from '../utils/ownerWhatsApp';
import { useLang } from './lang';
import { useIsMobile } from './primitives';

/** Pulsing blue support button, bottom-end; lifted above the tab bar on phones. */
export function WhatsAppFab() {
  const { t } = useLang();
  const mobile = useIsMobile();
  return (
    <a
      href={usilWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsapp}
      title={t.whatsapp}
      className="fixed end-5 z-[70] w-[54px] h-[54px] rounded-[14px] bg-action text-white grid place-items-center shadow-[0_12px_30px_-10px_rgba(21,94,239,.7)] transition-transform hover:scale-[1.08]"
      style={{ bottom: mobile ? '92px' : '24px', animation: 'lm-pulse 2.4s ease-out infinite' }}
    >
      <MessageCircle className="w-[26px] h-[26px]" aria-hidden />
    </a>
  );
}
