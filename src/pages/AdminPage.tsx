import { useEffect, useMemo, useState } from 'react';
import type { Page } from '../App';
import AdminSidebar, { type AdminSection } from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import CountUp from '../components/CountUp';
import { num, useLang } from '../i18n';
import { getStories, getStats, saveStory, deleteStory, type SystemStats } from '../api/client';
import type { ArchiveStory } from '../data/stories';

interface AdminPageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
  onLogout: () => void;
  initialSection?: string;
}

type Access = 'public' | 'restricted';

function formatDate(value?: string, lang: 'en' | 'bn' = 'bn') {
  if (!value) return lang === 'bn' ? 'তারিখ নেই' : 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return lang === 'bn' ? 'তারিখ নেই' : 'No date';
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(date);
}

const DIVISIONS = [
  'খুলনা বিভাগ',
  'চট্টগ্রাম বিভাগ',
  'ঢাকা বিভাগ',
  'রাজশাহী বিভাগ',
  'রংপুর বিভাগ',
  'সিলেট বিভাগ',
  'ময়মনসিংহ বিভাগ',
  'বরিশাল বিভাগ',
];

export default function AdminPage({ navigate, onLogout, initialSection = 'Overview' }: AdminPageProps) {
  const [activeNav, setActiveNav] = useState<AdminSection>((initialSection as AdminSection) || 'Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');

  const [stories, setStories] = useState<ArchiveStory[]>([]);
  const [totalStoriesCount, setTotalStoriesCount] = useState(0);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [editingStory, setEditingStory] = useState<ArchiveStory | null>(null);
  const [deletingStory, setDeletingStory] = useState<ArchiveStory | null>(null);
  const [inspectingStory, setInspectingStory] = useState<ArchiveStory | null>(null);

  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const n = (value: number) => num(value, lang);

  const fetchDatabaseData = async () => {
    try {
      setLoading(true);
      const [statsRes, storiesRes] = await Promise.all([
        getStats().catch(() => null),
        getStories({
          page: 1,
          limit: 250,
          search: searchQuery,
          division: divisionFilter,
          district: districtFilter,
          access: accessFilter as any,
        }).catch(() => null),
      ]);

      if (statsRes) setStats(statsRes);
      if (storiesRes) {
        setStories(storiesRes.stories);
        setTotalStoriesCount(storiesRes.total);
      }
    } catch (e) {
      console.error('Failed to load database data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSection) {
      setActiveNav(initialSection as AdminSection);
    }
  }, [initialSection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDatabaseData();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, divisionFilter, districtFilter, accessFilter]);

  // Unique districts available in current stories
  const availableDistricts = useMemo(() => {
    const list = Array.from(new Set(stories.map((s) => s.district).filter(Boolean)));
    return list.sort();
  }, [stories]);

  // Save Edit
  const saveEditedStory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingStory) return;
    try {
      await saveStory(editingStory);
      setEditingStory(null);
      await fetchDatabaseData();
    } catch (err: any) {
      alert(err.message || 'Error updating story');
    }
  };

  // Delete Story
  const handleDeleteStory = async () => {
    if (!deletingStory) return;
    try {
      await deleteStory(deletingStory.id);
      setDeletingStory(null);
      await fetchDatabaseData();
    } catch (err: any) {
      alert(err.message || 'Error deleting story');
    }
  };

  // Set Access
  const setStoryAccess = async (story: ArchiveStory, access: Access) => {
    try {
      await saveStory({ ...story, access });
      await fetchDatabaseData();
    } catch (err: any) {
      alert(err.message || 'Error changing access level');
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(stories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lwm_oral_history_database_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Sutro', 'Title', 'Division', 'District', 'School', 'Collector', 'Respondent', 'Age', 'Relationship', 'Date Added'];
    const rows = stories.map((s) => [
      `"${s.id}"`,
      `"${s.archiveNumber || ''}"`,
      `"${(s.title || '').replace(/"/g, '""')}"`,
      `"${(s as any).division || ''}"`,
      `"${s.district || ''}"`,
      `"${(s.school || '').replace(/"/g, '""')}"`,
      `"${(s.collector || '').replace(/"/g, '""')}"`,
      `"${(s.respondent || '').replace(/"/g, '""')}"`,
      `"${s.respondentAge || ''}"`,
      `"${s.relationship || ''}"`,
      `"${(s as any).dateAdded || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `lwm_stories_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalCount = stats?.totalStories ?? totalStoriesCount ?? stories.length;
  const totalSchools = stats?.totalSchools ?? new Set(stories.map((s) => s.school)).size;
  const totalDistricts = stats?.totalDistricts ?? availableDistricts.length;
  const totalPhotos = stats?.totalPhotos ?? 0;

  return (
    <div className="min-h-screen bg-[#F2EEE5] flex flex-col lg:flex-row">
      <AdminSidebar active={activeNav} navigate={navigate} />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
          title={
            activeNav === 'By Location'
              ? 'Browse by Location'
              : activeNav === 'All Stories'
              ? 'All Stories'
              : activeNav === 'Database Explorer'
              ? 'Database Collections'
              : 'Archive Overview'
          }
          titleBn={
            activeNav === 'By Location'
              ? 'বিভাগ ও জেলা অনুযায়ী গল্প'
              : activeNav === 'All Stories'
              ? 'সংরক্ষিত সকল গল্প ও অনুসন্ধান'
              : activeNav === 'Database Explorer'
              ? 'ডেটাবেজ কালেকশন ও এক্সপোর্ট'
              : 'সংগ্রহশালার সারসংক্ষেপ'
          }
          backLabel={activeNav === 'Overview' ? t('Back to Public Site', 'পাবলিক সাইটে ফিরে যান') : t('Back to Overview', 'সারসংক্ষেপে ফিরে যান')}
          onBack={() => (activeNav === 'Overview' ? navigate('landing') : setActiveNav('Overview'))}
          onLogout={onLogout}
        />

        <main className="flex-1 p-5 sm:p-8 overflow-y-auto">
          {/* SECTION 1: OVERVIEW */}
          {activeNav === 'Overview' && (
            <div className="space-y-6">
              {/* Welcome banner */}
              <section className="relative overflow-hidden rounded-3xl bg-forest p-7 sm:p-9 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]">
                <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none"><div className="film-grain" /></div>
                <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-flag max-sm:hidden" />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-6 select-none text-[150px] sm:text-[190px] font-bold leading-none text-white/[0.06]" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>{t('1971', '১৯৭১')}</span>
                <div className="relative max-w-2xl">
                  {/* Database Live Status Badge */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-950/60 px-3.5 py-1 text-xs text-emerald-200 backdrop-blur-sm mb-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Database: <strong>{stats?.databaseType || 'Connected'}</strong></span>
                    <span className="text-emerald-400/60">|</span>
                    <span>{n(totalCount)} Stories Active</span>
                  </div>

                  <p className="font-display text-3xl sm:text-4xl font-semibold leading-tight">{t('Welcome back, Admin', 'স্বাগতম, অ্যাডমিন')}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/85">
                    {t(
                      `${totalCount} stories are in the database across ${totalDistricts} districts and ${totalSchools} schools. Categorized by Division and District.`,
                      `ডেটাবেজে বর্তমানে ${n(totalCount)}টি মৌখিক ইতিহাস সংরক্ষিত আছে (${n(totalDistricts)}টি জেলা ও ${n(totalSchools)}টি বিদ্যালয় থেকে)। বিভাগ ও জেলা অনুযায়ী সাজানো।`
                    )}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={() => setActiveNav('By Location')} className="inline-flex items-center gap-2 rounded-xl bg-flag px-5 py-2.5 text-sm font-semibold text-white hover:bg-flag-dark shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                      {t('Browse by Division & District', 'বিভাগ ও জেলা অনুযায়ী ব্রাউজ')}
                    </button>
                    <button onClick={() => navigate('upload')} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/85 hover:border-forest/60 hover:bg-white/[0.06] hover:text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                      {t('Upload New Stories', 'নতুন গল্প যোগ করুন')}
                    </button>
                    <button onClick={() => setActiveNav('Database Explorer')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500/30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                      {t('View Raw Database', 'ডেটাবেজ কালেকশন দেখুন')}
                    </button>
                  </div>
                </div>
              </section>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: t('Total Database Stories', 'ডেটাবেজের মোট গল্প'), value: totalCount, detail: t('Total verified testimonies', 'যাচাইকৃত মোট মৌখিক সাক্ষ্য') },
                  { label: t('Districts Represented', 'সংযুক্ত জেলাসমূহ'), value: totalDistricts, detail: t('Across 8 divisions', '৮টি বিভাগের আওতাধীন') },
                  { label: t('Participating Schools', 'অংশগ্রহণকারী বিদ্যালয়'), value: totalSchools, detail: t('Schools collected records', 'শিক্ষার্থী সংগ্রাহকদের প্রতিষ্ঠান') },
                  { label: t('School Album Photos', 'স্কুল ফটো অ্যালবাম'), value: totalPhotos, detail: t('Oral history campaign pictures', 'ক্যাম্পেইনের সংরক্ষিত ছবি') },
                ].map((stat) => (
                  <div key={stat.label} className="overflow-hidden rounded-2xl border border-line bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:border-forest/40 hover:shadow-[0_18px_40px_-20px_rgba(11,15,13,0.18)]">
                    <p className="text-xs font-semibold text-ink-muted">{stat.label}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-ink">
                      <CountUp value={String(stat.value)} />
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">{stat.detail}</p>
                  </div>
                ))}
              </div>

              {/* Division Breakdown Grid */}
              <div className="rounded-3xl border border-line bg-white p-6 shadow-xs">
                <h3 className="font-display text-lg font-bold text-ink mb-4">{t('Stories Categorized by Division', 'বিভাগ অনুযায়ী মৌখিক ইতিহাসের সংগ্রহ')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {DIVISIONS.map((div) => {
                    const count = stats?.divisionCounts?.[div] ?? stories.filter((s) => (s as any).division === div).length;
                    return (
                      <button
                        key={div}
                        onClick={() => {
                          setDivisionFilter(div);
                          setDistrictFilter('');
                          setActiveNav('By Location');
                        }}
                        className="flex flex-col items-start p-4 rounded-2xl border border-line bg-surface hover:border-forest hover:bg-forest-pale/40 transition-all text-left group"
                      >
                        <span className="text-xs text-ink-muted font-medium group-hover:text-forest-deep">{div}</span>
                        <span className="mt-2 text-2xl font-bold text-ink group-hover:text-forest">{n(count)}</span>
                        <span className="text-[11px] text-ink-faint mt-1">{bn ? 'ক্লিক করে দেখুন →' : 'Click to explore →'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: BROWSE BY DIVISION & DISTRICT */}
          {activeNav === 'By Location' && (
            <div className="space-y-6">
              {/* Division Selector Tabs */}
              <div className="rounded-3xl border border-line bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-ink mb-3" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                  {bn ? '১. বিভাগ নির্বাচন করুন:' : '1. Select Division:'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setDivisionFilter('');
                      setDistrictFilter('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                      !divisionFilter
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-surface text-ink-muted hover:bg-forest-pale hover:text-ink'
                    }`}
                  >
                    {bn ? 'সকল বিভাগ (All Divisions)' : 'All Divisions'}
                  </button>
                  {DIVISIONS.map((div) => {
                    const isSelected = divisionFilter === div;
                    const count = stats?.divisionCounts?.[div] ?? 0;
                    return (
                      <button
                        key={div}
                        onClick={() => {
                          setDivisionFilter(div);
                          setDistrictFilter('');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-forest text-white shadow-xs'
                            : 'bg-surface text-ink-muted hover:bg-forest-pale hover:text-ink'
                        }`}
                      >
                        <span>{div}</span>
                        {count > 0 && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-line text-ink-muted'}`}>
                            {n(count)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* District Pills for Selected Division */}
                <div className="mt-6 pt-5 border-t border-line">
                  <h4 className="text-sm font-bold text-ink mb-3" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                    {bn ? '২. জেলা নির্বাচন করুন (বাছাইকৃত গল্প দেখতে):' : '2. Select District to view stories:'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDistrictFilter('')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        !districtFilter ? 'bg-flag text-white' : 'bg-surface border border-line text-ink-muted hover:bg-surface-raised'
                      }`}
                    >
                      {bn ? 'এই বিভাগের সকল জেলা' : 'All Districts'}
                    </button>
                    {availableDistricts.map((dist) => {
                      const count = stories.filter((s) => s.district === dist).length;
                      const isSelected = districtFilter === dist;
                      return (
                        <button
                          key={dist}
                          onClick={() => setDistrictFilter(dist)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-flag text-white shadow-xs'
                              : 'bg-white border border-line text-ink hover:border-forest/50 hover:bg-forest-pale/20'
                          }`}
                        >
                          <span style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>{dist}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-forest-pale text-forest-deep'}`}>
                            {n(count)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stories from Selected Location */}
              <div className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
                <div className="p-4 bg-surface flex flex-wrap items-center justify-between gap-3 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {districtFilter
                        ? `${districtFilter} জেলার গল্পসমূহ (${n(stories.length)}টি)`
                        : divisionFilter
                        ? `${divisionFilter}-এর গল্পসমূহ (${n(stories.length)}টি)`
                        : `সকল গল্প (${n(stories.length)}টি)`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportJson}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface"
                    >
                      <svg className="w-3.5 h-3.5 text-forest" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {t('Export JSON', 'JSON এক্সপোর্ট')}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left text-xs">
                    <thead className="bg-surface-raised font-semibold text-ink-muted border-b border-line">
                      <tr>
                        <th className="px-5 py-3">{t('Archive ID', 'সূত্র নম্বর')}</th>
                        <th className="px-5 py-3">{t('Title', 'শিরোনাম')}</th>
                        <th className="px-5 py-3">{t('Witness / Narrator', 'বর্ণনাকারী')}</th>
                        <th className="px-5 py-3">{t('Collector & School', 'সংগ্রাহক ও বিদ্যালয়')}</th>
                        <th className="px-5 py-3">{t('District', 'জেলা')}</th>
                        <th className="px-5 py-3 text-right">{t('Action', 'অ্যাকশন')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {stories.slice(0, 100).map((story) => (
                        <tr key={story.id} className="hover:bg-gold-pale/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-forest-deep">{story.archiveNumber || story.id}</td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => navigate('story', { storyRecord: story, storyId: story.id })}
                              className="font-bold text-ink hover:text-forest text-left line-clamp-1"
                            >
                              {story.title}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-ink-soft">
                            <span className="font-semibold">{story.respondent || 'তথ্য নেই'}</span>
                            {story.relationship && <span className="text-ink-faint ml-1">({story.relationship})</span>}
                          </td>
                          <td className="px-5 py-3.5 text-ink-soft">
                            <p className="font-semibold">{story.collector}</p>
                            <p className="text-[11px] text-ink-muted">{story.school}</p>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-ink">{story.district}</td>
                          <td className="px-5 py-3.5 text-right space-x-1">
                            <button
                              onClick={() => setInspectingStory(story)}
                              className="px-2.5 py-1 rounded bg-surface border border-line text-ink-muted hover:text-ink font-semibold"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => setEditingStory(story)}
                              className="px-2.5 py-1 rounded bg-white border border-line text-forest font-semibold hover:bg-forest-pale"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: ALL STORIES / ADVANCED TABLE */}
          {activeNav === 'All Stories' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="rounded-2xl border border-line bg-white p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('Search by Title, Sutro, Collector, Narrator, School, District...', 'শিরোনাম, সূত্র নম্বর, সংগ্রাহক, বর্ণনাকারী বা জেলা দিয়ে খুঁজুন...')}
                      className="w-full rounded-xl border border-line bg-surface pl-10 pr-4 py-2 text-sm text-ink outline-none focus:border-forest focus:bg-white"
                      style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={divisionFilter}
                      onChange={(e) => {
                        setDivisionFilter(e.target.value);
                        setDistrictFilter('');
                      }}
                      className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink outline-none"
                    >
                      <option value="">{t('All Divisions', 'সকল বিভাগ')}</option>
                      {DIVISIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink outline-none"
                    >
                      <option value="">{t('All Districts', 'সকল জেলা')}</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <select
                      value={accessFilter}
                      onChange={(e) => setAccessFilter(e.target.value)}
                      className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink outline-none"
                    >
                      <option value="all">{t('All Access', 'সকল প্রবেশাধিকার')}</option>
                      <option value="public">{t('Public Only', 'উন্মুক্ত')}</option>
                      <option value="restricted">{t('Restricted Only', 'সীমাবদ্ধ')}</option>
                    </select>

                    <button
                      onClick={() => navigate('upload')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-xs font-semibold text-white hover:bg-forest-deep"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                      {t('Add Stories', 'গল্প যোগ করুন')}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line/60">
                  <span>
                    {bn ? `মোট ${n(totalStoriesCount)}টি গল্পের মধ্যে ${n(stories.length)}টি প্রদর্শিত হচ্ছে` : `Showing ${stories.length} of ${totalStoriesCount} stories`}
                  </span>
                  <div className="space-x-2">
                    <button onClick={handleExportJson} className="hover:underline text-forest font-semibold">{t('Download JSON', 'JSON ডাউনলোড')}</button>
                    <span>·</span>
                    <button onClick={handleExportCsv} className="hover:underline text-forest font-semibold">{t('Download CSV', 'CSV ডাউনলোড')}</button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-xs">
                <table className="w-full min-w-[1100px] text-left text-xs">
                  <thead className="bg-surface text-ink-muted font-semibold border-b border-line">
                    <tr>
                      <th className="px-5 py-3.5">{t('Archive ID / Sutro', 'সূত্র নম্বর')}</th>
                      <th className="px-5 py-3.5">{t('Title', 'শিরোনাম')}</th>
                      <th className="px-5 py-3.5">{t('Witness / Narrator', 'বর্ণনাকারী')}</th>
                      <th className="px-5 py-3.5">{t('Collector & School', 'সংগ্রাহক ও বিদ্যালয়')}</th>
                      <th className="px-5 py-3.5">{t('District', 'জেলা')}</th>
                      <th className="px-5 py-3.5">{t('Access', 'প্রবেশাধিকার')}</th>
                      <th className="px-5 py-3.5 text-right">{t('Manage', 'ব্যবস্থাপনা')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                    {stories.map((story) => (
                      <tr key={story.id} className="hover:bg-gold-pale/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-forest-deep">{story.archiveNumber || story.id}</td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <button
                            onClick={() => navigate('story', { storyRecord: story, storyId: story.id })}
                            className="font-bold text-ink hover:text-forest text-left line-clamp-1"
                          >
                            {story.title}
                          </button>
                          <p className="text-[10px] text-ink-faint mt-0.5">{formatDate((story as any).dateAdded, lang)}</p>
                        </td>
                        <td className="px-5 py-3.5 text-ink-soft">
                          <p className="font-semibold">{story.respondent || 'তথ্য নেই'}</p>
                          {story.relationship && <p className="text-[10px] text-ink-faint">({story.relationship})</p>}
                        </td>
                        <td className="px-5 py-3.5 text-ink-soft">
                          <p className="font-semibold">{story.collector}</p>
                          <p className="text-[11px] text-ink-muted">{story.school}</p>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-ink">{story.district}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={(story as any).access || 'public'}
                            onChange={(e) => setStoryAccess(story, e.target.value as Access)}
                            className={`rounded-full border py-0.5 px-2.5 text-[11px] font-semibold outline-none ${
                              (story as any).access === 'restricted'
                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            <option value="public">{t('Public', 'উন্মুক্ত')}</option>
                            <option value="restricted">{t('Restricted', 'সীমাবদ্ধ')}</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => setInspectingStory(story)}
                            className="px-2 py-1 rounded bg-surface border border-line text-ink-muted hover:text-ink font-semibold"
                          >
                            JSON
                          </button>
                          <button
                            onClick={() => setEditingStory(story)}
                            className="px-2 py-1 rounded bg-white border border-line text-forest font-semibold hover:bg-forest-pale"
                          >
                            {t('Edit', 'সম্পাদনা')}
                          </button>
                          <button
                            onClick={() => setDeletingStory(story)}
                            className="px-2 py-1 rounded bg-white border border-transparent text-rose-600 font-semibold hover:bg-rose-50"
                          >
                            {t('Delete', 'মুছুন')}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {stories.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-ink-muted">
                          {t('No stories found matching your filter criteria.', 'কোনো গল্প মেলেনি।')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: DATABASE & COLLECTIONS EXPLORER */}
          {activeNav === 'Database Explorer' && (
            <div className="space-y-6">
              {/* Database Overview Card */}
              <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active Database: {stats?.databaseType}
                    </div>
                    <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {bn ? 'মৌখিক ইতিহাস ডেটাবেজ ও কালেকশন এক্সপ্লোরার' : 'Oral History Database & Collections'}
                    </h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      {bn
                        ? 'আপনার সম্পূর্ণ ডেটাবেজ কালেকশন নিচে দেখতে ও সরাসরি JSON/CSV আকারে ডাউনলোড করতে পারবেন।'
                        : 'Inspect your active database tables, physical file path, and download the entire collection.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleExportJson}
                      className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-forest-deep"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {t('Export All as JSON', 'সম্পূর্ণ ডেটাবেজ JSON ডাউনলোড')}
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-xs hover:bg-surface"
                    >
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {t('Export Stories CSV', 'CSV এক্সপোর্ট')}
                    </button>
                  </div>
                </div>

                {/* Database Info Cards */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <p className="font-bold text-ink-muted">{bn ? 'সিস্টেম ডেটাবেজ টাইপ' : 'Active Engine'}</p>
                    <p className="mt-1 text-sm font-bold text-ink">{stats?.databaseType}</p>
                    <p className="mt-1 text-ink-faint">
                      {stats?.databaseType?.includes('SQLite')
                        ? 'Embedded Node 24 native high-performance database'
                        : 'Cloud Managed PostgreSQL'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <p className="font-bold text-ink-muted">{bn ? 'ফিজিক্যাল ফাইল লোকেশন' : 'Database Location'}</p>
                    <p className="mt-1 text-xs font-mono text-forest-deep break-all">data/lwm_oral_history.db</p>
                    <p className="mt-1 text-ink-faint">{bn ? 'আপনার লোকাল ফোল্ডারে সংরক্ষিত' : 'Stored locally on your disk'}</p>
                  </div>

                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <p className="font-bold text-ink-muted">{bn ? 'সংরক্ষিত কালেকশন' : 'Collections Count'}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">{num(totalCount, lang)} Stories Ingested</p>
                    <p className="mt-1 text-ink-faint">{num(totalPhotos, lang)} School Photos Attached</p>
                  </div>
                </div>
              </div>

              {/* Raw Collection JSON Viewer */}
              <div className="rounded-3xl border border-line bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-ink" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                    {bn ? 'লাইভ ডেটাবেজ কালেকশন প্রিভিউ (Live JSON Items)' : 'Live Database JSON Records'}
                  </h3>
                  <span className="text-xs text-ink-muted font-mono">{stories.length} records loaded</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto rounded-2xl bg-slate-900 p-5 font-mono text-xs text-emerald-400">
                  <pre>{JSON.stringify(stories.slice(0, 5), null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* JSON Inspection Modal */}
      {inspectingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="text-sm font-mono text-emerald-400 font-bold">{inspectingStory.id}</span>
              <button onClick={() => setInspectingStory(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <pre className="mt-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(inspectingStory, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Edit Story Modal */}
      {editingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <form onSubmit={saveEditedStory} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl font-bold text-ink">{t('Edit Story in Database', 'ডেটাবেজের গল্প সম্পাদনা')}</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-ink-muted">
                {t('Title', 'শিরোনাম')}
                <input
                  value={editingStory.title}
                  onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-ink-muted">
                  {t('Respondent', 'বর্ণনাকারী')}
                  <input
                    value={editingStory.respondent}
                    onChange={(e) => setEditingStory({ ...editingStory, respondent: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold text-ink-muted">
                  {t('Collector', 'সংগ্রাহক')}
                  <input
                    value={editingStory.collector}
                    onChange={(e) => setEditingStory({ ...editingStory, collector: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-ink-muted">
                  {t('School', 'বিদ্যালয়')}
                  <input
                    value={editingStory.school}
                    onChange={(e) => setEditingStory({ ...editingStory, school: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold text-ink-muted">
                  {t('District', 'জেলা')}
                  <input
                    value={editingStory.district}
                    onChange={(e) => setEditingStory({ ...editingStory, district: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-ink-muted">
                {t('Full Story Content', 'গল্পের পূর্ণ বিবরণ')}
                <textarea
                  rows={8}
                  value={editingStory.content}
                  onChange={(e) => setEditingStory({ ...editingStory, content: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-line bg-surface p-2.5 text-sm text-ink outline-none"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setEditingStory(null)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink-muted"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-forest px-5 py-2 text-xs font-semibold text-white hover:bg-forest-deep"
              >
                {t('Save Changes', 'সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
            <h2 className="font-display text-xl font-bold text-ink">{t('Delete story from database?', 'ডেটাবেজ থেকে গল্পটি মুছবেন?')}</h2>
            <p className="mt-2 text-sm text-ink-muted">“{deletingStory.title}”</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeletingStory(null)}
                className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-muted"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                onClick={handleDeleteStory}
                className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
              >
                {t('Confirm Delete', 'মুছে ফেলুন')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
