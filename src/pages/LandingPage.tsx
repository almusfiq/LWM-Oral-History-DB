import { useEffect, useRef, useState } from 'react';
import type { Page } from '../App';
import { stories } from '../data/stories';
import { divisions } from '../data/bangladeshLocations';
import CountUp from '../components/CountUp';
import DistrictMarquee from '../components/DistrictMarquee';
import Timeline1971 from '../components/Timeline1971';
import WitnessQuote from '../components/WitnessQuote';
import Sparks from '../components/Sparks';
import DivisionMap from '../components/DivisionMap';
import { num, useLang } from '../i18n';

interface LandingPageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
  onSearchOpen: () => void;
}

const archiveImages = [
  { src: '/rifles-recruits-camp.png', alt: 'A group of Bangladeshi freedom fighters gathered at a training camp', altBn: 'প্রশিক্ষণ শিবিরে সমবেত একদল মুক্তিযোদ্ধা' },
  { src: '/liberation-crowd.png', alt: 'A community celebrating Bangladesh’s Liberation War', altBn: 'মুক্তিযুদ্ধের বিজয় উদযাপনরত মানুষ' },
  { src: '/oral-history-interview.png', alt: 'Students listening as an elder shares a memory in a rural home', altBn: 'গ্রামের বাড়িতে এক প্রবীণের স্মৃতিকথা শুনছে শিক্ষার্থীরা' },
  { src: '/oral-history-community.png', alt: 'A village community gathered to hear an elder’s memories', altBn: 'এক প্রবীণের স্মৃতি শুনতে সমবেত গ্রামবাসী' },
  { src: '/oral-history-archive.png', alt: 'A student researcher reviewing photographs and historical records', altBn: 'ছবি ও ঐতিহাসিক নথি দেখছেন এক শিক্ষার্থী গবেষক' },
];

function ArchiveImageCarousel() {
  const [activeImage, setActiveImage] = useState(0);
  const { t, lang } = useLang();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % archiveImages.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line">
      {archiveImages.map((image, index) => (
        <img
          key={image.src}
          src={image.src}
          alt={t(image.alt, image.altBn)}
          aria-hidden={activeImage !== index}
          className={`absolute inset-0 h-full w-full object-cover motion-reduce:transition-none transition-opacity duration-1000 ${activeImage === index ? 'opacity-100 slow-zoom' : 'opacity-0'}`}
          style={{ objectPosition: index === 0 ? 'center 45%' : 'center' }}
          loading={index === 0 ? 'eager' : 'lazy'}
        />
      ))}
      <div className="relative h-[400px]" aria-hidden="true" />
      <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/65 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white backdrop-blur-sm">
        {t('Illustrative scenes', 'প্রতীকী দৃশ্য')}
      </span>
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5" aria-label={t('Choose an archive image', 'একটি ছবি বেছে নিন')}>
        {archiveImages.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveImage(index)}
            aria-label={t(`Show image ${index + 1}: ${image.alt}`, `ছবি ${num(index + 1, lang)}: ${image.altBn}`)}
            aria-pressed={activeImage === index}
            className={`h-2 rounded-full bg-white transition-all ${activeImage === index ? 'w-6 opacity-100' : 'w-2 opacity-65 hover:opacity-100'}`}
          />
        ))}
      </div>
    </div>
  );
}

function getStoryExcerpt(content: string, limit = 190) {
  const opening = content.replace(/\s+/g, ' ').trim();
  const characters = Array.from(opening);
  if (characters.length <= limit) return opening;

  const excerpt = characters.slice(0, limit).join('');
  const lastSpace = excerpt.lastIndexOf(' ');
  return `${excerpt.slice(0, lastSpace > 120 ? lastSpace : excerpt.length).trimEnd()}…`;
}

const PIN_PATH = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

export default function LandingPage({ navigate }: LandingPageProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeDivisionId, setActiveDivisionId] = useState<string | null>(null);
  const { t, lang } = useLang();
  const bn = lang === 'bn';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('search', { query: query.trim() });
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section data-hero className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-ink">
        {/* Background image */}
        <img
          src="/liberation-crowd-victory.png"
          alt={t("Crowd celebrating Bangladesh's liberation", 'স্বাধীনতা উদযাপনরত জনতা')}
          className="hero-kenburns absolute inset-0 w-full h-full object-cover opacity-75"
          style={{ filter: 'saturate(80%) sepia(28%) contrast(105%)', objectPosition: 'center top' }}
        />
        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/40 via-night/35 to-night/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/15 via-transparent to-ink/15" />
        {/* Feathered warm shade behind the text block only, so the words read over the busy photo */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_90%_85%_at_50%_45%,rgba(11,15,13,0.58)_0%,rgba(11,15,13,0.46)_30%,rgba(11,15,13,0.3)_60%,rgba(11,15,13,0.14)_85%,rgba(11,15,13,0.06)_100%)]" />

        {/* Atmosphere: red sparks rising from a low glow, and film grain */}
        <Sparks />
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none"><div className="film-grain" /></div>

        {/* Decorative lines */}
        <div className="hero-line absolute top-0 left-0 right-0 h-px bg-white/10" />

        <div data-hero-content className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 text-center">

          {/* Heading */}
          <h1 className="relative flex flex-wrap justify-center gap-x-[0.25em] font-display leading-[1.05] mb-2" style={{ ...(bn ? { fontFamily: "'Noto Sans Bengali', sans-serif" } : {}), fontSize: bn ? 'clamp(3.5rem, 10vw, 6.5rem)' : 'clamp(3rem, 9vw, 6rem)', fontWeight: 700 }}>
            {/* Each word rises from behind a mask in flag red, then white sweeps through it like ink.
                Words are never split into letters, which would break Bangla conjuncts. */}
            {t('Stories of 1971', '১৯৭১ এর গল্পকথা').split(' ').map((word, index) => (
              <span key={word} className="block overflow-hidden px-[0.08em] pt-[0.45em] pb-[0.2em] -mt-[0.3em] -mb-[0.1em]">
                <span className="title-ink" style={{ ['--d' as string]: `${0.2 + index * 0.22}s` }}>{word}</span>
              </span>
            ))}
          </h1>
          <p className="hero-rise flex items-center justify-center gap-4 text-gold-bright text-xl [text-shadow:0_2px_14px_rgba(11,15,13,0.85)] font-normal mb-6 tracking-wider" style={{ ['--d' as string]: '0.55s' }}>
            <span aria-hidden="true" className="hero-line h-px w-10 sm:w-16 bg-white/50" style={{ ['--origin' as string]: 'right' }} />
            {t('Liberation War Museum', 'মুক্তিযুদ্ধ জাদুঘর')}
            <span aria-hidden="true" className="hero-line h-px w-10 sm:w-16 bg-white/50" style={{ ['--origin' as string]: 'left' }} />
          </p>
          <p className="hero-rise text-[#FAF8F3] text-lg [text-shadow:0_2px_14px_rgba(11,15,13,0.9)] sm:text-xl leading-relaxed max-w-2xl mx-auto mb-14 font-light" style={{ ...(bn ? { fontFamily: "'Noto Sans Bengali', sans-serif" } : {}), ['--d' as string]: '0.75s' }}>
            {bn ? (
              <>১৯৭১ সালের বাংলাদেশ স্বাধীনতা যুদ্ধের প্রত্যক্ষদর্শী ও বেঁচে যাওয়া মানুষদের স্মৃতির এক জীবন্ত সংগ্রহশালা—যা আগামী প্রজন্মের জন্য সংরক্ষিত।</>
            ) : (
              <>A living archive of memories from witnesses and survivors of the 1971 Liberation War of Bangladesh, preserved for generations to come.</>
            )}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full mb-6">
            <div className="hero-glass relative flex items-center bg-surface-raised/10 backdrop-blur-xl border border-white/45 rounded-2xl shadow-[0_0_14px_rgba(255,255,255,0.18),0_25px_50px_-12px_rgba(0,0,0,0.6)] hover:border-white/70 hover:shadow-[0_0_18px_rgba(255,255,255,0.25),0_25px_50px_-12px_rgba(0,0,0,0.6)] focus-within:border-white focus-within:bg-surface-raised/15 focus-within:shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_0_22px_rgba(255,255,255,0.35),0_25px_50px_-12px_rgba(0,0,0,0.6)] transition-all duration-500" style={{ ['--d' as string]: '0.95s' }}>
              <svg className="absolute left-4 sm:left-5 w-5 h-5 text-white/40 pointer-events-none flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Search stories, people, schools, places...', 'গল্প, ব্যক্তি, বিদ্যালয়, স্থান খুঁজুন...')} className="min-w-0 flex-1 bg-transparent text-white placeholder-white/55 pl-12 sm:pl-14 pr-2 sm:pr-4 py-4 text-base outline-none" data-focus-ring="parent" />
              <button type="submit" data-magnetic className="m-1.5 bg-forest hover:bg-forest-dark text-white font-semibold px-4 sm:px-6 py-2.5 rounded-xl text-sm flex-shrink-0 transition-colors">{t('Search', 'খুঁজুন')}</button>
            </div>
          </form>

          {/* Stat */}
          <div className="hero-glass inline-flex items-center gap-4 border border-white/10 rounded-2xl px-6 py-3.5 bg-surface-raised/5 backdrop-blur-sm hover:border-forest/30 transition-colors duration-500" style={{ ['--d' as string]: '1.15s', ['--glass-blur' as string]: '8px' }}>
            <div className="text-left">
              <p className="font-display text-4xl font-bold leading-none text-white"><CountUp value="65,000+" duration={2400} className="" /></p>
              <p className="text-white/80 text-xs mt-1">{t('Stories Preserved', 'গল্প সংরক্ষিত')}</p>
            </div>
            <div className="w-px h-10 bg-surface-raised/10" />
            <div className="text-left">
              <p className="text-white/90 text-sm">{t('Collected from communities', 'বিভিন্ন জনপদ থেকে সংগৃহীত')}</p>
              <p className="text-white/70 text-xs mt-0.5">{t('across Bangladesh', 'সারা বাংলাদেশে')}</p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-rise absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50" style={{ ['--d' as string]: '1.6s' }}>
          <span aria-hidden="true" className="block h-10 w-px overflow-hidden bg-white/10">
            <span className="scroll-cue block h-full w-full bg-flag" />
          </span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── Browse by Location ────────────────────────────── */}
      <section className="bg-surface py-20 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Heading with the archive's reach as a quiet legend */}
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div>
              <p className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-flag"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-flag" />{t('64 districts, 8 divisions', '৬৪ জেলা, ৮ বিভাগ')}</p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-forest-deep leading-[1.08]">{t('Find memories by place', 'স্থান ধরে স্মৃতি খুঁজুন')}</h2>
              <p className="mt-3 text-lg text-ink-muted" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                {t('Search from the place where it happened', 'যেখানে ঘটেছিল, সেখান থেকেই খুঁজুন')}
              </p>
            </div>
            <dl className="flex divide-x divide-line">
              {[
                { value: '8', label: 'Divisions', labelBn: 'বিভাগ' },
                { value: '64', label: 'Districts', labelBn: 'জেলা' },
                { value: '495', label: 'Upazilas', labelBn: 'উপজেলা' },
              ].map(({ value, label, labelBn }) => (
                <div key={label} className="px-5 first:pl-0 sm:px-8 last:pr-0">
                  <dt className="sr-only">{t(label, labelBn)}</dt>
                  <dd className="font-display text-4xl sm:text-5xl font-semibold text-forest leading-none"><CountUp value={value} duration={1400} /></dd>
                  <dd className="mt-2 text-xs text-ink-faint">
                    {t(label, labelBn)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* Main feature card */}
            <div
              onClick={() => navigate('location-browse')}
              className="lg:col-span-7 group relative overflow-hidden rounded-3xl bg-forest-deep text-left flex flex-col justify-between min-h-[420px] border border-gold/20 hover:border-forest/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_-10px_rgba(11,15,13,0.55)]"
            >
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none opacity-70"><div className="film-grain" /></div>
              <DivisionMap
                onSelect={(id) => navigate('location-detail', { locationDivisionId: id, locationDistrictId: undefined })}
                className="absolute right-[-1%] top-1/2 z-[1] h-[96%] w-[52%] -translate-y-1/2 overflow-visible max-sm:right-[-12%] max-sm:w-[72%] max-sm:opacity-30"
              />
              <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

              <div className="relative z-10 w-full sm:w-[58%] p-6 sm:p-10">
                {/* Compass rose medallion */}
                <div aria-hidden="true" className="mb-7 h-16 w-16 rounded-full border border-gold-bright/30">
                  <svg viewBox="0 0 64 64" className="h-full w-full transition-transform duration-1000 ease-[cubic-bezier(0.3,1.4,0.5,1)] group-hover:rotate-[135deg]">
                    <circle cx={32} cy={32} r={27} fill="none" stroke="#94733F" strokeOpacity={0.45} strokeWidth={1} strokeDasharray="1 4.65" />
                    <g fill="#94733F" fillOpacity={0.55}>
                      <polygon points="42.6,21.4 34,34 30,30" />
                      <polygon points="21.4,21.4 30,34 34,30" />
                      <polygon points="42.6,42.6 30,34 34,30" />
                      <polygon points="21.4,42.6 34,34 30,30" />
                    </g>
                    <polygon points="32,7 28,32 32,32" fill="#D9B36C" />
                    <polygon points="32,7 36,32 32,32" fill="#94733F" />
                    <polygon points="32,57 36,32 32,32" fill="#D9B36C" />
                    <polygon points="32,57 28,32 32,32" fill="#7A5E33" />
                    <polygon points="57,32 32,28 32,32" fill="#D9B36C" />
                    <polygon points="57,32 32,36 32,32" fill="#7A5E33" />
                    <polygon points="7,32 32,36 32,32" fill="#D9B36C" />
                    <polygon points="7,32 32,28 32,32" fill="#94733F" />
                    <circle cx={32} cy={32} r={3} fill="#121514" stroke="#D9B36C" strokeWidth={1.5} />
                  </svg>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                  {t('Browse by Location', 'অবস্থান অনুযায়ী দেখুন')}
                </h2>
                <p className="mt-5 text-white/75 text-[15px] leading-relaxed max-w-sm">
                  {t('Zoom from a division down to the village where a memory was recorded.', 'বিভাগ থেকে শুরু করে সেই গ্রাম পর্যন্ত যান, যেখানে স্মৃতিটি রেকর্ড করা হয়েছিল।')}
                </p>
              </div>

              <div className="relative z-10 w-full sm:w-[58%] px-6 sm:px-10 pb-8 sm:pb-10">
                <button type="button" onClick={(event) => { event.stopPropagation(); navigate('location-browse'); }} className="inline-flex items-center gap-2.5 bg-flag text-white font-semibold text-sm px-5 py-2.5 rounded-xl group-hover:bg-flag-dark transition-colors">
                  {t('Open Map', 'মানচিত্র খুলুন')}
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Division index: jump straight into a division */}
            <nav
              aria-label={t('Browse by division', 'বিভাগ অনুযায়ী দেখুন')}
              onMouseLeave={() => setActiveDivisionId(null)}
              className="lg:col-span-5 relative overflow-hidden rounded-3xl border border-line bg-surface-sunken p-4 sm:p-5 shadow-[0_24px_60px_-28px_rgba(11,15,13,0.45)]"
            >
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-multiply"><div className="film-grain" style={{ mixBlendMode: 'multiply', opacity: 0.25 }} /></div>
              <span aria-hidden="true" className="pointer-events-none absolute inset-2.5 rounded-[18px] border border-gold/30" />

              <div className="relative px-3 pt-3 pb-4">
                <p className="text-2xl font-semibold text-ink">{t('Choose a division', 'বিভাগ বেছে নিন')}</p>
              </div>
              <ul className="relative">
                {divisions.map((division) => {
                  const active = division.id === activeDivisionId;
                  return (
                    <li key={division.id}>
                      <button
                        onClick={() => navigate('location-detail', { locationDivisionId: division.id, locationDistrictId: undefined })}
                        onMouseEnter={() => setActiveDivisionId(division.id)}
                        onFocus={() => setActiveDivisionId(division.id)}
                        onBlur={() => setActiveDivisionId(null)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${active ? 'bg-white/70 shadow-[0_6px_18px_-10px_rgba(11,15,13,0.18)]' : ''}`}
                      >
                        <svg aria-hidden="true" className={`h-5 w-5 shrink-0 transition-all duration-300 ${active ? 'pin-bounce text-flag' : 'text-flag/45'}`} fill="currentColor" viewBox="0 0 24 24"><path d={PIN_PATH} /></svg>
                        <span className={`text-[17px] font-semibold transition-colors ${active ? 'text-gold-dark' : 'text-ink'}`} style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>{bn ? division.nameBn : division.name}</span>
                        {/* Dotted leader, like an atlas index */}
                        <span aria-hidden="true" className={`mx-1 mb-1 h-px flex-1 self-end border-b border-dotted transition-colors ${active ? 'border-gold' : 'border-gold/35'}`} />
                        <span className={`shrink-0 text-xs tabular-nums transition-colors ${active ? 'text-gold-dark' : 'text-ink-faint'}`}>{bn ? `${num(division.districts.length, lang)}টি জেলা` : `${division.districts.length} districts`}</span>
                        <svg aria-hidden="true" className={`h-4 w-4 shrink-0 text-gold transition-all duration-300 ${active ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </section>

      <Timeline1971 navigate={navigate} />

      <DistrictMarquee navigate={navigate} />

      {/* ── Featured stories ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest-dark py-24 px-4">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none"><div className="film-grain" /></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white">{t('Stories Worth Reading', 'পড়ার মতো গল্প')}</h2>
              <p className="mt-3 text-lg text-white/70" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                {t('In the words of those who saw it', 'যাঁরা দেখেছেন, তাঁদের নিজের কথায়')}
              </p>
            </div>
            <button
              onClick={() => navigate('search', { query: '' })}
              data-magnetic
              className="group self-start sm:self-auto shrink-0 whitespace-nowrap inline-flex items-center gap-2 rounded-full border border-gold/30 px-5 py-2.5 text-sm font-semibold text-gold-bright hover:border-flag hover:bg-flag hover:text-white"
            >
              {t('See all stories', 'সব গল্প দেখুন')}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Featured story, set like an archival document */}
            {(() => {
              const story = stories[0];
              const people = story;
              return (
                <button
                  onClick={() => navigate('story', { storyId: story.id })}
                  data-tilt="3"
                  className="group lg:col-span-7 relative flex flex-col overflow-hidden rounded-[28px] text-left bg-surface-sunken p-7 sm:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] transition-all duration-700 hover:-translate-y-1.5 hover:shadow-[0_40px_90px_-20px_rgba(11,15,13,0.18)]"
                >
                  <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none opacity-60 mix-blend-multiply"><div className="film-grain" style={{ mixBlendMode: 'multiply', opacity: 0.35 }} /></div>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[20px] border border-gold/30" />

                  <div className="relative flex items-start justify-between gap-6">
                    <span className="mt-1 inline-flex items-center gap-2 text-xl sm:text-2xl font-semibold text-gold-dark" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                      {story.district}
                    </span>
                    <span data-stamp className="shrink-0 rotate-[-4deg] rounded-md border-[3px] border-double border-flag/80 px-3.5 py-1.5 text-center text-flag mix-blend-multiply" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      <span className="block text-[11px] font-medium leading-tight opacity-85" style={{ letterSpacing: 0 }}>{t('Archive no.', 'সংরক্ষণ নং')}</span>
                      <span className="block text-lg font-bold leading-tight tabular-nums" style={{ letterSpacing: 0 }}>{story.archiveNumber}</span>
                    </span>
                  </div>

                  <h3 className="relative mt-8 text-3xl sm:text-[40px] font-bold leading-tight text-ink transition-colors duration-500 group-hover:text-forest-deep" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                    {story.title}
                  </h3>
                  <p className="relative mt-5 mb-8 max-w-[60ch] text-[17px] leading-8 text-ink-soft line-clamp-8" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                    {getStoryExcerpt(story.content, 900)}
                  </p>

                  <div className="relative mt-auto flex flex-col gap-5 border-t border-gold/25 pt-6 sm:flex-row sm:items-end sm:justify-between">
                    <dl className="grid grid-cols-2 gap-x-10 gap-y-1" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      <dt className="text-[15px] text-ink-faint">{t('Respondent', 'বর্ণনাকারী')}</dt>
                      <dt className="text-[15px] text-ink-faint">{t('Collector', 'সংগ্রাহক')}</dt>
                      <dd className="text-lg sm:text-xl font-semibold text-ink">{people.respondent}</dd>
                      <dd className="text-lg sm:text-xl font-semibold text-ink">{people.collector}</dd>
                    </dl>
                    <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">
                      {t('Read the story', 'গল্পটি পড়ুন')}
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </button>
              );
            })()}

            {/* Two more stories */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {stories.slice(1, 3).map((story) => {
                const people = story;
                return (
                  <button
                    key={story.id}
                    onClick={() => navigate('story', { storyId: story.id })}
                    data-tilt="6"
                    className="group relative flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-forest-deep p-6 sm:p-7 text-left transition-all duration-500 hover:-translate-y-1 hover:border-forest/40 hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65)]"
                  >
                    <div className="relative flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 text-lg font-semibold text-gold-bright" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                        {story.district}
                      </span>
                    </div>
                    <h3 className="relative mt-5 text-2xl font-bold leading-snug text-white transition-colors group-hover:text-forest" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {story.title}
                    </h3>
                    <p className="relative mt-3 text-[15px] leading-7 text-white/60 line-clamp-3" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {getStoryExcerpt(story.content)}
                    </p>
                    <div className="relative mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-sm" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      <span className="truncate text-white/65">{t('Respondent', 'বর্ণনাকারী')} <span className="font-semibold text-white/80">{people.respondent}</span></span>
                      <svg className="h-4 w-4 shrink-0 text-gold-bright transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <WitnessQuote navigate={navigate} />

      {/* ── About ─────────────────────────────────────────── */}
      <section className="bg-surface py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-ink mb-8 leading-[1.1]">
              {t('Real memories.', 'সত্যিকারের স্মৃতি।')}<br /><span className="text-forest">{t('Preserved forever.', 'চিরকালের জন্য সংরক্ষিত।')}</span>
            </h2>
            <div className="space-y-5 text-ink-muted leading-relaxed text-[15px]">
              <p>
                <span data-scrub-text>{t('Students from schools across Bangladesh visited their communities and recorded the stories of people who witnessed the 1971 Liberation War. Each story is a piece of living history.', 'সারা বাংলাদেশের বিদ্যালয়ের শিক্ষার্থীরা নিজ নিজ এলাকায় গিয়ে ১৯৭১ সালের মুক্তিযুদ্ধের প্রত্যক্ষদর্শীদের গল্প রেকর্ড করেছে। প্রতিটি গল্প জীবন্ত ইতিহাসের একটি অংশ।')}</span>
              </p>
              <p>
                <span data-scrub-text>{t('The archive currently holds over 65,000 stories and continues to grow, ensuring these voices are never lost.', 'আর্কাইভে বর্তমানে ৬৫,০০০-এর বেশি গল্প আছে এবং সংগ্রহ বাড়ছে, যাতে এই কণ্ঠস্বরগুলো কখনো হারিয়ে না যায়।')}</span>
              </p>
              <blockquote className="border-l-[3px] border-flag pl-5 py-1 my-6">
                <p className="text-ink font-display italic text-lg leading-snug mb-2" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                  {t('"These memories are a part of our national history."', '"এই স্মৃতিগুলি আমাদের জাতীয় ইতিহাসের অংশ।"')}
                </p>
              </blockquote>
            </div>
            <button
              onClick={() => navigate('search', { query: '' })}
              data-magnetic
              className="mt-8 bg-flag text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-flag-dark active:translate-y-px transition-colors inline-flex items-center gap-2 group"
            >
              {t('Explore the Archive', 'আর্কাইভ ঘুরে দেখুন')}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <div data-clip><ArchiveImageCarousel /></div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-surface-raised border-t-4 border-flag rounded-2xl shadow-xl p-5 max-w-[200px]">
              <p className="font-display text-3xl font-bold text-forest"><CountUp value="65,000+" duration={2200} className="" /></p>
              <p className="text-ink-muted text-xs mt-1 leading-snug">{t('Stories from across Bangladesh', 'সারা বাংলাদেশের গল্প')}</p>
            </div>
            {/* Gold accent */}
          </div>
        </div>
      </section>

      {/* ── Closing: the flag ─────────────────────────────── */}
      <section data-flag className="relative flex min-h-[90dvh] items-center justify-center overflow-hidden bg-forest px-4 py-28 text-center">
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none opacity-60"><div className="film-grain" /></div>
        <div aria-hidden="true" data-flag-sun className="pointer-events-none absolute left-[45%] top-1/2 h-[min(88vw,40rem)] w-[min(88vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-flag" />
        <div className="relative max-w-3xl">
          <p className="text-lg font-semibold text-white/85">{t('Bangladesh, 1971', 'বাংলাদেশ, ১৯৭১')}</p>
          <h2 className="mt-4 font-display text-5xl sm:text-7xl font-bold leading-[1.05] text-white text-balance">
            {t('Every story is a record.', 'প্রতিটি গল্প একটি দলিল।')}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            {t('Read what the people who lived through the war saw, and find the stories from your own district.', 'যাঁরা যুদ্ধ দেখেছেন, তাঁদের কথা পড়ুন, আর খুঁজে নিন আপনার নিজের জেলার গল্প।')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate('search', { query: '' })} data-magnetic className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-ink transition-colors hover:bg-surface-sunken active:translate-y-px">
              {t('Read the stories', 'গল্পগুলো পড়ুন')}
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={() => navigate('location-browse')} className="rounded-xl border border-white/50 px-7 py-3.5 font-semibold text-white transition-colors hover:border-white hover:bg-white/10">
              {t('Browse by district', 'জেলা ধরে খুঁজুন')}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
