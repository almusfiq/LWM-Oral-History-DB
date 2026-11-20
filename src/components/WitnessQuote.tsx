import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Page } from '../App';
import { stories } from '../data/stories';
import { useLang } from '../i18n';

gsap.registerPlugin(ScrollTrigger);

// One witness, in their own words: a freedom fighter's 16 December, taken verbatim from the story.
const STORY_ID = 'LWM-OH-KURIGRAM-৭৬২৮';
const FROM = 'সেদিন ছিল ১৬ ডিসেম্বর';
const TO = 'স্বাধীন বাংলাদেশ।';

/**
 * A single passage from the archive, read out word by word as the page scrolls: each word lights from
 * faint to ink in turn, and the date lights in flag red. Words are split at spaces only, never inside a
 * word, so Bangla conjuncts stay whole.
 */
export default function WitnessQuote({ navigate }: { navigate: (page: Page, opts?: Record<string, unknown>) => void }) {
  const { t } = useLang();
  const textRef = useRef<HTMLParagraphElement>(null);
  const story = stories.find((item) => item.id === STORY_ID);
  const start = story ? story.content.indexOf(FROM) : -1;
  const end = start >= 0 ? story!.content.indexOf(TO, start) : -1;
  const passage = end >= 0 ? story!.content.slice(start, end + TO.length) : '';

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(text.querySelectorAll('[data-word]'), { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: text, start: 'top 85%', end: 'bottom 68%', scrub: 0.5 },
      });
    });
    return () => mm.revert();
  }, [passage]);

  if (!story || !passage) return null;
  const date = new Set(['১৬', 'ডিসেম্বর।']);

  return (
    <section aria-labelledby="witness-heading" className="relative overflow-hidden bg-surface px-4 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[13rem_1fr] lg:gap-16">
        <div className="lg:pt-3">
          <p id="witness-heading" className="flex items-center gap-2.5 text-sm font-semibold text-flag">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-flag" />
            {t('A witness remembers', 'সাক্ষীর কণ্ঠে')}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            {t('A freedom fighter on the day of victory, in his own words.', 'বিজয়ের দিনটি, এক মুক্তিযোদ্ধার নিজের ভাষায়।')}
          </p>
        </div>

        <figure className="border-l-[3px] border-flag pl-6 sm:pl-10">
          <blockquote>
            <p ref={textRef} lang="bn" className="text-[clamp(1.6rem,3.6vw,2.75rem)] font-semibold leading-[1.55] text-ink text-pretty">
              {passage.split(' ').map((word, index) => (
                <span key={index} data-word className={date.has(word) ? 'text-flag' : undefined}>{word}{' '}</span>
              ))}
            </p>
          </blockquote>
          <figcaption className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="text-lg font-semibold text-ink">{story.respondent}</span>
            <span className="text-ink-muted">{story.district} · {t('Archive no.', 'সংরক্ষণ নং')} {story.archiveNumber}</span>
            <button
              type="button"
              onClick={() => navigate('story', { storyId: story.id })}
              className="group inline-flex items-center gap-2 font-semibold text-forest underline decoration-forest/30 decoration-2 underline-offset-[6px] transition-colors hover:decoration-forest"
            >
              {t('Read the full story', 'পুরো গল্পটি পড়ুন')}
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
