import { useEffect, useRef, useState, Component, type ReactNode } from 'react';
import Nav from './components/Nav';
import SearchOverlay from './components/SearchOverlay';
import LandingPage from './pages/LandingPage';
import SearchResultsPage from './pages/SearchResultsPage';
import LocationBrowsePage from './pages/LocationBrowsePage';
import StoryPage from './pages/StoryPage';
import RestrictedPage from './pages/RestrictedPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UploadPage from './pages/UploadPage';
import { stories, type ArchiveStory } from './data/stories';
import useReveal from './utils/useReveal';
import useMotion from './utils/useMotion';
import Preloader from './components/Preloader';
import { useLang } from './i18n';

export type Page =
  | 'landing'
  | 'search'
  | 'location-browse'
  | 'location-detail'
  | 'story'
  | 'restricted'
  | 'login'
  | 'admin-login'
  | 'collection'
  | 'admin'
  | 'upload';

export type AccountType = 'public' | 'official' | 'admin';

export interface SavedStory {
  id: string;
  title: string;
  respondent: string;
  location: string;
}

const COLLECTION_KEY = 'lwm-public-collection';
const ADMIN_PAGES: Page[] = ['admin-login', 'admin', 'upload'];

function readCollection(): SavedStory[] {
  try {
    return JSON.parse(localStorage.getItem(COLLECTION_KEY) ?? '[]') as SavedStory[];
  } catch {
    return [];
  }
}

export interface NavContext {
  page: Page;
  query?: string;
  /** A hand-picked list of stories shown on the search page, with its heading. */
  storyIds?: string[];
  listTitle?: string;
  listTitleBn?: string;
  storyRestricted?: boolean;
  storyId?: string;
  storyRecord?: ArchiveStory;
  locationDivisionId?: string;
  locationDistrictId?: string;
  isLoggedIn?: boolean;
  accountType?: AccountType;
  adminSection?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Admin UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F2EEE5] p-8 flex flex-col items-center justify-center text-center">
          <div className="max-w-md bg-white p-6 rounded-3xl border border-line shadow-xl">
            <h2 className="text-xl font-bold text-rose-700">Something went wrong loading Admin</h2>
            <p className="mt-2 text-xs font-mono text-ink-muted bg-surface p-3 rounded-xl overflow-x-auto text-left">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-4 px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl"
            >
              Reload Admin Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [ctx, setCtx] = useState<NavContext>(() => window.history.state?.lwmNav ?? { page: window.location.pathname.startsWith('/admin') ? 'admin-login' : 'landing', isLoggedIn: false });
  const [searchOpen, setSearchOpen] = useState(false);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const mainRef = useRef<HTMLElement>(null);
  const { t } = useLang();
  useReveal(mainRef, ctx.page);
  useMotion(mainRef, ctx.page);

  const toggleSavedStory = (story: SavedStory) => {
    setSavedStories((current) => {
      const next = current.some((saved) => saved.id === story.id)
        ? current.filter((saved) => saved.id !== story.id)
        : [...current, story];
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
      return next;
    });
  };

  const navigate = (page: Page, opts?: Partial<NavContext>) => {
    const nextContext = { ...ctx, page, ...opts, storyRecord: page === 'story' ? opts?.storyRecord : undefined, storyIds: opts?.storyIds, listTitle: opts?.listTitle, listTitleBn: opts?.listTitleBn };
    // Admin screens live at /admin; everything else at the site root.
    window.history.pushState({ lwmNav: nextContext }, '', ADMIN_PAGES.includes(page) ? '/admin' : '/');
    setCtx(nextContext);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const initialContext = window.history.state?.lwmNav ?? ctx;
    window.history.replaceState({ lwmNav: initialContext }, '', window.location.href);
    const restoreAppPage = (event: PopStateEvent) => {
      setCtx(event.state?.lwmNav ?? { page: 'landing', isLoggedIn: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', restoreAppPage);
    return () => window.removeEventListener('popstate', restoreAppPage);
  }, []);

  const isAdmin = ADMIN_PAGES.includes(ctx.page);
  const isLogin = ctx.page === 'login';
  const isSignedInAdmin = ctx.isLoggedIn === true && ctx.accountType === 'admin';
  const handleLogin = (accountType: AccountType) => {
    setSavedStories(accountType === 'public' ? readCollection() : []);
    navigate(accountType === 'admin' ? 'admin' : 'landing', { isLoggedIn: true, accountType });
  };

  return (
    <div className="min-h-full flex flex-col bg-parchment">
      <Preloader />
      {!isAdmin && !isLogin && (
        <Nav
          currentPage={ctx.page}
          isLoggedIn={ctx.isLoggedIn ?? false}
          accountType={ctx.accountType}
          onNavigate={navigate}
          onLogout={() => navigate('landing', { isLoggedIn: false, accountType: undefined })}
          onCollection={() => navigate('collection')}
          onAdminPanel={() => navigate('admin', { adminSection: 'Overview' })}
          onSearchOpen={() => setSearchOpen(true)}
        />
      )}

      <main ref={mainRef} key={ctx.page} className="flex-1 page-enter">
        {ctx.page === 'landing' && <LandingPage navigate={navigate} onSearchOpen={() => setSearchOpen(true)} />}
        {ctx.page === 'search' && (
          <SearchResultsPage
            navigate={navigate}
            initialQuery={ctx.query ?? ''}
            storyList={ctx.storyIds ? { ids: ctx.storyIds, title: ctx.listTitle ?? '', titleBn: ctx.listTitleBn ?? '' } : undefined}
            canBookmark={ctx.isLoggedIn === true && (ctx.accountType === 'public' || ctx.accountType === 'official')}
            savedStories={savedStories}
            onToggleBookmark={toggleSavedStory}
          />
        )}
        {/* A division or district opens on the map page, zoomed to it, with its stories listed. */}
        {(ctx.page === 'location-browse' || ctx.page === 'location-detail') && (
          <LocationBrowsePage
            key={`${ctx.locationDivisionId ?? ''}-${ctx.locationDistrictId ?? ''}`}
            navigate={navigate}
            initialDivisionId={ctx.page === 'location-detail' ? ctx.locationDivisionId : undefined}
            initialDistrictId={ctx.page === 'location-detail' ? ctx.locationDistrictId : undefined}
          />
        )}
        {ctx.page === 'story' && !ctx.storyRestricted && (
          (() => {
            const story = ctx.storyRecord ?? stories.find((item) => item.id === ctx.storyId) ?? stories[0];
            return (
          <StoryPage
            navigate={navigate}
            storyId={story.id}
            storyOverride={ctx.storyRecord}
            canBookmark={ctx.isLoggedIn === true && (ctx.accountType === 'public' || ctx.accountType === 'official')}
            isBookmarked={savedStories.some((saved) => saved.id === story.id)}
            onToggleBookmark={() => toggleSavedStory({ id: story.id, title: story.title, respondent: story.respondent, location: story.district })}
          />
            );
          })()
        )}
        {ctx.page === 'story' && ctx.storyRestricted && <RestrictedPage navigate={navigate} />}
        {ctx.page === 'restricted' && <RestrictedPage navigate={navigate} />}
        {ctx.page === 'login' && (
          <LoginPage navigate={navigate} onLogin={handleLogin} />
        )}
        {/* Admin screens open only for a signed-in admin; anyone else gets the admin sign-in. */}
        {isAdmin && !isSignedInAdmin && <LoginPage key="admin-login" variant="admin" navigate={navigate} onLogin={handleLogin} />}
        {ctx.page === 'collection' && ctx.isLoggedIn && (ctx.accountType === 'public' || ctx.accountType === 'official') && (
          <section className="bg-surface min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
              <button onClick={() => navigate('landing')} className="text-sm text-gold hover:underline mb-4">
                ← {t('Back to archive', 'আর্কাইভে ফিরে যান')}
              </button>
              <h1 className="font-serif text-3xl font-semibold text-ink">{t('My Collection', 'আমার সংগ্রহ')}</h1>
              <p className="text-sm text-ink-muted mt-2">{t('Stories you saved with your Public account.', 'আপনার পাবলিক অ্যাকাউন্টে সংরক্ষিত গল্পগুলো।')}</p>
              {savedStories.length === 0 ? (
                <div className="mt-8 p-8 text-center bg-surface-raised border border-line rounded-2xl">
                  <p className="font-semibold text-ink">{t('Your collection is empty', 'আপনার সংগ্রহ এখনো খালি')}</p>
                  <p className="text-sm text-ink-muted mt-1">{t('Save a story while browsing to find it here.', 'গল্প পড়ার সময় সংরক্ষণ করলে এখানে পাবেন।')}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  {savedStories.map((story) => (
                    <article key={story.id} className="bg-surface-raised border border-line rounded-2xl p-5">
                      <h2 className="font-semibold text-ink">{story.title}</h2>
                      <p className="text-sm text-ink-muted mt-1">{story.respondent} · {story.location}</p>
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => navigate('story')} className="text-sm text-gold font-semibold">{t('Read story', 'গল্পটি পড়ুন')}</button>
                        <button onClick={() => toggleSavedStory(story)} className="text-sm text-ink-muted hover:text-ink">{t('Remove', 'সরিয়ে দিন')}</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        {ctx.page === 'collection' && !(ctx.isLoggedIn && (ctx.accountType === 'public' || ctx.accountType === 'official')) && (
          <section className="bg-surface min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md text-center bg-surface-raised border border-line rounded-2xl p-8">
              <h1 className="font-serif text-2xl font-semibold text-ink">{t('My Collection', 'আমার সংগ্রহ')}</h1>
              <p className="text-sm text-ink-muted mt-2">{t('Sign in with a Public account to view your saved stories.', 'সংরক্ষিত গল্প দেখতে পাবলিক অ্যাকাউন্টে সাইন ইন করুন।')}</p>
              <button onClick={() => navigate('login')} className="mt-5 bg-forest text-white font-semibold px-5 py-2.5 rounded-xl">
                {t('Sign in', 'সাইন ইন')}
              </button>
            </div>
          </section>
        )}
        {ctx.page === 'admin' && isSignedInAdmin && (
          <AdminErrorBoundary>
            <AdminPage navigate={navigate} onLogout={() => navigate('landing', { isLoggedIn: false, accountType: undefined })} initialSection={ctx.adminSection} />
          </AdminErrorBoundary>
        )}
        {ctx.page === 'upload' && isSignedInAdmin && (
          <AdminErrorBoundary>
            <UploadPage navigate={navigate} onLogout={() => navigate('landing', { isLoggedIn: false, accountType: undefined })} />
          </AdminErrorBoundary>
        )}
      </main>


      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onSearch={(q) => {
            setSearchOpen(false);
            navigate('search', { query: q });
          }}
        />
      )}
    </div>
  );
}
