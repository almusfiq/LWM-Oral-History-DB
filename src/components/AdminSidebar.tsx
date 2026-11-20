import type { Page } from '../App';
import { useLang } from '../i18n';

export type AdminSection = 'Overview' | 'By Location' | 'All Stories' | 'Database Explorer' | 'Upload Story';

interface AdminSidebarProps {
  active: AdminSection | string;
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
}

const navItems = [
  { label: 'Overview', labelBn: 'সারসংক্ষেপ', page: 'admin' as Page, section: 'Overview', icon: 'overview' },
  { label: 'By Location', labelBn: 'বিভাগ ও জেলা', page: 'admin' as Page, section: 'By Location', icon: 'location' },
  { label: 'All Stories', labelBn: 'সকল গল্প', page: 'admin' as Page, section: 'All Stories', icon: 'stories' },
  { label: 'Database Explorer', labelBn: 'ডেটাবেজ কালেকশন', page: 'admin' as Page, section: 'Database Explorer', icon: 'database' },
  { label: 'Upload Story', labelBn: 'গল্প আপলোড', page: 'upload' as Page, section: undefined, icon: 'upload' },
] as const;

function Icon({ type }: { type: string }) {
  if (type === 'overview') return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x={3} y={3} width={7} height={9} rx={2} /><rect x={14} y={3} width={7} height={5} rx={2} /><rect x={14} y={12} width={7} height={9} rx={2} /><rect x={3} y={16} width={7} height={5} rx={2} /></svg>;
  if (type === 'location') return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" strokeLinejoin="round" /></svg>;
  if (type === 'stories') return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" strokeLinejoin="round" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 8h8M8 12h5" strokeLinecap="round" /></svg>;
  if (type === 'database') return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
  return <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3" strokeLinecap="round" /></svg>;
}

export default function AdminSidebar({ active, navigate }: AdminSidebarProps) {
  const { t, lang } = useLang();
  return (
    <aside className="relative w-full lg:w-64 overflow-hidden bg-forest-deep text-white flex-shrink-0 flex flex-col lg:sticky lg:top-0 lg:h-screen">
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none opacity-60"><div className="film-grain" /></div>

      <button onClick={() => navigate('landing')} className="relative flex items-center gap-3 px-4 pt-4 pb-3 lg:px-5 lg:pt-6 lg:pb-5 text-left lg:flex-col lg:text-center group" title={t('Go to the public site', 'পাবলিক সাইটে যান')}>
        <img src="/lwm-logo-white.png" alt="" className="h-10 w-14 lg:h-16 lg:w-20 object-contain transition-transform duration-500 group-hover:scale-105" />
        <span className="leading-tight">
          <span className="block text-lg lg:text-[22px] font-semibold text-white" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>মুক্তিযুদ্ধ জাদুঘর</span>
          <span className="block text-xs text-white/70 tracking-wide">Liberation War Museum</span>
        </span>
      </button>
      <div aria-hidden="true" className="relative mx-5 h-px bg-white/10" />

      <nav className="relative flex flex-wrap gap-1.5 p-3 lg:flex lg:flex-col lg:flex-1 lg:px-4 lg:pt-5">
        {navItems.map((item) => {
          const isActive = active === item.label || active === item.section;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.page, item.section ? { adminSection: item.section } : undefined)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-left lg:gap-3 lg:px-3.5 lg:py-2.5 transition-all ${isActive
                ? 'bg-flag text-white shadow-sm'
                : 'text-white/65 hover:bg-white/[0.08] hover:text-white'}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white/20' : 'bg-white/[0.05] group-hover:bg-white/10'}`}>
                <Icon type={item.icon} />
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-semibold lg:text-sm">{lang === 'bn' ? item.labelBn : item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="relative m-3 lg:m-4 lg:mt-auto hidden lg:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <div className="min-w-0 flex-1 text-xs">
          <p className="font-semibold text-white truncate">Admin Authorized</p>
          <p className="text-white/60 truncate">SQLite / Postgres Ready</p>
        </div>
      </div>
    </aside>
  );
}
