import { LangToggle, useLang } from '../i18n';

interface AdminTopbarProps {
  title: string;
  titleBn: string;
  backLabel: string;
  onBack: () => void;
  onLogout: () => void;
}

/** Shared header for the admin screens: page title on the left, navigation and sign-out on the right. */
export default function AdminTopbar({ title, titleBn, backLabel, onBack, onLogout }: AdminTopbarProps) {
  const { t, lang } = useLang();
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-[#FAF8F3]/85 backdrop-blur-md px-5 sm:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl sm:text-[28px] font-semibold text-ink leading-tight">{lang === 'bn' ? titleBn : title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <LangToggle />
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink-muted hover:border-forest/60 hover:text-forest-deep hover:shadow-[0_6px_16px_-10px_rgba(11,15,13,0.18)]"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {backLabel}
        </button>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-xl bg-forest-deep px-4 py-2 text-sm font-semibold text-white hover:bg-forest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('Sign out', 'সাইন আউট')}
        </button>
      </div>
    </header>
  );
}
