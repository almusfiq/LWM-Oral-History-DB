import { useEffect, useRef } from 'react';
import type { AccountType, Page } from '../App';
import MuseumBrand from './MuseumBrand';

/** The Liberation War Museum's main website, of which Oral History is a section. */
import { LangToggle, useLang } from '../i18n';

interface NavProps {
  currentPage: Page;
  isLoggedIn: boolean;
  accountType?: AccountType;
  onNavigate: (page: Page) => void;
  onSearchOpen: () => void;
  onLogout: () => void;
  onCollection: () => void;
  onAdminPanel: () => void;
}

export default function Nav({ isLoggedIn, accountType, onNavigate, onLogout, onCollection, onAdminPanel }: NavProps) {
  const { t } = useLang();
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Written straight to the DOM so scrolling never re-renders the nav.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      if (headerRef.current) headerRef.current.dataset.scrolled = String(window.scrollY > 8);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
    <header ref={headerRef} className="bg-surface-raised/95 backdrop-blur-md border-b border-line sticky top-0 z-40 transition-shadow duration-500">
      {/* The flag in a line: a green stripe with a short red segment above the museum name */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-forest">
        <span className="absolute left-1/2 top-0 h-full w-16 -translate-x-1/2 bg-flag sm:w-24" />
      </div>
      <div ref={progressRef} aria-hidden="true" className="nav-progress absolute left-0 right-0 -bottom-px h-[2px] bg-flag" />
      <div className="px-4 sm:px-8 lg:px-10">
        {/* Logo at the far left, museum name centred (beside the logo on phones), actions at the right. */}
        <div className="relative flex items-center gap-2 h-16 pt-1 sm:gap-3 sm:h-[76px] sm:grid sm:grid-cols-[1fr_auto_1fr]">

          <button onClick={() => onNavigate('landing')} aria-label={t('Liberation War Museum home', 'মুক্তিযুদ্ধ জাদুঘর প্রথম পাতা')} className="shrink-0 sm:col-start-1 sm:justify-self-start hover:scale-[1.04] active:scale-[0.98] duration-300">
            <img src="/lwm-logo-black.png" alt="" className="h-10 w-12 sm:h-14 sm:w-[4.5rem] lg:h-16 lg:w-20 object-contain" />
          </button>

          <button onClick={() => onNavigate('landing')} tabIndex={-1} aria-hidden="true" className="min-w-0 mr-auto sm:mr-0 sm:col-start-2 sm:row-start-1 sm:justify-self-center text-center hover:scale-[1.03] active:scale-[0.98] duration-300">
            <MuseumBrand compact logo={false} />
          </button>

          <div className="shrink-0 flex items-center gap-2 sm:gap-3 sm:col-start-3 sm:row-start-1 sm:justify-self-end">
            <LangToggle />
            {isLoggedIn ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <span className="hidden md:inline text-xs text-ink-muted">
                  {accountType === 'admin' ? t('Admin account', 'অ্যাডমিন অ্যাকাউন্ট') : accountType === 'official' ? t('Official account', 'অফিসিয়াল অ্যাকাউন্ট') : t('Public account', 'পাবলিক অ্যাকাউন্ট')}
                </span>
                {accountType === 'admin' && (
                  <button
                    onClick={onAdminPanel}
                    aria-label={t('Admin Panel', 'অ্যাডমিন প্যানেল')}
                    className="whitespace-nowrap p-2 sm:px-4 sm:py-2 rounded-xl border border-forest bg-forest text-white text-[13px] font-semibold hover:bg-forest-dark hover:border-forest-dark active:translate-y-px transition-colors"
                  >
                    <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><rect x={3} y={3} width={7} height={9} rx={2} /><rect x={14} y={3} width={7} height={5} rx={2} /><rect x={14} y={12} width={7} height={9} rx={2} /><rect x={3} y={16} width={7} height={5} rx={2} /></svg>
                    <span className="hidden sm:inline">{t('Admin Panel', 'অ্যাডমিন প্যানেল')}</span>
                  </button>
                )}
                {(accountType === 'public' || accountType === 'official') && (
                  <button onClick={onCollection} aria-label={t('My Collection', 'আমার সংগ্রহ')} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl p-2 sm:p-0 text-[13px] font-medium text-ink hover:text-forest transition-colors">
                    <svg className="h-5 w-5 sm:hidden" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z" strokeLinejoin="round" /></svg>
                    <span className="hidden sm:inline">{t('My Collection', 'আমার সংগ্রহ')}</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  aria-label={t('Sign out', 'সাইন আউট')}
                  className="whitespace-nowrap p-2 sm:px-4 sm:py-2 rounded-xl border border-forest bg-forest text-white text-[13px] font-semibold hover:bg-forest-dark hover:border-forest-dark active:translate-y-px transition-colors"
                >
                  <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="hidden sm:inline">{t('Sign out', 'সাইন আউট')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl border border-flag bg-flag text-white text-[13px] font-semibold hover:bg-flag-dark hover:border-flag-dark active:translate-y-px transition-colors"
              >
                {t('Sign in', 'সাইন ইন')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
}

