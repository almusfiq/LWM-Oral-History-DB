import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { num, useLang } from '../i18n';

interface StoryPhotoSlideshowProps {
  pictures: string[];
  school: string;
  district: string;
}

export default function StoryPhotoSlideshow({ pictures, school, district }: StoryPhotoSlideshowProps) {
  const { t, lang } = useLang();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const timerRef = useRef<number | null>(null);

  const total = pictures.length;

  // Auto-advance every 5 seconds unless paused or modal is open
  useEffect(() => {
    if (total <= 1 || isPaused || lightboxOpen) return;

    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, lightboxOpen, currentIndex]);

  // Keyboard navigation for lightbox, and the page behind kept still
  useEffect(() => {
    if (!lightboxOpen) return;
    document.documentElement.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % total);
      else if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + total) % total);
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); document.documentElement.style.overflow = ''; };
  }, [lightboxOpen, total]);

  if (!pictures || pictures.length === 0) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % total);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + total) % total);

  return (
    <div className="relative mx-auto w-full">
      {/* Container with archival framing */}
      <div
        className="group relative overflow-hidden rounded-2xl border border-[var(--rd-rule)] bg-black/5 shadow-[0_20px_50px_-20px_rgba(11,15,13,0.25)] transition-all duration-500"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Aspect ratio frame */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink/90 sm:aspect-[16/9] max-h-[460px]">
          {pictures.map((pic, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={pic}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={pic}
                  alt={`${school} - ছবি ${num(idx + 1, lang)}`}
                  className={`h-full w-full object-contain transition-transform duration-10000 ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  onLoad={() => setLoadedImages((prev) => ({ ...prev, [idx]: true }))}
                />
              </div>
            );
          })}

          {/* Vignette & subtle gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 z-10" />

          {/* Bottom caption and school */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between gap-4">
            <div className="max-w-[75%]">
              <p className="text-xs font-semibold text-white/95 drop-shadow sm:text-sm line-clamp-1" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                {school}
              </p>
              <p className="text-[11px] text-white/65 drop-shadow line-clamp-1" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                {district} · {t('Recorded by students of this school', 'এই বিদ্যালয়ের শিক্ষার্থীদের সংগৃহীত')}
              </p>
            </div>

            {/* Expand / Lightbox button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={t('View full photograph', 'বড় করে দেখুন')}
              title={t('Full screen', 'পূর্ণ পর্দা')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm border border-white/20 transition-all hover:border-white/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </button>
          </div>

          {/* Prev / Next controls */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                aria-label={t('Previous photo', 'পূর্ববর্তী ছবি')}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/75 text-white/80 hover:text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg className="w-5 h-5 -translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label={t('Next photo', 'পরবর্তী ছবি')}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/75 text-white/80 hover:text-white backdrop-blur-md border border-white/15 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* 5-second countdown line animation */}
          {total > 1 && !isPaused && (
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/20 z-30 overflow-hidden">
              <div
                key={currentIndex}
                className="h-full bg-gold-bright"
                style={{
                  animation: 'progressBar 5s linear forwards',
                }}
              />
            </div>
          )}
        </div>

        {/* Dots navigation at bottom */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 bg-[var(--rd-card)] border-t border-[var(--rd-rule)]">
            {pictures.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentIndex(dotIdx)}
                aria-label={t(`Show photo ${dotIdx + 1}`, `ছবি ${num(dotIdx + 1, lang)} দেখুন`)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  dotIdx === currentIndex ? 'w-6 bg-forest' : 'w-2 bg-ink/20 hover:bg-ink/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {/* Full screen viewer, drawn over the whole page (above the paper's tape and the reading bar) */}
      {lightboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={school}
          className="fixed inset-0 z-[95] flex flex-col bg-[#0B0F0D]/95 text-white backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
            <span className="truncate text-white/85">{school} · {district}</span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums text-white/70">{num(currentIndex + 1, lang)} / {num(total, lang)}</span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label={t('Close', 'বন্ধ করুন')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8 sm:px-24">
            <img
              key={pictures[currentIndex]}
              src={pictures[currentIndex]}
              alt={`${school} - ${num(currentIndex + 1, lang)}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-fade-in"
            />
            {total > 1 && (['prev', 'next'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={(e) => { e.stopPropagation(); if (dir === 'next') nextSlide(); else prevSlide(); }}
                aria-label={dir === 'next' ? t('Next photo', 'পরবর্তী ছবি') : t('Previous photo', 'পূর্ববর্তী ছবি')}
                className={`absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 ${dir === 'next' ? 'right-3 sm:right-8' : 'left-3 sm:left-8'}`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={dir === 'next' ? 'm9 5 7 7-7 7' : 'M15 19 8 12l7-7'} /></svg>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
