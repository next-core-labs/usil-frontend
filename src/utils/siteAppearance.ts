import { useEffect, useState } from 'react';

/**
 * «مظهر الواجهة» — the storefront side of `GET /api/site/appearance`
 * (backend: server/site/), set from the owner console.
 */
export type HeroCard = {
  /** `/uploads/…`; '' keeps the design photo. */
  image: string;
  /** false shows the card as a solid colour. */
  showImage: boolean;
  color: string;
};

/** The design: grounds navy-700, action, tint-blue under the three hero photos. */
export const DEFAULT_HERO_CARDS: HeroCard[] = [
  { image: '', showImage: true, color: '#163A78' },
  { image: '', showImage: true, color: '#155EEF' },
  { image: '', showImage: true, color: '#DBE7FF' },
];

const CACHE_KEY = 'usil.siteAppearance';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function normalizeCards(raw: unknown): HeroCard[] | null {
  if (!Array.isArray(raw)) return null;
  return DEFAULT_HERO_CARDS.map((fallback, index) => {
    const card = raw[index] && typeof raw[index] === 'object' ? (raw[index] as Partial<HeroCard>) : {};
    return {
      image: typeof card.image === 'string' && card.image.startsWith('/uploads/') ? card.image : '',
      showImage: typeof card.showImage === 'boolean' ? card.showImage : true,
      color: typeof card.color === 'string' && HEX_COLOR.test(card.color) ? card.color : fallback.color,
    };
  });
}

function readCache(): HeroCard[] | null {
  try {
    return normalizeCards(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'));
  } catch {
    return null;
  }
}

/**
 * The hero cards as last saved by the owner. `ready` stays false until the
 * API (or the copy cached from a previous visit) answers, so a custom photo
 * is not preceded by a flash of the design one.
 */
export function useHeroCards(): { cards: HeroCard[]; ready: boolean } {
  const [state, setState] = useState(() => {
    const cached = readCache();
    return { cards: cached || DEFAULT_HERO_CARDS, ready: Boolean(cached) };
  });

  useEffect(() => {
    let alive = true;
    fetch('/api/site/appearance')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data?: { heroCards?: unknown } } | null) => {
        const cards = normalizeCards(body?.data?.heroCards);
        if (!alive) return;
        if (!cards) return setState((current) => ({ ...current, ready: true }));
        setState({ cards, ready: true });
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cards));
        } catch {
          /* private mode — the next visit just waits for the API */
        }
      })
      .catch(() => alive && setState((current) => ({ ...current, ready: true })));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
