import { useEffect, type RefObject } from 'react';

// Elements that rise into view as the visitor scrolls. Grid children are staggered.
const TARGETS = 'blockquote, .grid > *, [data-reveal-on]';

/**
 * Adds a scroll-triggered reveal to content inside `rootRef` without touching markup:
 * state lives in a `data-reveal` attribute that React never manages, so re-renders are safe.
 * New content (filters, search results) is picked up as it appears.
 */
export default function useReveal(rootRef: RefObject<HTMLElement | null>, resetKey: unknown) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.dataset.reveal = 'shown';
          observer.unobserve(element);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const prepare = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(TARGETS).forEach((element) => {
        // 'pending' elements are observed again: an effect re-run must not strand them hidden.
        if (element.dataset.reveal === 'shown' || element.closest('[data-hero]')) return;
        const siblings = element.parentElement?.classList.contains('grid') ? Array.from(element.parentElement.children) : [];
        const index = Math.max(0, siblings.indexOf(element));
        element.style.setProperty('--reveal-delay', `${Math.min(index, 8) * 80}ms`);
        element.dataset.reveal = 'pending';
        observer.observe(element);
      });
    };

    prepare(root);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) prepare(node.parentElement ?? node);
        });
      }
    });
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [rootRef, resetKey]);
}
