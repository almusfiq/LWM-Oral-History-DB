interface MuseumBrandProps {
  light?: boolean;
  compact?: boolean;
  stacked?: boolean;
  /** The header places the logo on its own, so it can hide it here. */
  logo?: boolean;
  className?: string;
}

/** The museum's name always appears in Bangla with the English name beneath, in either language mode. */
export default function MuseumBrand({ light = false, compact = false, stacked = false, logo = true, className = '' }: MuseumBrandProps) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2 sm:gap-3' : 'gap-3'} ${stacked ? 'flex-col gap-1' : ''} ${className}`}>
      {logo && <img src={light ? '/lwm-logo-white.png' : '/lwm-logo-black.png'} alt="" className={`${stacked ? 'h-16 w-20' : compact ? 'h-10 w-12 sm:h-12 sm:w-16' : 'h-16 w-20'} shrink-0 object-contain`} />}
      <div className="leading-tight text-center" lang="bn">
        <p className={`${light ? 'text-white' : 'text-forest-deep'} font-semibold whitespace-nowrap ${compact ? 'text-base sm:text-[28px]' : 'text-2xl'}`} style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
          মুক্তিযুদ্ধ জাদুঘর
        </p>
        <p lang="en" className={`${light ? 'text-white/75' : 'text-ink-faint'} ${compact ? 'text-[9px] sm:text-xs' : 'text-sm'} tracking-wide whitespace-nowrap`}>
          Liberation War Museum
        </p>
      </div>
    </div>
  );
}
