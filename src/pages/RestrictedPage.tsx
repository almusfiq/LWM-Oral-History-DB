import type { Page } from '../App';
import { useLang } from '../i18n';

interface RestrictedPageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
}

export default function RestrictedPage({ navigate }: RestrictedPageProps) {
  const { t } = useLang();
  return (
    <div className="bg-surface min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-surface-raised border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-ink-muted">
          <button onClick={() => navigate('landing')} className="hover:text-forest">{t('Oral History', 'মৌখিক ইতিহাস')}</button>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" />
          </svg>
          <button onClick={() => navigate('search', { query: '' })} className="hover:text-forest">{t('Search Results', 'অনুসন্ধানের ফলাফল')}</button>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" />
          </svg>
          <span className="text-ink font-medium">{t('Restricted Story', 'সীমাবদ্ধ গল্প')}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-surface-sunken border border-line rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-9 h-9 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <rect x={3} y={11} width={18} height={11} rx={2} />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Message */}
        <h1 className="font-serif text-3xl font-semibold text-ink mb-4">
          {t('Story Not Available', 'গল্পটি উপলব্ধ নয়')}
        </h1>
        <p className="text-lg text-ink-muted mb-2">
          {t('This story is currently restricted and is not available for public viewing.', 'এই গল্পটি বর্তমানে সীমাবদ্ধ এবং সর্বসাধারণের জন্য উন্মুক্ত নয়।')}
        </p>
        <p className="text-ink-faint text-sm leading-relaxed mb-10 max-w-md mx-auto">
          {t('Some stories in this archive are held under restricted access. This may be because the story contains sensitive information, or because access has been limited at the request of the contributor or their family. Restricted stories are preserved in full within the archive.', 'এই আর্কাইভের কিছু গল্পে প্রবেশাধিকার সীমাবদ্ধ। গল্পে সংবেদনশীল তথ্য থাকতে পারে, অথবা বর্ণনাকারী বা তাঁর পরিবারের অনুরোধে প্রবেশাধিকার সীমিত করা হয়েছে। সীমাবদ্ধ গল্পগুলোও আর্কাইভে সম্পূর্ণভাবে সংরক্ষিত আছে।')}
        </p>

        {/* Divider */}
        <div className="w-12 h-0.5 bg-border mx-auto mb-10" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('search', { query: '' })}
            className="flex items-center justify-center gap-2 bg-forest text-white font-semibold px-6 py-3 rounded-xl hover:bg-forest-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('Back to Search Results', 'অনুসন্ধানের ফলাফলে ফিরে যান')}
          </button>
          <button
            onClick={() => navigate('login')}
            className="flex items-center justify-center gap-2 border border-line bg-surface-raised text-ink-soft font-semibold px-6 py-3 rounded-xl hover:border-forest hover:text-forest transition-colors"
          >
            {t('Sign In for Access', 'প্রবেশাধিকারের জন্য সাইন ইন করুন')}
          </button>
        </div>

        {/* Note */}
        <p className="mt-10 text-xs text-ink-faint max-w-sm mx-auto">
          {t('If you believe you should have access to this story, please contact মুক্তিযুদ্ধ জাদুঘর (Liberation War Museum) at', 'এই গল্পে আপনার প্রবেশাধিকার থাকা উচিত মনে করলে মুক্তিযুদ্ধ জাদুঘরে যোগাযোগ করুন:')}{' '}
          <a href="mailto:archives@liberationwarmuseum.org" className="text-gold hover:underline">
            archives@liberationwarmuseum.org
          </a>
        </p>
      </div>
    </div>
  );
}
