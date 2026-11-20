import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { num, useLang } from '../i18n';

const SEEN_KEY = 'lwm-intro-seen';

function firstVisitThisSession() {
  try { return !sessionStorage.getItem(SEEN_KEY); } catch { return true; }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
}

/** Share of the page's images that have finished loading (1 once the window has loaded). */
function loadProgress() {
  if (document.readyState === 'complete') return 1;
  const images = Array.from(document.images);
  return images.length ? images.filter((image) => image.complete).length / images.length : 0;
}

/**
 * Full-screen opening in the flag's colours. On deep green, a thin red ring draws itself around the
 * centre as the page really loads, with the count in the corner and the museum's name rising beneath.
 * When loading is done the ring fills into the flag's red disc, then the green splits in two, top and
 * bottom sliding away, and the disc shrinks to nothing, revealing the site.
 * Full piece on the first visit of a session, a short one on reloads, skippable, never on /admin.
 * The name rises by whole words: splitting Bangla into letters breaks conjuncts.
 */
export default function Preloader() {
  const [visible] = useState(() => !window.location.pathname.startsWith('/admin'));
  const [done, setDone] = useState(!visible);
  const { t, lang } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const exitRef = useRef<() => void>(() => {});

  // Lets the hero title's entrance wait until the screen has opened, so it is seen.
  useEffect(() => {
    if (done) document.documentElement.dataset.intro = 'done';
  }, [done]);

  useEffect(() => {
    if (!visible || done || !rootRef.current) return;
    const root = rootRef.current;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    const full = firstVisitThisSession();
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const q = gsap.utils.selector(root);
    let tick = () => {};

    const show = (value: number) => {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(1 - value);
      if (countRef.current) countRef.current.textContent = num(Math.round(value * 100), 'bn');
    };

    const ctx = gsap.context(() => {
      let leaving = false;
      const leave = () => {
        if (leaving) return;
        leaving = true;
        markSeen();
        gsap.ticker.remove(tick);
        show(1);
        if (calm) { gsap.to(root, { opacity: 0, duration: 0.4, onComplete: () => setDone(true) }); return; }
        gsap.timeline({ onComplete: () => setDone(true) })
          // The ring fills into the flag's red disc; the ring and its faint track then go entirely,
          // so no outline is left over the site.
          .to(q('[data-pl-disc]'), { scale: 1, duration: 0.7, ease: 'expo.out' })
          .to(q('[data-pl-track]'), { opacity: 0, duration: 0.35 }, '<0.2')
          .to(q('[data-pl-fade]'), { opacity: 0, duration: 0.35, ease: 'power2.in' }, '<')
          // The green splits in two and slides away; the disc shrinks to nothing.
          .to(q('[data-pl-top]'), { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=0.15')
          .to(q('[data-pl-bottom]'), { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
          .to(q('[data-pl-disc]'), { scale: 0, duration: 0.9, ease: 'expo.inOut' }, '<0.05')
          .to(q('[data-pl-grain]'), { opacity: 0, duration: 0.6 }, '<');
      };
      exitRef.current = leave;

      // The intro sets the pace; the ring never runs ahead of what has actually loaded.
      const intro = gsap.timeline({ paused: calm });
      const shown = { value: 0 };
      tick = () => {
        const target = Math.min(calm ? 1 : intro.progress(), loadProgress());
        shown.value += (target - shown.value) * 0.07;
        if (target === 1 && shown.value > 0.995) shown.value = 1;
        show(shown.value);
        if (shown.value === 1 && (calm || intro.progress() === 1)) leave();
      };
      gsap.ticker.add(tick);
      if (calm) return;

      const pace = full ? 1 : 0.45;
      intro
        .from(q('[data-pl-chrome]'), { opacity: 0, y: 10, duration: 0.7, stagger: 0.08, ease: 'power3.out' })
        .from(q('[data-pl-track]'), { scale: 0.85, opacity: 0, duration: 1, ease: 'expo.out' }, 0.1)
        .from(q('[data-pl-word]'), { yPercent: 115, duration: 1.1 * Math.max(pace, 0.6), stagger: 0.18 * pace, ease: 'expo.out' }, 0.35 * pace)
        .from(q('[data-pl-sub]'), { opacity: 0, y: 8, duration: 0.8, ease: 'power3.out' }, 0.8 * pace)
        .to({}, { duration: 1.2 * pace });
    }, root);

    // Never hold the visitor for long if something fails to load.
    const failsafe = window.setTimeout(() => exitRef.current(), 9000);
    return () => { window.clearTimeout(failsafe); gsap.ticker.remove(tick); ctx.revert(); html.style.overflow = ''; };
    // Runs once per page load; the language can change underneath without restarting it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, done]);

  if (!visible || done) return null;

  const bnFont = { fontFamily: "'Noto Sans Bengali', sans-serif" };

  return (
    <div
      ref={rootRef}
      data-pl-sheet
      role="status"
      aria-label={t('Loading the archive', 'আর্কাইভ লোড হচ্ছে')}
      onClick={() => exitRef.current()}
      className="fixed inset-0 z-[100] h-dvh w-screen cursor-pointer select-none overflow-hidden text-white"
    >
      {/* The two halves of the green that split apart on the way out */}
      <div data-pl-top className="absolute inset-x-0 top-0 h-[50.5%] bg-forest-deep" />
      <div data-pl-bottom className="absolute inset-x-0 bottom-0 h-[50.5%] bg-forest-deep" />
      <div data-pl-grain aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-70"><div className="film-grain" /></div>

      <p data-pl-fade className="absolute bottom-3 right-5 flex items-baseline gap-1 leading-none sm:bottom-6 sm:right-10" aria-hidden="true">
        <span data-pl-chrome ref={countRef} className="text-6xl font-bold tabular-nums sm:text-8xl" style={bnFont}>{num(0, 'bn')}</span>
        <span data-pl-chrome className="text-xl font-semibold text-flag sm:text-3xl">%</span>
      </p>

      {/* Centre: the ring that becomes the flag's disc, and the museum's name */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
        <div className="relative h-[min(52vw,15rem)] w-[min(52vw,15rem)]">
          <span data-pl-disc aria-hidden="true" className="absolute inset-[3%] scale-0 rounded-full bg-flag" />
          <svg data-pl-track viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 -rotate-90">
            <circle cx={50} cy={50} r={47} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            <circle ref={ringRef} cx={50} cy={50} r={47} fill="none" stroke="#D11F35" strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1} />
          </svg>
        </div>

        <h2 data-pl-fade lang="bn" className="mt-10 flex flex-wrap justify-center gap-x-[0.28em] text-[clamp(2.4rem,7vw,5rem)] font-bold leading-[1.2]" style={bnFont}>
          {['মুক্তিযুদ্ধ', 'জাদুঘর'].map((word) => (
            <span key={word} className="block overflow-hidden pt-[0.3em] pb-[0.1em] -mt-[0.3em]">
              <span data-pl-word className="block">{word}</span>
            </span>
          ))}
        </h2>
        <p data-pl-fade lang="en" className="mt-2 text-xs font-medium uppercase text-white/75 sm:text-sm" style={{ letterSpacing: '0.35em' }}>
          <span data-pl-sub className="block">Liberation War Museum</span>
        </p>
      </div>
    </div>
  );
}
