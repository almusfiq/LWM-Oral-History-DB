import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Page } from '../App';
import { allDistricts } from '../data/bangladeshLocations';
import { useLang } from '../i18n';

gsap.registerPlugin(ScrollTrigger);

interface DistrictMarqueeProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
}

/**
 * A calm band of all 64 districts. It drifts on its own; the pointer's position along the band
 * steers its speed and direction, scrolling nudges it along, and a hovered name stops it dead so
 * the district can be opened.
 */
export default function DistrictMarquee({ navigate }: DistrictMarqueeProps) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const bandRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const steerRef = useRef(1);
  const pausedRef = useRef(false);

  const ease = (to: number, duration = 0.6) => {
    const tween = tweenRef.current;
    if (!tween) return;
    gsap.killTweensOf(tween);
    if (duration === 0) tween.timeScale(to);
    else gsap.to(tween, { timeScale: to, duration, ease: 'power2.out' });
  };

  useEffect(() => {
    if (!trackRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // The list is rendered twice, so sliding by half its width loops seamlessly.
    const tween = gsap.to(trackRef.current, { xPercent: -50, duration: 110, ease: 'none', repeat: -1 });
    tweenRef.current = tween;
    const trigger = ScrollTrigger.create({
      trigger: bandRef.current, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        if (pausedRef.current) return;
        const nudge = gsap.utils.clamp(-3, 3, self.getVelocity() / 600);
        gsap.killTweensOf(tween);
        gsap.timeline()
          .to(tween, { timeScale: steerRef.current + nudge, duration: 0.25, ease: 'power2.out' })
          .to(tween, { timeScale: steerRef.current, duration: 0.8, ease: 'power2.out' });
      },
    });
    return () => { tween.kill(); trigger.kill(); tweenRef.current = null; };
  }, [lang]);

  const steer = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || pausedRef.current || !bandRef.current) return;
    const box = bandRef.current.getBoundingClientRect();
    steerRef.current = ((event.clientX - box.left) / box.width - 0.5) * 4 || 0.3; // left drifts back, right hurries on
    ease(steerRef.current);
  };

  const names = allDistricts.map((district, index) => (
    <button
      key={district.id}
      type="button"
      onClick={() => navigate('location-detail', { locationDivisionId: district.divisionId, locationDistrictId: district.id })}
      onPointerEnter={() => { pausedRef.current = true; ease(0, 0); }}
      onPointerLeave={() => { pausedRef.current = false; ease(steerRef.current); }}
      className="group/name inline-flex shrink-0 items-center gap-8 px-4 py-4"
    >
      <span
        style={bn ? { fontFamily: "'Noto Sans Bengali', sans-serif" } : undefined}
        className={`text-xl sm:text-2xl font-semibold leading-none transition-colors duration-300 group-hover/name:text-white ${index % 2
          ? 'text-[#D9B36C]'
          : 'text-[#FAF8F3]'}`}
      >
        {bn ? district.nameBn : district.name}
      </span>
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-flag transition-transform duration-500 group-hover/name:scale-150" />
    </button>
  ));

  return (
    <section
      ref={bandRef}
      aria-label={t('All 64 districts', '৬৪টি জেলা')}
      onPointerMove={steer}
      onPointerLeave={() => { steerRef.current = 1; if (!pausedRef.current) ease(1); }}
      className="relative overflow-hidden border-t border-gold/25 bg-ink"
    >
      <div ref={trackRef} className="flex w-max">
        <div className="flex">{names}</div>
        <div className="flex" aria-hidden="true" inert>{names}</div>
      </div>
    </section>
  );
}
