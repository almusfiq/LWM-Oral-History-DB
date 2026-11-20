import type { Page } from '../App';
import MuseumBrand from './MuseumBrand';

interface FooterProps {
  navigate: (page: Page) => void;
}

export default function Footer({ navigate }: FooterProps) {
  return (
    <footer className="border-t-4 border-flag bg-night text-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/8">
          {/* Brand */}
          <div className="md:col-span-1">
            <MuseumBrand light className="mb-5" />
            <p className="text-sm leading-relaxed text-white/40">
              Preserving the memory of Bangladesh's Liberation War for present and future generations.
            </p>
          </div>

          {/* Oral History */}
          <div>
            <h4 className="text-white text-[11px] font-semibold tracking-[0.15em] uppercase mb-4">Oral History</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Explore Archive', page: 'landing' as Page },
                { label: 'Search Stories', page: 'search' as Page },
                { label: 'Browse by Location', page: 'location-browse' as Page },
                { label: 'Browse by School', page: null },
                { label: 'Browse by Collector', page: null },
              ].map(({ label, page }) => (
                <li key={label}>
                  <button
                    onClick={() => page && navigate(page)}
                    className={`hover:text-white transition-colors text-left ${!page ? 'opacity-30 cursor-default' : 'hover:text-forest'}`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Museum */}
          <div>
            <h4 className="text-white text-[11px] font-semibold tracking-[0.15em] uppercase mb-4">Museum</h4>
            <ul className="space-y-2.5 text-sm">
              {['About LWM', 'Collection', 'Research', 'Publications', 'Visit Us'].map((item) => (
                <li key={item}>
                  <span className="opacity-30 cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-[11px] font-semibold tracking-[0.15em] uppercase mb-4">Contact</h4>
            <address className="text-sm not-italic space-y-1.5 leading-relaxed">
              <p className="font-semibold" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>মুক্তিযুদ্ধ জাদুঘর</p>
              <p className="text-xs text-white/35">Liberation War Museum</p>
              <p>Segunbagicha, Dhaka 1000</p>
              <p>Bangladesh</p>
              <p className="mt-4">
                <a href="mailto:info@liberationwarmuseum.org" className="text-gold hover:text-gold-light transition-colors">
                  info@liberationwarmuseum.org
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/25">
          <p>© {new Date().getFullYear()} মুক্তিযুদ্ধ জাদুঘর · Liberation War Museum. All rights reserved.</p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Use', 'Accessibility'].map((item) => (
              <button key={item} className="hover:text-white/50 transition-colors">{item}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
