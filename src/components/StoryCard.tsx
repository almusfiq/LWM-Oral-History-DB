import type { SavedStory } from '../App';
import { useLang } from '../i18n';

interface StoryCardProps {
  title: string;
  collector: string;
  respondent: string;
  location: string;
  excerpt: string;
  access: 'public' | 'restricted';
  onRead: () => void;
  onRestricted?: () => void;
  compact?: boolean;
  storyId?: string;
  canBookmark?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (story: SavedStory) => void;
  onSignIn?: () => void;
  onLocationClick?: () => void;
}

export default function StoryCard({
  title, collector: collectorName, respondent: respondentName, location,
  excerpt, access, onRead, onRestricted, compact = false,
  storyId = title, canBookmark = false, isBookmarked = false, onToggleBookmark, onSignIn, onLocationClick,
}: StoryCardProps) {
  const { t } = useLang();
  const handleClick = () => {
    if (access === 'restricted' && onRestricted) onRestricted();
    else onRead();
  };

  return (
    <article
      data-tilt="5"
      className="group bg-surface-raised rounded-2xl border border-line hover:border-forest/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgba(11,15,13,0.18)] transition-all duration-500 flex flex-col overflow-hidden cursor-pointer"
      style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
      onClick={handleClick}
    >
      {/* Top accent */}
      <div className={`h-0.5 origin-left transition-all duration-500 ${access === 'restricted' ? 'bg-line' : 'bg-forest/70 group-hover:h-1 group-hover:bg-forest'}`} />

      <div className={`flex flex-col flex-1 ${compact ? 'p-4' : 'p-5 sm:p-6'}`}>
        {/* Title */}
        <h3 className={`font-semibold text-ink leading-snug group-hover:text-forest-deep transition-colors mb-1 ${compact ? 'text-base' : 'text-[17px]'}`} style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
          {title}
        </h3>

        {/* Divider */}
        <div className="w-8 h-px bg-line my-3" />

        {/* Respondent and collector */}
        <dl className="mb-4 min-h-10 space-y-0.5 text-[12px] text-ink-soft" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
          <div><dt className="inline">{t('Respondent', 'বর্ণনাকারী')}: </dt><dd className="inline font-bold">{respondentName}</dd></div>
          <div><dt className="inline">{t('Collector', 'সংগ্রাহক')}: </dt><dd className="inline font-bold">{collectorName}</dd></div>
        </dl>
        {/* Location pill */}
        <button type="button" onClick={(event) => { if (onLocationClick) { event.stopPropagation(); onLocationClick(); } }} className={`flex items-center gap-1.5 mb-4 text-left ${onLocationClick ? 'hover:text-forest' : ''}`}>
          <svg className="w-3 h-3 text-flag flex-shrink-0 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-125" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-[12px] text-gold font-medium">{location}</span>
        </button>

        {/* Excerpt */}
        {!compact && (
          <div className="flex-1 mb-5">
            {access === 'restricted' ? (
              <p className="text-sm text-ink-faint italic leading-relaxed">
                {t('This story is restricted and not available for public viewing.', 'এই গল্পটি সীমাবদ্ধ, সর্বসাধারণের জন্য উন্মুক্ত নয়।')}
              </p>
            ) : (
              <p className="text-[13px] text-ink-muted leading-relaxed line-clamp-3">{excerpt}</p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto flex flex-col items-start gap-2">
          {access === 'public' && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!canBookmark) {
                  onSignIn?.();
                  return;
                }
                onToggleBookmark?.({ id: storyId, title, respondent: respondentName, location });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-forest"
              aria-label={canBookmark ? (isBookmarked ? t('Remove bookmark', 'সংরক্ষণ বাতিল করুন') : t('Bookmark story', 'গল্পটি সংরক্ষণ করুন')) : t('Sign in to bookmark this story', 'গল্পটি সংরক্ষণ করতে সাইন ইন করুন')}
            >
              <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.75L6 21V4.75Z" strokeLinejoin="round" />
              </svg>
              {canBookmark ? (isBookmarked ? t('Saved', 'সংরক্ষিত') : t('Save story', 'গল্পটি সংরক্ষণ করুন')) : t('Sign in to save', 'সংরক্ষণ করতে সাইন ইন করুন')}
            </button>
          )}
          <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold transition-all
            ${access === 'restricted' ? 'text-ink-faint' : 'text-gold group-hover:gap-2.5'}`}>
            {access === 'restricted' ? t('View details', 'বিস্তারিত দেখুন') : t('Read story', 'গল্পটি পড়ুন')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}
