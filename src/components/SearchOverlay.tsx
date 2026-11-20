import { useState, useEffect, useRef } from 'react';
import { useLang } from '../i18n';

interface SearchOverlayProps {
  onClose: () => void;
  onSearch: (query: string) => void;
}

const suggestions = [
  { label: 'People', labelBn: 'ব্যক্তি', icon: 'person', example: 'নুরজাহান বেগম' },
  { label: 'Schools', labelBn: 'বিদ্যালয়', icon: 'school', example: 'বীরশ্রেষ্ঠ শহীদ রুহুল আমিন একাডেমী' },
  { label: 'Locations', labelBn: 'স্থান', icon: 'place', example: 'বাগেরহাট, রাজশাহী, সিলেট' },
  { label: 'Stories', labelBn: 'গল্প', icon: 'story', example: 'সবচেয়ে বড় যুদ্ধ' },
];

// Line icons in the site's stroke style (no emoji).
const ICON_PATHS: Record<string, string> = {
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  school: 'M3 10 12 5l9 5-9 5-9-5Zm4 2v5c3 2 7 2 10 0v-5',
  place: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  story: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM8 8h8M8 12h5',
};

export default function SearchOverlay({ onClose, onSearch }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLang();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div
      className="overlay-fade fixed inset-0 z-50 bg-forest-deep/90 backdrop-blur-md flex flex-col items-center justify-start pt-[15vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="overlay-pop w-full max-w-2xl">
        {/* Search form */}
        <form onSubmit={handleSubmit} className="relative mb-8">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search the Oral History archive...', 'মৌখিক ইতিহাস আর্কাইভে খুঁজুন...')}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 focus:border-forest/60 rounded-2xl pl-14 pr-28 py-4 text-white placeholder-white/30 text-lg outline-none transition-colors"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close', 'বন্ধ করুন')}
            className="absolute right-20 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-forest hover:bg-forest-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            {t('Go', 'খুঁজুন')}
          </button>
        </form>

        {/* Suggestions */}
        <div>
          <p className="text-white/70 text-[11px] font-semibold tracking-[0.2em] uppercase mb-4 text-center">
            {t('Popular ways to search', 'যেভাবে খুঁজতে পারেন')}
          </p>
          <div className="overlay-stagger grid grid-cols-2 gap-3">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => onSearch(s.example)}
                className="bg-white/8 hover:bg-white/15 border border-white/10 hover:border-forest/40 hover:-translate-y-0.5 text-white text-left rounded-2xl p-4 transition-all group"
              >
                <svg aria-hidden="true" className="mb-3 h-5 w-5 text-gold-bright" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={ICON_PATHS[s.icon]} /></svg>
                <p className="font-semibold text-sm text-white/80 group-hover:text-white">{t(s.label, s.labelBn)}</p>
                <p className="text-white/65 text-xs mt-0.5 truncate">{s.example}</p>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          {t('Press Esc to close', 'বন্ধ করতে Esc চাপুন')}
        </p>
      </div>
    </div>
  );
}
