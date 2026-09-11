import React, { useState } from 'react';
import { isAllowedListingImage } from '../utils/catalogMedia';

const CATEGORY_COLORS: Record<string, string> = {
  hospitality: '#0A1A33',
  buffet: '#5C2B12',
  decoration: '#2C2156',
  photography: '#12343B',
  entertainment: '#3A1D3A',
  halls: '#1B2A4A',
  rental: '#1F3344',
  servers: '#0A1A33',
  av: '#10243A',
  tents: '#243018',
  zaffa: '#3A2410',
  cakes: '#3A2030',
  invitations: '#1A2740',
  parking: '#222833',
  condolence: '#1A1F28',
};

export function brandedPlaceholder(label: string, category?: string): string {
  const bg = CATEGORY_COLORS[category || ''] || '#0A1A33';
  const text = (label || 'يوصل').slice(0, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <rect width="800" height="500" fill="${bg}"/>
    <text x="400" y="245" text-anchor="middle" fill="#C0A16B" font-size="42" font-family="system-ui,Segoe UI,Tahoma,sans-serif" font-weight="700">يوصل</text>
    <text x="400" y="300" text-anchor="middle" fill="#FFFFFF" font-size="22" font-family="system-ui,Segoe UI,Tahoma,sans-serif">${text.replace(/[<>&]/g, '')}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function BrandedImage({
  src,
  alt,
  category,
  className,
}: {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
}) {
  const fallback = brandedPlaceholder(alt, category);
  const safe = isAllowedListingImage(src) ? String(src) : fallback;
  const [current, setCurrent] = useState(safe);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
