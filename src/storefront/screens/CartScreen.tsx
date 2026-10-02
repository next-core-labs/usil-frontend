import React from 'react';
import { ShoppingBag, Minus, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { hasCheckoutPrice } from '../../utils/catalogMedia';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { money, vatInside } from '../money';
import { ArrowIcon } from '../primitives';
import { productPhoto } from '../ProductCard';

/** Cart page: item rows with quantity steppers and a sticky summary. Prices are VAT-inclusive. */
export function CartScreen() {
  const { t, ar } = useLang();
  const sf = useStorefront();
  const items = sf.cart;
  const count = items.reduce((sum, c) => sum + c.quantity, 0);
  const total = items.reduce((sum, c) => sum + (hasCheckoutPrice(c.service.price) ? c.service.price * c.quantity : 0), 0);

  return (
    <main className="max-w-[1100px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]">{t.cartTitle}</h1>
        <span className="text-sm text-ink-3 tnum">
          {count} {t.items}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="mt-7 py-16 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
          <span className="inline-grid place-items-center w-16 h-16 rounded-card bg-tint-blue text-action">
            <ShoppingBag className="w-7 h-7" aria-hidden />
          </span>
          <div className="text-xl font-bold mt-[18px]">{t.cartEmpty}</div>
          <div className="text-sm text-ink-3 mt-1.5">{t.cartEmptySub}</div>
          <button type="button" onClick={() => sf.goCatalog()} className="mt-[22px] h-12 px-6 rounded-xl bg-navy text-white text-[15px] font-semibold">
            {t.browse}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-6 items-start">
          <div className="flex flex-col gap-2.5">
            {items.map((c) => {
              const photo = productPhoto(c.service);
              const line = hasCheckoutPrice(c.service.price) ? money(c.service.price * c.quantity, ar) : '—';
              return (
                <div key={c.service.id} className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-4 items-center p-3.5 bg-surface border border-line rounded-card">
                  <a
                    href={`/service/${encodeURIComponent(c.service.id)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      sf.goProduct(c.service.id);
                    }}
                    className="w-[88px] h-[88px] rounded-xl overflow-hidden bg-paper block"
                  >
                    {photo ? <img src={photo} alt="" className="w-full h-full object-cover block" /> : null}
                  </a>
                  <div className="min-w-0">
                    <div className="text-xs text-ink-3 truncate">{c.service.provider?.name}</div>
                    <div className="text-[15px] font-semibold mt-0.5 leading-[1.4]">{c.service.title}</div>
                    <div className="text-xs text-ink-3 mt-1 tnum">
                      {money(c.service.price, ar)} / {c.service.priceUnit}
                      {c.date ? ` · ${c.date}` : ''}
                    </div>
                    <div className="flex items-center gap-3.5 mt-2.5 flex-wrap">
                      <div className="flex items-center gap-1 border border-line rounded-control p-0.5">
                        <button
                          type="button"
                          onClick={() => sf.updateQuantity(c.service.id, -1)}
                          className="w-[30px] h-[30px] rounded-lg bg-paper grid place-items-center min-h-0"
                          aria-label="−"
                        >
                          <Minus className="w-3.5 h-3.5" aria-hidden />
                        </button>
                        <span className="min-w-[26px] text-center font-bold text-sm tnum">{c.quantity}</span>
                        <button
                          type="button"
                          onClick={() => sf.updateQuantity(c.service.id, 1)}
                          className="w-[30px] h-[30px] rounded-lg bg-navy text-white grid place-items-center min-h-0"
                          aria-label="+"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => sf.removeFromCart(c.service.id)}
                        className="flex items-center gap-1.5 text-ink-3 text-[13px] min-h-0 p-0 hover:text-danger"
                      >
                        <Trash2 className="w-[15px] h-[15px]" aria-hidden />
                        {t.remove}
                      </button>
                    </div>
                  </div>
                  <div className="text-[17px] font-bold whitespace-nowrap self-start tnum">{line}</div>
                </div>
              );
            })}
            <a
              href="/catalog"
              onClick={(e) => {
                e.preventDefault();
                sf.goCatalog();
              }}
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-action no-underline w-fit"
            >
              {t.continueShop}
              <ArrowIcon className="w-4 h-4" />
            </a>
          </div>

          <aside className="md:sticky md:top-[84px] bg-surface border border-line rounded-card p-[22px]">
            <div className="flex justify-between text-sm text-ink-1 py-2">
              <span>{t.subtotal}</span>
              <span className="tnum">{money(total, ar)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-1 py-2">
              <span>{t.vat}</span>
              <span className="tnum">{money(vatInside(total), ar)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-dashed border-navy-300">
              <span className="text-[15px] font-semibold">{t.total}</span>
              <span className="text-2xl font-bold tracking-[-0.02em] tnum">{money(total, ar)}</span>
            </div>
            <div className="text-xs font-medium text-success mt-1">{t.vatIncluded}</div>
            <button
              type="button"
              onClick={() => sf.navigate('/checkout')}
              className="w-full mt-4 h-[52px] rounded-xl bg-action text-white text-base font-bold flex items-center justify-center gap-2 transition-colors hover:bg-action-hover"
            >
              {t.checkout}
              <ArrowIcon className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center justify-center gap-2 mt-3.5 text-xs text-ink-3">
              <ShieldCheck className="w-3.5 h-3.5 text-action" aria-hidden />
              {t.secure}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
