import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Page } from '../App';
import { num, useLang } from '../i18n';

gsap.registerPlugin(ScrollTrigger);

interface Moment {
  day: string;
  month: string;
  monthBn: string;
  title: string;
  titleBn: string;
  text: string;
  textBn: string;
  /**
   * Stories that tell what the narrator lived through on this very day, checked by reading each story
   * that mentions the date (a passing mention, such as "after 25 March…", does not count).
   */
  stories?: string[];
  /** For a period rather than a day: phrases searched as exact phrases, any one may match. */
  words?: string[];
}

const MOMENTS: Moment[] = [
  {
    day: '7', month: 'March', monthBn: 'মার্চ', title: 'The 7th March speech', titleBn: 'ঐতিহাসিক ভাষণ',
    text: 'At the Racecourse ground, Bangabandhu Sheikh Mujibur Rahman tells the nation: “The struggle this time is the struggle for our freedom.”',
    textBn: 'রেসকোর্স ময়দানে বঙ্গবন্ধু শেখ মুজিবুর রহমান বলেন: “এবারের সংগ্রাম আমাদের মুক্তির সংগ্রাম, এবারের সংগ্রাম স্বাধীনতার সংগ্রাম।”',
    stories: ['LWM-OH-CUMILLA-৭৩০৯', 'LWM-OH-RAJBARI-২৫৮৬', 'LWM-OH-NILPHAMARI-৪৩৮৯', 'LWM-OH-PANCHAGARH-১৫৬৪৩', 'LWM-OH-JOYPURHAT-৭৭৪৮'],
  },
  {
    day: '25', month: 'March', monthBn: 'মার্চ', title: 'Operation Searchlight', titleBn: 'অপারেশন সার্চলাইট',
    text: 'In the night, the Pakistani army begins its massacre of unarmed people in Dhaka.',
    textBn: 'কালরাতে পাকিস্তানি সেনাবাহিনী ঢাকায় নিরস্ত্র মানুষের ওপর গণহত্যা শুরু করে।',
    stories: ['LWM-OH-BAGERHAT-১০৮৭৩', 'LWM-OH-CUMILLA-৭৪৩০', 'LWM-OH-CUMILLA-৭৩০৯', 'LWM-OH-CUMILLA-৭২৫৩', 'LWM-OH-NOAKHALI-৫৮৪৪', 'LWM-OH-BRAHMANBARIA-১২৯৮২', 'LWM-OH-BRAHMANBARIA-১৩৩২৬', 'LWM-OH-FARIDPUR-৫৩৬১', 'LWM-OH-FARIDPUR-৫৪২৩', 'LWM-OH-FARIDPUR-৫০৭৯', 'LWM-OH-FARIDPUR-৫০৮৮', 'LWM-OH-MYMENSINGH-১০৫১১', 'LWM-OH-NAOGAON-১৬১০২', 'LWM-OH-RAJSHAHI-১৪৭৭১', 'LWM-OH-SYLHET-১৮৭৬৬', 'LWM-OH-SUNAMGANJ-৭১০৪'],
  },
  {
    day: '26', month: 'March', monthBn: 'মার্চ', title: 'Independence declared', titleBn: 'স্বাধীনতার ঘোষণা',
    text: 'The independence of Bangladesh is declared, and armed resistance begins across the country.',
    textBn: 'বাংলাদেশের স্বাধীনতা ঘোষিত হয়; সারা দেশে শুরু হয় সশস্ত্র প্রতিরোধ।',
    stories: ['LWM-OH-SATKHIRA-২৩০৫৫', 'LWM-OH-SATKHIRA-২১৬৩৯', 'LWM-OH-CUMILLA-৭৪৪১', 'LWM-OH-CUMILLA-৭২৭৪', 'LWM-OH-CUMILLA-৭২৮৪', 'LWM-OH-NOAKHALI-৫৮৪৪', 'LWM-OH-BRAHMANBARIA-১২৯৮৯', 'LWM-OH-KURIGRAM-৯৮৭', 'LWM-OH-NILPHAMARI-৪৪৩৪', 'LWM-OH-PANCHAGARH-১৫৮৬৩', 'LWM-OH-PANCHAGARH-১৫৯১৪', 'LWM-OH-RAJSHAHI-১৩৮৯৪', 'LWM-OH-RAJSHAHI-১৩৯৯৭', 'LWM-OH-RAJSHAHI-১৫৯৬৩', 'LWM-OH-SYLHET-১৮৭৬৬'],
  },
  {
    day: '17', month: 'April', monthBn: 'এপ্রিল', title: 'The Mujibnagar government', titleBn: 'মুজিবনগর সরকার',
    text: 'The first government of Bangladesh takes its oath at Baidyanathtala in Meherpur.',
    textBn: 'মেহেরপুরের বৈদ্যনাথতলায় বাংলাদেশের প্রথম সরকার শপথ নেয়।',
    stories: ['LWM-OH-FARIDPUR-৫৩৪৮', 'LWM-OH-MYMENSINGH-১০০৪২'],
  },
  {
    day: '11', month: 'sectors', monthBn: 'সেক্টর', title: 'Nine months of war', titleBn: 'নয় মাসের যুদ্ধ',
    text: 'The country is divided into eleven sectors and the Mukti Bahini fights on. About ten million people flee to India as refugees.',
    textBn: 'সারা দেশ এগারোটি সেক্টরে ভাগ করে মুক্তিবাহিনী যুদ্ধ চালায়। প্রায় এক কোটি মানুষ শরণার্থী হয়ে ভারতে আশ্রয় নেয়।',
    words: ['সেক্টর', 'শরণার্থী'],
  },
  {
    day: '14', month: 'December', monthBn: 'ডিসেম্বর', title: 'The intellectuals are killed', titleBn: 'বুদ্ধিজীবী হত্যা',
    text: 'On the eve of defeat, the Pakistani army and its collaborators murder teachers, doctors, journalists and writers.',
    textBn: 'পরাজয়ের আগমুহূর্তে পাকিস্তানি বাহিনী ও তাদের দোসররা দেশের শিক্ষক, চিকিৎসক, সাংবাদিক ও লেখকদের হত্যা করে।',
    stories: ['LWM-OH-RAJBARI-২৫০৪', 'LWM-OH-JAMALPUR-২৪৫', 'LWM-OH-JOYPURHAT-৭৮২১', 'LWM-OH-NAOGAON-১৬০৯৪', 'LWM-OH-SUNAMGANJ-৬৯৭৩'],
  },
  {
    day: '16', month: 'December', monthBn: 'ডিসেম্বর', title: 'Victory', titleBn: 'বিজয়',
    text: 'The Pakistani army surrenders at the Racecourse ground. Independent Bangladesh is born.',
    textBn: 'রেসকোর্স ময়দানে পাকিস্তানি বাহিনী আত্মসমর্পণ করে। জন্ম নেয় স্বাধীন বাংলাদেশ।',
    stories: ['LWM-OH-BAGERHAT-১০৭৪৭', 'LWM-OH-CUMILLA-৭৪৪৩', 'LWM-OH-BRAHMANBARIA-১২৯৮৯', 'LWM-OH-FARIDPUR-৫৩৪৮', 'LWM-OH-JAMALPUR-২৪৫', 'LWM-OH-JAMALPUR-১৮২৪', 'LWM-OH-JAMALPUR-২৫৯', 'LWM-OH-MYMENSINGH-১০১১৪', 'LWM-OH-KURIGRAM-৯০৫', 'LWM-OH-KURIGRAM-৫৪৫২', 'LWM-OH-KURIGRAM-৭৬২৮', 'LWM-OH-NILPHAMARI-৪৪৩৩', 'LWM-OH-NILPHAMARI-৪৪৩৪', 'LWM-OH-PANCHAGARH-১৫৯১৪', 'LWM-OH-RAJSHAHI-১৪৭৭১', 'LWM-OH-SYLHET-১৮৩৪৬', 'LWM-OH-SUNAMGANJ-৬৯৭৩', 'LWM-OH-SUNAMGANJ-৭০২৮'],
  },
];

/**
 * 1971 from March to December. On wide screens the section pins and the dates slide past as the
 * page scrolls, with a red line filling behind them; on phones it is a row you swipe.
 * Each date links to the stories that mention it.
 */
export default function Timeline1971({ navigate }: { navigate: (page: Page, opts?: Record<string, unknown>) => void }) {
  const { t, lang } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);


  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      // Slide until the last date sits fully on screen, its right edge at 85% of the width.
      const distance = () => {
        const last = track.lastElementChild as HTMLElement | null;
        return last ? Math.max(0, last.offsetLeft + last.offsetWidth - window.innerWidth * 0.85) : 0;
      };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance() + window.innerHeight * 0.4}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
      });
      tl.to(track, { x: () => -distance(), ease: 'none', duration: 1 }, 0)
        .fromTo(fillRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0);
      // Each date's dot turns red once the line reaches it.
      track.querySelectorAll<HTMLElement>('[data-dot]').forEach((dot, index, all) => {
        tl.to(dot, { backgroundColor: '#D11F35', borderColor: '#D11F35', scale: 1.35, duration: 0.02 }, index / Math.max(1, all.length - 1) * 0.98);
      });
      // Each date rises into place as it slides in from the right.
      track.querySelectorAll<HTMLElement>('[data-moment]').forEach((moment) => {
        gsap.fromTo(moment, { y: 70, opacity: 0 }, {
          y: 0, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: moment, containerAnimation: tl, start: 'left 105%', end: 'left 72%', scrub: true },
        });
      });
    });
    return () => mm.revert();
  }, [lang]);

  return (
    <section ref={sectionRef} aria-labelledby="timeline-heading" className="relative overflow-hidden bg-forest-deep text-white">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none opacity-70"><div className="film-grain" /></div>
      <div className="relative flex min-h-[100dvh] flex-col justify-center py-20 lg:py-0">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <p className="mb-4 flex items-center gap-3 text-sm font-semibold text-white/70">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-flag" />
            {t('March to December', 'মার্চ থেকে ডিসেম্বর')}
          </p>
          <h2 id="timeline-heading" className="font-display text-5xl sm:text-7xl font-bold leading-none">
            {t('Nine months of 1971', 'একাত্তরের নয় মাস')}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">
            {t('The days the narrators remember. Open a date to read the stories that mention it.', 'বর্ণনাকারীদের স্মৃতিতে যে দিনগুলো রয়ে গেছে। কোনো তারিখ খুলে সেই দিনের কথা বলা গল্পগুলো পড়ুন।')}
          </p>
        </div>

        <div className="relative mt-14">
          {/* The line the dates hang from */}
          <span aria-hidden="true" className="absolute left-0 right-0 top-[7px] h-px bg-white/15" />
          <span ref={fillRef} aria-hidden="true" className="absolute left-0 right-0 top-[6px] h-[3px] origin-left scale-x-0 bg-flag max-lg:hidden" />

          <ol
            ref={trackRef}
            className="relative flex gap-6 overflow-x-auto px-4 pb-4 [scrollbar-width:none] snap-x snap-mandatory sm:px-8 lg:overflow-visible lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-[30vw] [&::-webkit-scrollbar]:hidden"
          >
            {MOMENTS.map((m, index) => {
              const last = index === MOMENTS.length - 1;
              return (
                <li key={m.titleBn} className="w-[78vw] max-w-[340px] shrink-0 snap-start sm:w-[340px]">
                  <span data-dot aria-hidden="true" className={`block h-[15px] w-[15px] rounded-full border-2 ${last ? 'border-flag bg-flag' : 'border-white/50 bg-forest-deep'} max-lg:border-flag max-lg:bg-flag`} />
                  <div data-moment className={`mt-6 border-l pl-5 ${last ? 'border-flag' : 'border-white/15'}`}>
                    <p className="flex items-baseline gap-3 leading-none">
                      <span className={`font-display text-6xl font-bold tabular-nums text-white`}>{num(m.day, lang)}</span>
                      <span className="text-lg font-semibold text-gold-bright">{t(m.month, m.monthBn)}</span>
                    </p>
                    <h3 className="mt-5 text-2xl font-bold">{t(m.title, m.titleBn)}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-white/65">{t(m.text, m.textBn)}</p>
                    {(m.stories?.length || m.words) && (
                      <button
                        type="button"
                        onClick={() => navigate('search', m.stories
                          ? { query: '', storyIds: m.stories, listTitle: `${m.day} ${m.month} 1971`, listTitleBn: `${num(m.day, 'bn')} ${m.monthBn} ১৯৭১` }
                          : { query: m.words!.map((w) => `"${w}"`).join(', ') })}
                        className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-flag decoration-2 underline-offset-[6px] transition-colors hover:text-gold-bright"
                      >
                        {m.stories
                          ? t(`${m.stories.length} ${m.stories.length === 1 ? 'story' : 'stories'} from this day`, `সেদিনের ${num(m.stories.length, 'bn')}টি গল্প`)
                          : t('Read the stories', 'এ নিয়ে গল্প পড়ুন')}
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
