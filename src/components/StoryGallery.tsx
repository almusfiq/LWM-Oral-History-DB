import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { num, useLang } from '../i18n';

interface StoryGalleryProps {
  pictures: string[];
  school: string;
  district: string;
}

/**
 * The students who collected the story, at their school: one large photograph with two beside it and the
 * rest behind a "+N" tile. Any photograph opens a full-screen viewer (arrow keys, Escape, swipe-free buttons).
 */
export default function StoryGallery({ pictures, school, district }: StoryGalleryProps) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const total = pictures.length;
  const shown = pictures.slice(0, 3);
  const more = total - shown.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
      if (event.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % total));
      if (event.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + total) % total));
    };
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [open, total]);

  const alt = (i: number) => t(`Students of ${school}, photograph ${i + 1}`, `${school}-এর শিক্ষার্থীরা, ছবি ${num(i + 1, lang)}`);

  return (
    <figure>
      <div className={`grid gap-2 sm:gap-3 ${shown.length > 1 ? 'sm:grid-cols-3 sm:grid-rows-2 sm:aspect-[2/1]' : ''}`}>
        {shown.map((src, i) => {
          const last = i === shown.length - 1 && more > 0;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={t('Open photograph', 'ছবিটি বড় করে দেখুন')}
              className={`group relative overflow-hidden rounded-xl bg-black/10 ${i === 0 && shown.length > 1 ? 'aspect-[4/3] sm:aspect-auto sm:col-span-2 sm:row-span-2' : 'max-sm:hidden'}`}
            >
              <img src={src} alt={alt(i)} loading={i ? 'lazy' : 'eager'} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              {last && (
                <span className="absolute inset-0 flex items-center justify-center bg-night/60 text-2xl font-semibold text-white backdrop-blur-[2px] transition-colors group-hover:bg-night/50">
                  +{num(more, lang)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm text-[var(--rd-muted)]">
        <span>
          {t('Collected by students of ', '')}<b className="font-semibold text-[var(--rd-text)]">{school}</b>{t(`, ${district}`, `-এর শিক্ষার্থীরা গল্পটি সংগ্রহ করেছে · ${district}`)}
        </span>
        <button type="button" onClick={() => setOpen(0)} className="font-semibold text-[var(--rd-accent)] hover:underline sm:hidden">
          {t(`See all ${total} photographs`, `সব ${num(total, lang)}টি ছবি দেখুন`)}
        </button>
        <span className="max-sm:hidden">{t(`${total} photographs`, `${num(total, lang)}টি ছবি`)}</span>
      </figcaption>

      {open !== null && createPortal(
        <div role="dialog" aria-modal="true" aria-label={t('Photographs', 'ছবি')} className="fixed inset-0 z-[90] flex flex-col bg-night/95 text-white backdrop-blur-sm animate-fade-in" onClick={() => setOpen(null)}>
          <div className="flex items-center justify-between px-5 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
            <span className="truncate text-white/80">{school}</span>
            <span className="mx-4 shrink-0 tabular-nums text-white/70">{num(open + 1, lang)} / {num(total, lang)}</span>
            <button type="button" onClick={() => setOpen(null)} aria-label={t('Close', 'বন্ধ করুন')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-20">
            <img key={pictures[open]} src={pictures[open]} alt={alt(open)} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-fade-in" />
            {total > 1 && (['prev', 'next'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((i) => (i === null ? i : (i + (dir === 'next' ? 1 : -1) + total) % total)); }}
                aria-label={dir === 'next' ? t('Next photograph', 'পরের ছবি') : t('Previous photograph', 'আগের ছবি')}
                className={`absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 ${dir === 'next' ? 'right-3 sm:right-6' : 'left-3 sm:left-6'}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true"><path d={dir === 'next' ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </figure>
  );
}
