import { useEffect, useMemo, useRef, useState } from 'react';
import type { Page } from '../App';
import { stories, type ArchiveStory } from '../data/stories';
import { getArchiveRecord } from '../utils/archiveRecord';
import { getSchoolPictures } from '../data/schoolPictures';
import { getStoryById } from '../api/client';
import StoryPhotoSlideshow from '../components/StoryPhotoSlideshow';
import { num, useLang } from '../i18n';

interface StoryPageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
  storyId?: string;
  storyOverride?: ArchiveStory;
  canBookmark: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

// Reading themes: warm paper, sepia, and a low-light night page.
const THEMES = {
  paper: { bg: '#FAF8F3', text: '#1F1F1F', muted: '#5E5E5E', rule: '#E7DCC8', card: 'rgba(255, 255, 255, 0.7)', bar: 'rgba(250, 248, 243, 0.9)', accent: '#7A5E33', red: '#C41E33', green: '#006A4E', sheet: '#FBF4E2' },
  sepia: { bg: '#E9E1D2', text: '#2B2B2B', muted: '#585858', rule: '#D6C9AF', card: 'rgba(242, 238, 229, 0.75)', bar: 'rgba(233, 225, 210, 0.92)', accent: '#6B5230', red: '#A8172A', green: '#00573F', sheet: '#EFE3C9' },
  night: { bg: '#121514', text: '#E6E1D6', muted: '#9A9A9A', rule: '#2A2F2C', card: 'rgba(255, 255, 255, 0.04)', bar: 'rgba(18, 21, 20, 0.92)', accent: '#D9B36C', red: '#FF8A95', green: '#3FCB95', sheet: '#1A1E1C' },
} as const;
type ReadingTheme = keyof typeof THEMES;
const SIZES = [17, 19, 21, 24];
const READING_KEY = 'lwm-reading';
const STORY_FONT = "'Noto Sans Bengali', sans-serif";

function readReadingPrefs(): { theme: ReadingTheme; size: number } {
  try {
    const saved = JSON.parse(localStorage.getItem(READING_KEY) ?? '{}') as { theme?: string; size?: number };
    return { theme: saved.theme && saved.theme in THEMES ? saved.theme as ReadingTheme : 'paper', size: SIZES.includes(saved.size ?? 0) ? saved.size! : 19 };
  } catch {
    return { theme: 'paper', size: 19 };
  }
}

export default function StoryPage({ navigate, storyId, storyOverride, canBookmark, isBookmarked, onToggleBookmark }: StoryPageProps) {
  const { t, lang } = useLang();
  const en = lang === 'en';
  const [prefs, setPrefs] = useState(readReadingPrefs);
  useEffect(() => {
    try { localStorage.setItem(READING_KEY, JSON.stringify(prefs)); } catch { /* private mode: keep for this visit */ }
  }, [prefs]);

  const [dbStory, setDbStory] = useState<ArchiveStory | null>(null);

  useEffect(() => {
    if (storyOverride || !storyId) return;
    const found = stories.find((item) => item.id === storyId);
    if (!found) {
      getStoryById(storyId)
        .then((res) => {
          if (res) setDbStory(res);
        })
        .catch(() => { });
    }
  }, [storyId, storyOverride]);

  const story = storyOverride ?? dbStory ?? stories.find((item) => item.id === storyId) ?? stories[0];
  const sourceReference = getArchiveRecord(story.content, story.archiveNumber);
  const narrative = story.content.trimEnd().endsWith(sourceReference) && !sourceReference.startsWith('Archive ')
    ? story.content.trimEnd().slice(0, -sourceReference.length).trimEnd()
    : story.content;
  // Blank lines separate paragraphs; single line breaks are just where the source page wrapped.
  const paragraphs = narrative.split(/\n\s*\n/).map((block) => block.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const minutes = Math.max(1, Math.round(narrative.split(/\s+/).length / 180));
  const people = { collector: story.collector ?? '', respondent: story.respondent ?? '' };
  // Older records saved in the admin panel may predate these fields.
  const respondentAge = story.respondentAge ?? '';
  const respondentRelationship = story.relationship ?? '';
  const respondentAddress = story.respondentAddress ?? '';
  const collectorSchool = story.school ?? '';
  const collectorClass = story.collectorClass ?? '';
  const [dynamicPictures, setDynamicPictures] = useState<string[]>([]);

  useEffect(() => {
    if (!story.district || !story.school) return;
    fetch(`/api/photos/${encodeURIComponent(story.district)}/${encodeURIComponent(story.school)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.pictures?.length) setDynamicPictures(data.pictures);
      })
      .catch(() => { });
  }, [story.district, story.school]);

  const schoolPictures = dynamicPictures.length > 0 ? dynamicPictures : getSchoolPictures(story.district, story.school);

  // More to read: other stories from the same district first, then the ones that follow in the archive.
  const moreStories = useMemo(() => {
    const index = stories.findIndex((item) => item.id === story.id);
    const sameDistrict = stories.filter((item) => item.district === story.district && item.id !== story.id);
    const following = Array.from({ length: 6 }, (_, i) => stories[(index + 1 + i) % stories.length]).filter((item) => item.id !== story.id);
    return [...sameDistrict.slice(index % Math.max(1, sameDistrict.length)), ...sameDistrict, ...following]
      .filter((item, i, all) => all.findIndex((other) => other.id === item.id) === i)
      .slice(0, 3);
  }, [story.id, story.district]);

  // How far through the story the reader is.
  const articleRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const article = articleRef.current;
        if (!article) return;
        const box = article.getBoundingClientRect();
        const read = (window.innerHeight * 0.6 - box.top) / box.height;
        setProgress(Math.min(1, Math.max(0, read)));
      });
    };
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', measure); window.removeEventListener('resize', measure); };
  }, [story.id, prefs.size]);

  const theme = THEMES[prefs.theme];
  const sizeIndex = SIZES.indexOf(prefs.size);
  const resize = (step: number) => setPrefs((current) => ({ ...current, size: SIZES[Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(current.size) + step))] }));
  const saveLabel = canBookmark ? (isBookmarked ? t('Remove from My Collection', 'আমার সংগ্রহ থেকে সরান') : t('Save to My Collection', 'আমার সংগ্রহে রাখুন')) : t('Sign in to save story', 'গল্প সংরক্ষণ করতে সাইন ইন করুন');
  const save = () => (canBookmark ? onToggleBookmark() : navigate('login'));
  const notRecorded = t('Not recorded', 'উল্লেখ নেই');


  const fact = (label: string, value: string, sub?: string) => value ? (
    <div className="border-t border-[var(--rd-rule)] py-3.5 first:border-t-0 first:pt-0">
      <dt className="text-xs text-[var(--rd-muted)]">{label}</dt>
      <dd className="mt-1 font-semibold leading-snug">{value}</dd>
      {sub && <dd className="mt-1 text-sm leading-relaxed text-[var(--rd-muted)]">{sub}</dd>}
    </div>
  ) : null;
  const facts = (
    <dl>
      {fact(t('Told by', 'বলেছেন'), people.respondent || notRecorded, [respondentAge && `${t('Age', 'বয়স')} ${respondentAge}`, respondentRelationship].filter(Boolean).join(' · ') || undefined)}
      {fact(t('Address', 'ঠিকানা'), respondentAddress)}
      {fact(t('Recorded by', 'সংগ্রহ করেছে'), people.collector || notRecorded, collectorClass || undefined)}
      {fact(t('School', 'বিদ্যালয়'), collectorSchool)}
      {fact(t('Archive record', 'আর্কাইভ রেকর্ড'), sourceReference)}
    </dl>
  );
  const bookmarkIcon = (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z" strokeLinejoin="round" /></svg>
  );
  const pin = <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>;

  return (
    <div
      className="relative min-h-screen pb-40 transition-colors duration-500"
      style={{ fontFamily: STORY_FONT, background: theme.bg, color: theme.text, ['--rd-text' as string]: theme.text, ['--rd-muted' as string]: theme.muted, ['--rd-rule' as string]: theme.rule, ['--rd-card' as string]: theme.card, ['--rd-accent' as string]: theme.accent, ['--rd-red' as string]: theme.red, ['--rd-green' as string]: theme.green, ['--rd-sheet' as string]: theme.sheet }}
    >
      {/* Way back */}
      <nav aria-label={t('Breadcrumb', 'অবস্থান')} className="relative mx-auto flex max-w-7xl items-center gap-2 px-5 pt-6 text-sm text-[var(--rd-muted)] sm:px-8">
        <button onClick={() => navigate('search')} className="group inline-flex items-center gap-1.5 hover:text-forest-deep">
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>{t('All stories', 'সব গল্প')}
        </button>
        <span aria-hidden="true" className="opacity-50">/</span>
        <span className="truncate">{story.district}</span>
      </nav>

      {/* ── Left: the title and the story on a paper page. Right: the photographs, then the record. ── */}
      <div className="relative mx-auto mt-8 grid max-w-7xl items-start gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_27rem]">
        {/* The story, set on a sheet of paper with a few more pages stacked behind it */}
        <div className="relative min-w-0">
          <span aria-hidden="true" className="absolute inset-x-3 -bottom-3 top-3 rounded-sm bg-[var(--rd-sheet)] opacity-60 shadow-[0_2px_10px_rgba(0,0,0,0.08)] rotate-[0.6deg]" />
          <span aria-hidden="true" className="absolute inset-x-1.5 -bottom-1.5 top-1.5 rounded-sm bg-[var(--rd-sheet)] opacity-80 shadow-[0_2px_8px_rgba(0,0,0,0.08)] -rotate-[0.4deg]" />
          <article
            ref={articleRef}
            lang="bn"
            className="story-sheet relative rounded-sm border border-[var(--rd-rule)] bg-[var(--rd-sheet)] px-6 pb-12 pt-0 shadow-[0_30px_60px_-30px_rgba(11,15,13,0.35),0_2px_6px_rgba(11,15,13,0.06)] sm:px-14 sm:pb-16"
          >
            {/* Two strips of tape holding the page down */}
            <span aria-hidden="true" className="paper-tape left-6 -rotate-[8deg] sm:left-10" />
            <span aria-hidden="true" className="paper-tape right-6 rotate-[7deg] sm:right-10" />
            {/* The flag in a line along the top of the page */}
            <div aria-hidden="true" className="-mx-6 h-1.5 bg-forest sm:-mx-14"><span className="ml-[22%] block h-full w-20 bg-flag" /></div>

            {/* Title */}
            <header className="pb-9 pt-10 sm:pt-12">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium">
                <span className="inline-flex items-center gap-1.5 text-[var(--rd-accent)]">{pin}{story.district}</span>
                <span className="rounded border border-[var(--rd-red)] px-2 py-0.5 text-[var(--rd-red)]">{t('Archive no.', 'সংরক্ষণ নং')} {story.archiveNumber}</span>
              </p>
              <h1 className="mt-5 text-[clamp(2.1rem,4.4vw,3.6rem)] font-bold leading-[1.25] text-balance">{story.title}</h1>
              <p className="mt-5 text-[15px] text-[var(--rd-muted)] sm:text-base">
                {t('Told by', 'বলেছেন')} <b className="font-semibold text-[var(--rd-text)]">{people.respondent || notRecorded}</b>
                <span aria-hidden="true" className="mx-2.5 opacity-40">·</span>
                {t('recorded by', 'সংগ্রহ করেছে')} <b className="font-semibold text-[var(--rd-text)]">{people.collector || notRecorded}</b>
              </p>
              <div aria-hidden="true" className="mt-8 h-px bg-[var(--rd-rule)]" />
            </header>

            <div style={{ fontSize: prefs.size, lineHeight: 2 }}>
              {paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className={`sm:text-justify ${paragraphIndex ? 'mt-[0.4em] indent-[2em]' : ''}`}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* The end */}
            <div className="mt-14 flex items-center justify-center gap-2 text-sm text-[var(--rd-muted)]" aria-label={t('End of story', 'গল্প শেষ')}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--rd-green)]" />
              <span className="font-semibold text-[var(--rd-text)]">{t('The end', 'শেষ')}</span>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--rd-red)]" />
            </div>

            {/* Foot of the page */}
            <footer className="mt-12 flex items-center justify-between gap-4 border-t border-[var(--rd-rule)] pt-3 text-xs text-[var(--rd-muted)]">
              <span className="truncate">{t('Liberation War Museum · Oral History', 'মুক্তিযুদ্ধ জাদুঘর · মৌখিক ইতিহাস')}</span>
              <span className="shrink-0">{story.district}</span>
            </footer>
          </article>
        </div>

        {/* Right: photographs of the students (or a credit for them), then the record. On phones this
            comes first, so the photographs are seen before the story. */}
        <aside className="min-w-0 max-lg:-order-1 lg:sticky lg:top-24">
          {schoolPictures.length > 0 ? (
            <section aria-label={t('Photographs of the students', 'শিক্ষার্থীদের ছবি')}>
              <StoryPhotoSlideshow pictures={schoolPictures} school={story.school} district={story.district} />
            </section>
          ) : (people.collector || collectorSchool) ? (
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--rd-rule)] bg-[var(--rd-card)] p-5">
              <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path d="M3 10 12 5l9 5-9 5-9-5Z" strokeLinejoin="round" /><path d="M7 12v5c3 2 7 2 10 0v-5" strokeLinecap="round" /></svg>
              </span>
              <div className="min-w-0 text-left">
                <p className="text-xs text-[var(--rd-muted)]">{t('Collected for the school project by', 'বিদ্যালয়ের কর্মসূচিতে গল্পটি সংগ্রহ করেছে')}</p>
                <p className="mt-0.5 font-semibold">{people.collector || notRecorded}</p>
                <p className="mt-0.5 text-sm text-[var(--rd-muted)]">{[collectorClass, collectorSchool].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[var(--rd-rule)] bg-[var(--rd-card)] p-5 max-lg:hidden">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-flag" />{t('About this record', 'এই নথি সম্পর্কে')}</p>
            {facts}
            <button onClick={save} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-3 py-3 text-[13px] font-semibold leading-snug text-white text-balance hover:bg-forest-dark active:scale-[0.98]">
              {bookmarkIcon}{saveLabel}
            </button>
          </div>
        </aside>
      </div>

      {/* ── The record below the story: all of it on phones, the source lines everywhere ── */}
      <section className="relative mx-auto mt-14 max-w-3xl px-5 sm:px-8">
        <div className="rounded-2xl border border-[var(--rd-rule)] bg-[var(--rd-card)] p-6 sm:p-8">
          <div className="lg:hidden">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-flag" />{t('About this record', 'এই নথি সম্পর্কে')}</h2>
            {facts}
          </div>
          {story.details.length > 0 ? (
            <details className="group max-lg:mt-4 max-lg:border-t max-lg:border-[var(--rd-rule)] max-lg:pt-4">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-[var(--rd-accent)] hover:text-forest">
                {t('Full source details', 'মূল নথির সম্পূর্ণ তথ্য')}
                <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="mt-4 space-y-2 border-t border-[var(--rd-rule)] pt-4 text-sm leading-relaxed text-[var(--rd-muted)]">
                {story.details.map((line, lineIndex) => <p key={`${lineIndex}-${line}`}>{line}</p>)}
              </div>
            </details>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-forest-dark active:scale-[0.98] lg:hidden">
            {bookmarkIcon}{saveLabel}
          </button>
          <button onClick={() => navigate('search')} className="rounded-xl border border-[var(--rd-rule)] px-5 py-3 text-sm font-semibold hover:border-forest hover:text-forest-deep active:scale-[0.98]">
            {t('Back to stories', 'গল্পে ফিরে যান')}
          </button>
        </div>
      </section>

      {/* ── Read next ─────────────────────────────────────── */}
      {moreStories.length > 0 && (
        <section className="relative mx-auto mt-20 max-w-6xl px-5 sm:px-8">
          <h2 className="mb-6 text-2xl font-bold">{t('Read next', 'এরপর পড়ুন')}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {moreStories.map((item) => (
              <button
                key={item.id}
                onClick={() => { navigate('story', { storyId: item.id }); window.scrollTo(0, 0); }}
                className="group flex flex-col rounded-2xl border border-[var(--rd-rule)] bg-[var(--rd-card)] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--rd-green)] hover:shadow-[0_24px_50px_-30px_rgba(11,15,13,0.35)]"
              >
                <span className="inline-flex items-center gap-1.5 text-sm text-[var(--rd-accent)]">{pin}{item.district}</span>
                <span className="mt-3 text-xl font-bold leading-snug transition-colors group-hover:text-[var(--rd-green)]">{item.title}</span>
                <span className="mt-3 line-clamp-3 text-[15px] leading-7 text-[var(--rd-muted)]">{item.content.slice(0, 200)}</span>
                <span className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm">
                  <span className="truncate text-[var(--rd-muted)]">{t('Told by', 'বলেছেন')} <b className="font-semibold text-[var(--rd-text)]">{item.respondent || notRecorded}</b></span>
                  <span aria-hidden="true" className="shrink-0 text-[var(--rd-green)] transition-transform group-hover:translate-x-1">→</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Reading bar: text size, page tone, save ─────────── */}
      <div
        role="toolbar"
        aria-label={t('Reading settings', 'পড়ার সেটিং')}
        className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--rd-rule)] p-1.5 shadow-[0_18px_40px_-18px_rgba(11,15,13,0.55)] backdrop-blur-md"
        style={{ background: theme.bar, color: theme.text }}
      >
        <button onClick={() => resize(-1)} disabled={sizeIndex === 0} aria-label={t('Smaller text', 'ছোট লেখা')} className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold hover:bg-black/5 disabled:opacity-30">A−</button>
        <button onClick={() => resize(1)} disabled={sizeIndex === SIZES.length - 1} aria-label={t('Larger text', 'বড় লেখা')} className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold hover:bg-black/5 disabled:opacity-30">A+</button>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--rd-rule)]" />
        {(Object.keys(THEMES) as ReadingTheme[]).map((key) => (
          <button
            key={key}
            onClick={() => setPrefs((current) => ({ ...current, theme: key }))}
            aria-pressed={prefs.theme === key}
            aria-label={key === 'paper' ? t('Paper page', 'কাগজের পাতা') : key === 'sepia' ? t('Sepia page', 'সেপিয়া পাতা') : t('Night page', 'রাতের পাতা')}
            title={key === 'paper' ? t('Paper', 'কাগজ') : key === 'sepia' ? t('Sepia', 'সেপিয়া') : t('Night', 'রাত')}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${prefs.theme === key ? 'ring-2 ring-forest ring-offset-0' : 'hover:bg-black/5'}`}
          >
            <span className="h-5 w-5 rounded-full border border-black/15" style={{ background: THEMES[key].bg }} />
          </button>
        ))}
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--rd-rule)]" />
        {/* Progress ring around the save button, so phones see how far they are too */}
        <button onClick={save} aria-label={saveLabel} title={saveLabel} className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--rd-green)] hover:bg-black/5">
          <svg aria-hidden="true" viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle cx={18} cy={18} r={16} fill="none" stroke="var(--rd-rule)" strokeWidth={2} />
            <circle cx={18} cy={18} r={16} fill="none" stroke="var(--rd-red)" strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
          </svg>
          {bookmarkIcon}
        </button>
      </div>
    </div>
  );
}
