import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll and pointer motion for everything inside `rootRef`, driven by data attributes:
 *   headings (h1/h2)   rise out of a mask as they enter the screen
 *   [data-hero]        photo drifts slower than the page; [data-hero-content] lifts and fades
 *   [data-scrub-text]  text fills from muted to ink, line by line, when it comes into view
 *   [data-clip]        opens upward from a closed aperture (its photos already slow-zoom)
 *   [data-stamp]       is pressed onto the page like a rubber stamp when it comes into view
 *   [data-flag-sun]    grows from a small dot to the flag's full sun as its section scrolls in
 *   [data-tilt]        tilts in 3D toward the pointer
 *   [data-magnetic]    leans toward the pointer
 * Text is never split into pieces: React owns it, and splitting Bangla by letter breaks conjuncts.
 * Motion uses the `translate`/`rotate` properties or GSAP transforms on elements whose CSS
 * animations do not use them, so the two never fight.
 */
export default function useMotion(rootRef: RefObject<HTMLElement | null>, resetKey: unknown) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      root.querySelectorAll<HTMLElement>('h1, h2').forEach((heading) => {
        if (heading.closest('[data-hero], [data-no-motion]')) return;
        gsap.fromTo(heading,
          { clipPath: 'inset(0 0 100% 0)', y: 28 },
          { clipPath: 'inset(0 0 -25% 0)', y: 0, duration: 1.1, ease: 'expo.out', clearProps: 'clipPath,transform',
            scrollTrigger: { trigger: heading, start: 'top bottom', once: true } });
      });

      root.querySelectorAll<HTMLElement>('[data-hero]').forEach((hero) => {
        const photo = hero.querySelector<HTMLElement>('img');
        const content = hero.querySelector<HTMLElement>('[data-hero-content]');
        ScrollTrigger.create({
          trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
          onUpdate: ({ progress }) => {
            // `translate` is separate from the Ken Burns `transform`, so both run together.
            if (photo) photo.style.translate = `0 ${progress * 22}%`;
            if (content) { content.style.translate = `0 ${progress * -90}px`; content.style.opacity = String(1 - progress * 1.3); }
          },
        });
      });

      root.querySelectorAll<HTMLElement>('[data-scrub-text]').forEach((text) => {
        // Plays once on entry rather than following the scroll: near the page end there may not be
        // enough scroll left to finish, which left the text half faded.
        gsap.fromTo(text, { '--fill': '0%' }, {
          '--fill': '100%', duration: 2.2, ease: 'power1.inOut',
          scrollTrigger: { trigger: text, start: 'top 88%', once: true },
        });
      });

      root.querySelectorAll<HTMLElement>('[data-clip]').forEach((frame) => {
        gsap.fromTo(frame, { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)' },
          { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath',
            scrollTrigger: { trigger: frame, start: 'top 92%', once: true } });
      });

      root.querySelectorAll<HTMLElement>('[data-stamp]').forEach((stamp) => {
        gsap.fromTo(stamp, { scale: 2.4, rotation: -14, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.45, ease: 'power4.in', delay: 0.35, clearProps: 'transform',
            scrollTrigger: { trigger: stamp, start: 'top 85%', once: true } });
      });

      root.querySelectorAll<HTMLElement>('[data-flag]').forEach((section) => {
        const sun = section.querySelector<HTMLElement>('[data-flag-sun]');
        if (!sun) return;
        gsap.fromTo(sun, { scale: 0.08 }, { scale: 1, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'center center', scrub: 0.6 } });
      });

      // Pointer effects only where there is a real pointer (not touch screens).
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const cleanups: Array<() => void> = [];
      const onPointer = (element: HTMLElement, move: (x: number, y: number) => void, leave: () => void) => {
        const handleMove = (event: PointerEvent) => {
          const box = element.getBoundingClientRect();
          move((event.clientX - box.left) / box.width - 0.5, (event.clientY - box.top) / box.height - 0.5);
        };
        element.addEventListener('pointermove', handleMove);
        element.addEventListener('pointerleave', leave);
        cleanups.push(() => { element.removeEventListener('pointermove', handleMove); element.removeEventListener('pointerleave', leave); });
      };

      root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
        gsap.set(card, { transformPerspective: 900 });
        const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
        const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        const strength = Number(card.dataset.tilt) || 6;
        onPointer(card, (x, y) => { rotY(x * strength); rotX(-y * strength); }, () => { rotX(0); rotY(0); });
      });

      root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((button) => {
        const toX = gsap.quickTo(button, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        const toY = gsap.quickTo(button, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        onPointer(button, (x, y) => { toX(x * 14); toY(y * 12); }, () => { toX(0); toY(0); });
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    });

    // Late-loading images and the map change page height; re-measure once things settle.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => { window.clearTimeout(refresh); mm.revert(); };
  }, [rootRef, resetKey]);
}
