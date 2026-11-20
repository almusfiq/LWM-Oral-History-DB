import { useState, useMemo, useEffect } from 'react';
import type { Page } from '../App';
import type { SavedStory } from '../App';
import StoryCard from '../components/StoryCard';
import { allDistricts, districtMatchesStory, divisions, locationSearchTermsForStory } from '../data/bangladeshLocations';
import { stories } from '../data/stories';
import { getStories } from '../api/client';
import { num, useLang } from '../i18n';

interface SearchResultsPageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
  initialQuery: string;
  canBookmark: boolean;
  savedStories: SavedStory[];
  onToggleBookmark: (story: SavedStory) => void;
  /** Show exactly these stories, in this order, under this heading (until the visitor searches). */
  storyList?: { ids: string[]; title: string; titleBn: string };
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
/**
 * Fold text so small differences don't stop a match: one Unicode form of য়/ড়/ঢ়, ী=ি and ূ=ু
 * (common spelling variants), English digits as Bangla digits, and punctuation (মো. / মোঃ / মো) ignored.
 */
function fold(text: string) {
  return text.normalize('NFC')
    .replace(/য়/g, 'য়').replace(/ড়/g, 'ড়').replace(/ঢ়/g, 'ঢ়')
    .replace(/ী/g, 'ি').replace(/ূ/g, 'ু')
    .replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)])
    .replace(/[.:ঃ;!?'"‘’“”()[\]\-–—।/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
    .trim();
}

type SearchField = 'title' | 'people' | 'school' | 'district' | 'address' | 'text';
// Each field is a list of separate pieces (one person, one credit line, one sentence of the story), and a
// query is matched inside a single piece, so words from different places never combine.
type SearchEntry = { story: (typeof stories)[number] } & Record<SearchField, string[]>;
// Where a word is found decides how high the story ranks.
// A story *from* a district outranks one whose narrator merely lives there or whose text mentions it.
const FIELD_WEIGHTS: Array<[SearchField, number]> = [['title', 8], ['people', 6], ['district', 5], ['school', 4], ['address', 2], ['text', 1]];

let cachedIndex: SearchEntry[] | null = null;
/** Folded search text for every story, built once (the archive is large). */
function buildSearchIndex(items: (typeof stories)) {
  return items.map((story) => {
    const pieces = (values: string[]) => values.map(fold).filter(Boolean);
    return {
      story,
      title: pieces([story.title]),
      people: pieces([story.collector, story.respondent, story.relationship]),
      school: pieces([story.school, story.collectorClass]),
      district: pieces([story.district, ...locationSearchTermsForStory(story.district)]),
      address: pieces([story.respondentAddress, story.archiveNumber]),
      // The story sentence by sentence, then each line of the source record on its own.
      text: pieces([...story.content.split(/(?<=[।?!])\s+|\n+/), ...(story.details || [])]),
    };
  });
}

export default function SearchResultsPage({ navigate, initialQuery, canBookmark, savedStories, onToggleBookmark, storyList }: SearchResultsPageProps) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [allStories, setAllStories] = useState<typeof stories>(stories);
  const [query, setQuery] = useState(initialQuery);
  const [list, setList] = useState(storyList);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Division', 'Access']);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getStories({ limit: 10000 })
      .then((res) => {
        if (!active || !res.stories?.length) return;
        setAllStories((prev) => {
          const map = new Map<string, (typeof stories)[number]>();
          prev.forEach((s) => map.set(s.id, s));
          res.stories.forEach((s: any) =>
            map.set(s.id, {
              ...s,
              details: s.details || [],
              district: s.district || '',
              collector: s.collector || '',
              respondent: s.respondent || '',
              school: s.school || '',
              collectorClass: s.collectorClass || '',
              respondentAddress: s.respondentAddress || '',
              respondentAge: s.respondentAge || '',
              relationship: s.relationship || '',
              content: s.content || '',
              title: s.title || '',
              archiveNumber: s.archiveNumber || s.id,
            })
          );
          return [...map.values()];
        });
      })
      .catch((err) => console.warn('Could not fetch stories for search:', err));
    return () => {
      active = false;
    };
  }, []);

  const searchEntries = useMemo(() => buildSearchIndex(allStories), [allStories]);

  // Top schools present in the archive with multiple stories
  const topSchools = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allStories) {
      if (s.school) counts.set(s.school, (counts.get(s.school) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [allStories]);

  // Districts that have stories in the archive
  const activeDistricts = useMemo(() => {
    const set = new Set(allStories.map((s) => s.district));
    return allDistricts
      .filter((d) => [...set].some((sd) => districtMatchesStory(d.nameBn, sd)))
      .map((d) => d.name);
  }, [allStories]);

  const filterGroups = [
    { label: 'Division', options: divisions.map((division) => division.name) },
    { label: 'District', options: activeDistricts },
    { label: 'School', options: topSchools },
  ];

  // Filter values stay English (they match the location search terms); only their labels change.
  const bnLabels = useMemo(() => new Map<string, string>([
    ['Division', 'বিভাগ'], ['District', 'জেলা'], ['School', 'বিদ্যালয়'],
    ...divisions.map((d): [string, string] => [d.name, d.nameBn]),
    ...allDistricts.map((d): [string, string] => [d.name, d.nameBn]),
  ]), []);
  const label = (value: string) => (bn ? bnLabels.get(value) ?? value : value);

  const perPage = 9;
  // A query is one or more alternatives separated by commas ("বাগেরহাট, সিলেট" = either). Each alternative is
  // matched strictly, so a story is only found for what it really says:
  //   1. the words together, in order, in one place (a school name, a person, the title, the text...);
  //   2. only if no story has that, all the words within one and the same place.
  // Words are never collected from different places (a village in the text plus "school" in the credits).
  // Every word must start a word in the story, so "রাম" finds "রামপাল" but not "আরাম".
  // An alternative in quotes ("২৬ মার্চ") must match as a phrase.
  const alternatives = query.split(/[,،]/).map((part) => ({
    words: fold(part).split(' ').filter(Boolean),
    quoted: /^\s*["“”].*["“”]\s*$/.test(part),
  })).filter(({ words }) => words.length);
  const startsWord = (pieces: string[], part: string) => pieces.some((piece) => ` ${piece}`.includes(` ${part}`));
  const allInOnePiece = (pieces: string[], words: string[]) => pieces.some((piece) => words.every((word) => ` ${piece}`.includes(` ${word}`)));
  const scores = new Map<string, number>();
  for (const { words, quoted } of alternatives) {
    const phrase = words.join(' ');
    const together = (entry: SearchEntry) => FIELD_WEIGHTS.reduce((best, [field, weight]) => (startsWord(entry[field], phrase) ? Math.max(best, weight) : best), 0);
    const sameField = (entry: SearchEntry) => FIELD_WEIGHTS.reduce((best, [field, weight]) => (allInOnePiece(entry[field], words) ? Math.max(best, weight) : best), 0);
    let hits = searchEntries.map((entry) => ({ entry, score: together(entry) })).filter(({ score }) => score > 0);
    if (!hits.length && !quoted && words.length > 1) hits = searchEntries.map((entry) => ({ entry, score: sameField(entry) })).filter(({ score }) => score > 0);
    for (const { entry, score } of hits) scores.set(entry.story.id, Math.max(scores.get(entry.story.id) ?? 0, score));
  }
  const ranked = list
    ? list.ids.map((id) => searchEntries.find((entry) => entry.story.id === id)).filter((entry) => entry !== undefined).map((entry) => ({ entry, score: 1 }))
    : searchEntries
      .map((entry) => ({ entry, score: alternatives.length ? scores.get(entry.story.id) ?? 0 : 1 }))
      .filter(({ score }) => score > 0);
  // Most relevant first (a name in the title or credits beats a passing mention in the text).
  if (alternatives.length && !list) ranked.sort((a, b) => b.score - a.score);
  const matchingStories = ranked.map(({ entry }) => entry.story).filter((story) => {
    const locations = locationSearchTermsForStory(story.district);
    const matchesFilters = Object.entries(activeFilters).every(([group, selected]) => {
      if (!selected.length) return true;
      if (group === 'Division') {
        const divTerms = locations.filter((_, index) => index >= 3);
        return selected.some((value) => divTerms.some((term) => fold(term).includes(fold(value))));
      }
      if (group === 'District') {
        const distTerms = locations.slice(0, 3);
        return selected.some((value) => distTerms.some((term) => fold(term).includes(fold(value))));
      }
      if (group === 'School') {
        return selected.some((value) => fold(story.school).includes(fold(value)));
      }
      return selected.some((value) => [...story.details, story.content].some((term) => fold(term).includes(fold(value))));
    });
    return matchesFilters;
  });
  const totalResults = matchingStories.length;
  const pageStories = matchingStories.slice((page - 1) * perPage, page * perPage);

  const toggleFilter = (group: string, value: string) => {
    setPage(1);
    setActiveFilters((prev) => {
      const cur = prev[group] ?? [];
      return { ...prev, [group]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  };

  const toggleGroup = (label: string) =>
    setExpandedGroups((prev) => prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]);

  const activeCount = Object.values(activeFilters).flat().length;
  const clearAll = () => { setActiveFilters({}); setPage(1); };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setList(undefined);
    setQuery(inputValue);
    setPage(1);
  };

  const Sidebar = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-faint">{t('Filters', 'বাছাই')}</h3>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-[11px] text-gold font-medium hover:text-forest-deep">
            {t('Clear', 'বাদ দিন')} {num(activeCount, lang)}
          </button>
        )}
      </div>

      {filterGroups.map((group) => {
        const expanded = expandedGroups.includes(group.label);
        const groupActive = activeFilters[group.label] ?? [];
        return (
          <div key={group.label} className="border-t border-line-subtle pt-4">
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="text-sm font-semibold text-ink">
                {label(group.label)}
                {groupActive.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-forest text-white text-[9px] font-bold rounded-full">
                    {num(groupActive.length, lang)}
                  </span>
                )}
              </span>
              <svg className={`w-3.5 h-3.5 text-ink-faint transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" />
              </svg>
            </button>
            {expanded && (
              <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
                {group.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => toggleFilter(group.label, opt)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                        groupActive.includes(opt) ? 'bg-forest border-gold' : 'border-line group-hover:border-forest/50'
                      }`}
                    >
                      {groupActive.includes(opt) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-ink-muted group-hover:text-ink transition-colors leading-tight">{label(opt)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-surface min-h-screen" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
      {/* Sticky search bar */}
      <div className="bg-forest-deep border-b-4 border-flag sticky top-[68px] z-30">
        <div className="px-4 sm:px-8 py-3">
          <form onSubmit={handleSearch} className="relative flex items-center gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('Search stories, people, schools, places...', 'গল্প, ব্যক্তি, বিদ্যালয়, স্থান খুঁজুন...')}
                className="w-full bg-white border border-transparent rounded-xl pl-11 pr-4 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-flag transition-colors"
              />
            </div>
            <button type="submit" className="bg-flag text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-flag-dark flex-shrink-0 transition-colors">
              {t('Search', 'খুঁজুন')}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-deep">
              {list ? (bn ? <>{list.titleBn}: <span className="text-flag">সেদিনের গল্প</span></> : <>{list.title}: <span className="text-flag">stories from that day</span></>) : bn
                ? (query ? <><span className="text-gold italic">"{query}"</span>-এর ফলাফল</> : 'সকল গল্প')
                : <>Results for <span className="text-gold italic">"{query || 'all stories'}"</span></>}
            </h1>
            <p className="text-ink-faint text-sm mt-1">
              {bn ? `${num(totalResults, lang)}টি গল্প পাওয়া গেছে` : `${totalResults.toLocaleString()} stories found`}
              {activeCount > 0 && (bn ? ` · ${num(activeCount, lang)}টি শর্ত চালু` : ` · ${activeCount} filter${activeCount > 1 ? 's' : ''} active`)}
            </p>
            {list && (
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                {t('Stories in which the narrator tells what they themselves lived through on this day.', 'যেসব গল্পে বর্ণনাকারী এই দিনে নিজে যা দেখেছেন বা যা ঘটেছে, তা বলেছেন।')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium text-ink border border-line bg-surface-raised rounded-xl px-3.5 py-2 hover:border-forest transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round" />
              </svg>
              {t('Filter', 'বাছাই')} {activeCount > 0 && `(${num(activeCount, lang)})`}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="bg-surface-raised rounded-2xl border border-line p-5 sticky top-32">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface-raised shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-ink">{t('Refine Results', 'ফলাফল ছেঁকে নিন')}</h3>
                  <button onClick={() => setSidebarOpen(false)} className="text-ink-faint hover:text-ink p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <Sidebar />
              </div>
            </div>
          )}

          {/* Results grid */}
          <div className="flex-1 min-w-0">
            {totalResults === 0 && (
              <div className="rounded-2xl border border-line bg-surface-raised px-6 py-14 text-center">
                <p className="text-xl font-semibold text-forest-deep">{t('No story found', 'কোনো গল্প পাওয়া যায়নি')}</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                  {t(`No story in the archive matches "${query}". Check the spelling, or search with fewer words, such as just a name, school or place.`,
                    `আর্কাইভের কোনো গল্পে "${query}" পাওয়া যায়নি। বানান মিলিয়ে দেখুন, অথবা কম শব্দে খুঁজুন, যেমন শুধু নাম, বিদ্যালয় বা স্থান।`)}
                </p>
                <button onClick={() => { setList(undefined); setQuery(''); setInputValue(''); setPage(1); }} className="mt-6 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark">
                  {t('See all stories', 'সব গল্প দেখুন')}
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pageStories.map((story) => (
                <StoryCard
                  key={story.id}
                  title={story.title}
                  collector={story.collector}
                  respondent={story.respondent}
                  location={story.district}
                  excerpt={story.content.slice(0, 320)}
                  access="public"
                  storyId={story.id}
                  canBookmark={canBookmark}
                  isBookmarked={savedStories.some((saved) => saved.id === story.id)}
                  onToggleBookmark={onToggleBookmark}
                  onSignIn={() => navigate('login')}
                  onLocationClick={() => {
                    const place = allDistricts.find((district) => districtMatchesStory(district.nameBn, story.district));
                    if (place) navigate('location-detail', { locationDivisionId: place.divisionId, locationDistrictId: place.id });
                  }}
                  onRead={() => navigate('story', { storyId: story.id })}
                  onRestricted={() => navigate('story', { storyId: story.id })}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className={`mt-10 flex ${totalResults === 0 ? 'hidden' : ''} flex-col sm:flex-row items-center justify-between gap-4`}>
              <p className="text-sm text-ink-faint">
                {bn
                  ? <>মোট <span className="font-semibold text-ink">{num(totalResults, lang)}</span>টি গল্পের মধ্যে {num((page - 1) * perPage + 1, lang)}–{num(Math.min(page * perPage, totalResults), lang)} দেখানো হচ্ছে</>
                  : <>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalResults)} of{' '}
                <span className="font-semibold text-ink">{totalResults.toLocaleString()}</span> stories</>}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-line text-ink-faint hover:border-forest hover:text-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="m15 18-6-6 6-6" strokeLinecap="round" />
                  </svg>
                </button>
                {Array.from({ length: Math.ceil(totalResults / perPage) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                      p === page
                        ? 'bg-forest text-white shadow-sm'
                        : 'border border-line text-ink-muted hover:border-forest hover:text-forest'
                    }`}
                  >
                    {num(p, lang)}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(totalResults / perPage)}
                  className="p-2.5 rounded-xl border border-line text-ink-faint hover:border-forest hover:text-forest transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
