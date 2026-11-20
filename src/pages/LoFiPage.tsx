import type { Page } from '../App';

interface LoFiPageProps {
  navigate: (page: Page) => void;
}

/* ── Shared lo-fi primitives ─────────────────────────── */

const Nav = () => (
  <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#DDD]">
    <div className="w-6 h-6 rounded bg-[#CCC]" />
    <div className="flex flex-col items-center gap-0.5">
      <div className="h-2 w-28 bg-[#CCC] rounded-full" />
      <div className="h-1.5 w-20 bg-[#E0E0E0] rounded-full" />
    </div>
    <div className="h-6 w-14 bg-[#DDD] rounded-lg" />
  </div>
);

const Bar = ({ w = '100%', h = 8, color = '#CCC', className = '' }: { w?: string | number; h?: number; color?: string; className?: string }) => (
  <div className={`rounded-full ${className}`} style={{ width: w, height: h, backgroundColor: color }} />
);

const ImageBox = ({ className = '' }: { className?: string }) => (
  <div
    className={`bg-[#D8D8D8] rounded ${className}`}
    style={{ backgroundImage: 'repeating-linear-gradient(45deg,#C8C8C8 0,#C8C8C8 1px,transparent 0,transparent 6px)', backgroundSize: '8px 8px' }}
  />
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-[#DDD] rounded-lg p-3 ${className}`}>{children}</div>
);

const Btn = ({ dark = false, className = '' }: { dark?: boolean; className?: string }) => (
  <div className={`rounded-lg ${dark ? 'bg-[#888]' : 'bg-[#DDD]'} ${className}`} style={{ height: 28 }} />
);

const Section = ({ children, dark = false, className = '' }: { children: React.ReactNode; dark?: boolean; className?: string }) => (
  <div className={`p-4 ${dark ? 'bg-[#444]' : 'bg-[#F5F5F5]'} ${className}`}>{children}</div>
);

/* ── Individual screen wireframes ───────────────────── */

const LandingWF = () => (
  <div className="bg-white flex flex-col text-[0]">
    <Nav />
    {/* Hero */}
    <div className="bg-[#555] px-4 pt-6 pb-5 flex flex-col items-center gap-3">
      <Bar w="40%" h={6} color="#888" />
      <Bar w="65%" h={14} color="#777" />
      <Bar w="45%" h={4} color="#666" />
      <Bar w="75%" h={4} color="#666" />
      {/* Search */}
      <div className="w-full flex gap-2 mt-2">
        <div className="flex-1 bg-[#444] rounded-lg h-9 border border-[#666]" />
        <div className="w-16 bg-[#888] rounded-lg h-9" />
      </div>
      {/* Stat badge */}
      <div className="border border-[#777] rounded-xl px-4 py-2 w-48 flex gap-3 items-center">
        <Bar w="40%" h={10} color="#777" />
        <div className="w-px h-8 bg-[#666]" />
        <div className="flex flex-col gap-1 flex-1">
          <Bar w="90%" h={3} color="#777" />
          <Bar w="70%" h={2.5} color="#666" />
        </div>
      </div>
    </div>
    {/* Browse */}
    <Section>
      <Bar w="30%" h={4} color="#BBB" className="mb-1.5" />
      <Bar w="55%" h={8} color="#AAA" className="mb-3" />
      <div className="grid grid-cols-2 gap-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <div className="w-8 h-8 bg-[#DDD] rounded-lg mb-2" />
            <Bar w="60%" h={5} color="#CCC" className="mb-1" />
            <Bar w="80%" h={3} color="#DDD" />
            <Bar w="65%" h={3} color="#DDD" className="mt-0.5" />
          </Card>
        ))}
      </div>
    </Section>
    {/* Featured */}
    <Section dark>
      <Bar w="30%" h={4} color="#777" className="mb-1.5" />
      <Bar w="55%" h={8} color="#888" className="mb-3" />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-[#666]">
            <ImageBox className="h-14" />
            <div className="p-2 bg-[#555] flex flex-col gap-1">
              <Bar w="80%" h={4} color="#777" />
              <Bar w="60%" h={3} color="#666" />
            </div>
          </div>
        ))}
      </div>
    </Section>
    {/* About */}
    <Section>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Bar w="30%" h={3} color="#CCC" />
          <Bar w="80%" h={8} color="#AAA" />
          <Bar w="90%" h={3} color="#DDD" />
          <Bar w="85%" h={3} color="#DDD" />
          <Bar w="70%" h={3} color="#DDD" />
          <Btn className="mt-2 w-28" />
        </div>
        <ImageBox className="h-28 rounded-xl" />
      </div>
    </Section>
  </div>
);

const SearchWF = () => (
  <div className="bg-[#F5F5F5] flex flex-col">
    <Nav />
    {/* Sticky search */}
    <div className="bg-white border-b border-[#DDD] px-4 py-2 flex gap-2">
      <div className="flex-1 h-8 bg-[#F0F0F0] border border-[#DDD] rounded-lg" />
      <Btn dark className="w-16" />
    </div>
    {/* Header */}
    <div className="px-4 py-3 flex items-center justify-between">
      <div>
        <Bar w={120} h={6} color="#AAA" className="mb-1" />
        <Bar w={80} h={3} color="#CCC" />
      </div>
      <div className="h-7 w-14 bg-[#DDD] rounded-lg" />
    </div>
    {/* Body */}
    <div className="flex gap-3 px-4 pb-4">
      {/* Sidebar */}
      <div className="w-32 flex-shrink-0">
        <Card className="flex flex-col gap-2">
          <Bar w="50%" h={3} color="#BBB" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-t border-[#EEE] pt-2">
              <Bar w="70%" h={4} color="#CCC" className="mb-1.5" />
              {[...Array(3)].map((__, j) => (
                <div key={j} className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 border border-[#CCC] rounded" />
                  <Bar w="60%" h={3} color="#DDD" />
                </div>
              ))}
            </div>
          ))}
        </Card>
      </div>
      {/* Results */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <div className="h-0.5 bg-[#CCC] mb-2 w-full" />
            <Bar w="80%" h={4} color="#AAA" className="mb-1" />
            <Bar w="60%" h={3} color="#CCC" className="mb-2" />
            <Bar w="90%" h={2.5} color="#DDD" />
            <Bar w="75%" h={2.5} color="#DDD" className="mt-0.5 mb-2" />
            <Bar w="40%" h={3} color="#CCC" />
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const LocationBrowseWF = () => (
  <div className="bg-[#F5F5F5] flex flex-col">
    <Nav />
    <div className="px-4 pt-3 pb-1">
      <div className="flex gap-1 items-center mb-3">
        {['Oral History', '>', 'Location'].map((t, i) => (
          <Bar key={i} w={t === '>' ? 6 : 40} h={3} color={t === '>' ? '#CCC' : '#BBB'} />
        ))}
      </div>
      <Bar w="60%" h={8} color="#AAA" className="mb-4" />
      <div className="grid grid-cols-3 gap-3">
        {/* Map */}
        <div className="col-span-1">
          <Card>
            <Bar w="50%" h={4} color="#AAA" className="mb-2" />
            <ImageBox className="h-40 rounded-lg mb-3" />
            <div className="h-10 bg-[#FFF8EC] border border-[#DDD] rounded-lg p-2">
              <Bar w="60%" h={3} color="#CCC" className="mb-1" />
              <Bar w="80%" h={3} color="#BBB" />
            </div>
          </Card>
        </div>
        {/* Divisions */}
        <div className="col-span-2">
          <Bar w="50%" h={5} color="#AAA" className="mb-3" />
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="flex flex-col items-center gap-1.5 py-2">
                <div className="w-8 h-8 bg-[#DDD] rounded-full" />
                <Bar w="70%" h={3} color="#CCC" />
                <Bar w="50%" h={2.5} color="#DDD" />
              </Card>
            ))}
          </div>
          <Bar w="40%" h={5} color="#AAA" className="mb-2" />
          <div className="flex flex-col gap-1.5">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="flex items-center justify-between py-2">
                <Bar w="40%" h={3} color="#CCC" />
                <Bar w="20%" h={3} color="#DDD" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LocationDetailWF = () => (
  <div className="bg-[#F5F5F5] flex flex-col">
    <Nav />
    <div className="bg-white border-b border-[#DDD] px-4 py-2">
      <div className="flex gap-1 mb-2">
        {[...Array(4)].map((_, i) => (
          <Bar key={i} w={30} h={2.5} color="#CCC" className="mr-1" />
        ))}
      </div>
      <Bar w="50%" h={7} color="#AAA" className="mb-1" />
      <Bar w="30%" h={3} color="#CCC" />
    </div>
    <div className="px-4 py-3">
      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`h-7 w-16 rounded-full ${i === 0 ? 'bg-[#AAA]' : 'bg-[#E0E0E0]'}`} />
        ))}
      </div>
      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-8 bg-white border border-[#DDD] rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <div className="h-0.5 bg-[#CCC] mb-2" />
            <Bar w="80%" h={4} color="#AAA" className="mb-1" />
            <Bar w="60%" h={3} color="#CCC" className="mb-2" />
            <Bar w="90%" h={2.5} color="#DDD" />
            <Bar w="75%" h={2.5} color="#DDD" className="mt-0.5" />
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const StoryWF = () => (
  <div className="bg-[#F5F5F5] flex flex-col">
    <Nav />
    <div className="bg-white border-b border-[#DDD] px-4 py-2">
      <div className="flex gap-1 mb-1">
        {[...Array(3)].map((_, i) => <Bar key={i} w={30} h={2.5} color="#CCC" className="mr-1" />)}
      </div>
    </div>
    <div className="flex gap-4 px-4 py-4">
      {/* Main content */}
      <div className="flex-1">
        <Bar w="70%" h={8} color="#AAA" className="mb-2" />
        <Bar w="40%" h={4} color="#C8C8C8" className="mb-4" />
        <Card className="mb-3">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Bar w="50%" h={2.5} color="#CCC" />
                <Bar w="80%" h={3.5} color="#BBB" />
              </div>
            ))}
          </div>
        </Card>
        {/* Font toggle */}
        <div className="flex items-center gap-2 mb-3">
          <Bar w={60} h={2.5} color="#CCC" />
          <div className="flex gap-1">
            <div className="w-7 h-6 bg-[#888] rounded" />
            <div className="w-7 h-6 bg-[#DDD] rounded" />
          </div>
        </div>
        {/* Story text */}
        <div className="flex flex-col gap-1.5 mb-3">
          {[100, 95, 88, 92, 78, 90, 85, 70].map((w, i) => (
            <Bar key={i} w={`${w}%`} h={3} color="#DDD" />
          ))}
          <Bar w="40%" h={3} color="#DDD" />
        </div>
        {/* Back button */}
        <div className="h-8 w-32 bg-[#DDD] rounded-xl" />
      </div>
      {/* Sidebar */}
      <div className="w-36 flex-shrink-0 flex flex-col gap-3">
        <Card>
          <Bar w="60%" h={3} color="#BBB" className="mb-2" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-[#EEE] rounded p-2 mb-1.5">
              <Bar w="80%" h={3} color="#CCC" className="mb-1" />
              <Bar w="60%" h={2.5} color="#DDD" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  </div>
);

const LoginWF = () => (
  <div className="bg-white flex" style={{ minHeight: 340 }}>
    {/* Left panel */}
    <div className="w-1/2 bg-[#555] p-5 flex flex-col justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#888]" />
        <div className="flex flex-col gap-1">
          <Bar w={80} h={3} color="#888" />
          <Bar w={60} h={2.5} color="#777" />
        </div>
      </div>
      <div>
        <Bar w="90%" h={6} color="#777" className="mb-1" />
        <Bar w="75%" h={6} color="#777" className="mb-3" />
        <Bar w="60%" h={3} color="#666" />
      </div>
    </div>
    {/* Right panel */}
    <div className="w-1/2 p-5 flex flex-col justify-center gap-4">
      <Bar w="40%" h={8} color="#AAA" />
      <Bar w="70%" h={3} color="#CCC" className="-mt-2 mb-2" />
      {['Email', 'Password'].map((label, i) => (
        <div key={i}>
          <Bar w="35%" h={2.5} color="#CCC" className="mb-1.5" />
          <div className="h-8 bg-[#F5F5F5] border border-[#DDD] rounded-lg" />
        </div>
      ))}
      <Btn dark className="w-full" />
      <Card className="flex flex-col gap-1.5">
        <Bar w="40%" h={2.5} color="#CCC" className="mb-1" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#CCC] mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <Bar w={70} h={3} color="#BBB" />
              <Bar w={90} h={2.5} color="#DDD" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const AdminWF = () => (
  <div className="flex bg-[#F5F5F5]" style={{ minHeight: 340 }}>
    {/* Sidebar */}
    <div className="w-28 bg-[#333] p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 pb-2 border-b border-[#555]">
        <div className="w-5 h-5 rounded-full bg-[#888]" />
        <div className="flex flex-col gap-0.5">
          <Bar w={50} h={2.5} color="#888" />
          <Bar w={35} h={2} color="#666" />
        </div>
      </div>
      <Bar w="50%" h={2.5} color="#555" />
      {['Overview', 'All Stories', 'Upload Story'].map((item, i) => (
        <div key={i} className={`h-7 rounded-lg ${i === 0 ? 'bg-[#888]' : 'bg-transparent'} flex items-center px-2`}>
          <Bar w="70%" h={2.5} color={i === 0 ? '#CCC' : '#555'} />
        </div>
      ))}
    </div>
    {/* Main */}
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Bar w={100} h={5} color="#AAA" className="mb-1" />
          <Bar w={80} h={3} color="#CCC" />
        </div>
        <div className="flex gap-2">
          <Btn className="w-24" />
          <Btn dark className="w-24" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="flex flex-col gap-1">
            <Bar w="50%" h={2.5} color="#CCC" />
            <Bar w="60%" h={7} color="#AAA" />
            <Bar w="70%" h={2.5} color="#DDD" />
          </Card>
        ))}
      </div>
      {/* Table */}
      <Card>
        <div className="flex gap-2 border-b border-[#EEE] pb-2 mb-2">
          {[30, 20, 25, 15, 10].map((w, i) => (
            <Bar key={i} w={`${w}%`} h={3} color="#CCC" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2 py-1.5 border-b border-[#F0F0F0]">
            {[30, 20, 25, 15, 10].map((w, j) => (
              <Bar key={j} w={`${w}%`} h={2.5} color={j === 3 ? (i === 2 ? '#AAA' : '#D0D0D0') : '#D8D8D8'} />
            ))}
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const UploadWF = () => (
  <div className="flex bg-[#F5F5F5]" style={{ minHeight: 340 }}>
    {/* Sidebar — same as admin */}
    <div className="w-28 bg-[#333] p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 pb-2 border-b border-[#555]">
        <div className="w-5 h-5 rounded-full bg-[#888]" />
        <div className="flex flex-col gap-0.5">
          <Bar w={50} h={2.5} color="#888" />
          <Bar w={35} h={2} color="#666" />
        </div>
      </div>
      {['Overview', 'All Stories', 'Upload Story'].map((item, i) => (
        <div key={i} className={`h-7 rounded-lg ${i === 2 ? 'bg-[#888]' : 'bg-transparent'} flex items-center px-2`}>
          <Bar w="70%" h={2.5} color={i === 2 ? '#CCC' : '#555'} />
        </div>
      ))}
    </div>
    {/* Form */}
    <div className="flex-1 p-4 flex flex-col gap-3">
      <div className="h-8 bg-[#FFF8EC] border border-[#DDD] rounded-lg flex items-center px-3 gap-2">
        <div className="w-4 h-4 rounded-full bg-[#CCC]" />
        <Bar w="60%" h={2.5} color="#CCC" />
      </div>
      {['Story Title', 'Story Content', 'People', 'Location', 'Visibility'].map((section, i) => (
        <Card key={i}>
          <Bar w="40%" h={4} color="#AAA" className="mb-3 pb-1 border-b border-[#EEE]" />
          {i === 1 ? (
            <div className="h-16 bg-[#F5F5F5] border border-[#DDD] rounded-lg" />
          ) : i === 4 ? (
            <div className="flex flex-col gap-2">
              {['Public', 'Restricted'].map((opt, j) => (
                <div key={j} className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-[#CCC] mt-0.5" />
                  <div>
                    <Bar w={50} h={3} color="#BBB" className="mb-0.5" />
                    <Bar w={80} h={2.5} color="#DDD" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(i === 3 ? 4 : 2)].map((_, j) => (
                <div key={j}>
                  <Bar w="50%" h={2.5} color="#CCC" className="mb-1" />
                  <div className="h-7 bg-[#F5F5F5] border border-[#DDD] rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
      <div className="flex gap-2">
        <Btn dark className="w-28" />
        <Btn className="w-20" />
      </div>
    </div>
  </div>
);

const RestrictedWF = () => (
  <div className="bg-white flex flex-col items-center justify-center px-6 py-12 gap-4">
    <div className="w-14 h-14 rounded-full bg-[#E8E8E8] flex items-center justify-center">
      <div className="w-7 h-7 bg-[#CCC] rounded" />
    </div>
    <Bar w={180} h={7} color="#AAA" />
    <div className="flex flex-col items-center gap-1.5 w-64">
      <Bar w="90%" h={3} color="#CCC" />
      <Bar w="80%" h={3} color="#CCC" />
      <Bar w="70%" h={3} color="#CCC" />
    </div>
    <div className="flex gap-3 mt-2">
      <Btn dark className="w-28" />
      <Btn className="w-24" />
    </div>
  </div>
);

/* ── Screen registry ────────────────────────────────── */

const SCREENS: { label: string; sub: string; component: React.ReactNode }[] = [
  { label: '01 — Landing', sub: 'Homepage & hero search', component: <LandingWF /> },
  { label: '02 — Search Results', sub: 'Filtered story archive', component: <SearchWF /> },
  { label: '03 — Location Browse', sub: 'Map + division grid', component: <LocationBrowseWF /> },
  { label: '04 — Location Detail', sub: 'Division stories list', component: <LocationDetailWF /> },
  { label: '05 — Story', sub: 'Full story reader', component: <StoryWF /> },
  { label: '06 — Login', sub: 'Collector / admin sign-in', component: <LoginWF /> },
  { label: '07 — Admin Dashboard', sub: 'Archive overview', component: <AdminWF /> },
  { label: '08 — Upload Story', sub: 'Story entry form', component: <UploadWF /> },
  { label: '09 — Restricted', sub: 'Access denied state', component: <RestrictedWF /> },
];

/* ── Page ───────────────────────────────────────────── */

export default function LoFiPage({ navigate }: LoFiPageProps) {
  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#DDD] px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">Low-Fidelity Wireframes</h1>
          <p className="text-xs text-ink-faint mt-0.5">মুক্তিযুদ্ধ জাদুঘর · Liberation War Museum — Oral History · 9 screens</p>
        </div>
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-sm text-ink-muted border border-line rounded-xl px-4 py-2 hover:border-gold hover:text-gold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View Hi-Fi Prototype
        </button>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {SCREENS.map(({ label, sub, component }) => (
          <div key={label} className="flex flex-col gap-2">
            {/* Label */}
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-ink-faint">{label}</p>
              <p className="text-[10px] text-ink-faint/70">{sub}</p>
            </div>
            {/* Frame */}
            <div
              className="bg-white rounded-xl border-2 border-[#DDD] overflow-hidden shadow-sm"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {component}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
