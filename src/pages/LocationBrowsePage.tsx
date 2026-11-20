import { useEffect, useMemo, useRef, useState } from 'react';
import { divisionOutlines } from '../data/divisionOutlines';
import { DIVISION_LABEL_AT } from '../components/DivisionMap';
import type { Page } from '../App';
import { districtMatchesStory, divisions, normalizeLocation } from '../data/bangladeshLocations';
import { stories, type ArchiveStory } from '../data/stories';
import { getStories } from '../api/client';
import { num, useLang } from '../i18n';

interface LocationBrowsePageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
  /** Open zoomed to this division (and district), as when a place is chosen elsewhere on the site. */
  initialDivisionId?: string;
  initialDistrictId?: string;
}

type Position = [number, number, ...number[]];
type PolygonCoordinates = Position[][];
type Geometry =
  | { type: 'Polygon'; coordinates: PolygonCoordinates }
  | { type: 'MultiPolygon'; coordinates: PolygonCoordinates[] };

interface BoundaryFeature {
  type: 'Feature';
  properties: {
    name: string;
    bn_name: string;
    district_name: string;
    district_bn_name: string;
    division_name: string;
    division_bn_name: string;
    map_center?: [number, number];
    /** The point deepest inside the district's main piece of land: the most room for its name. */
    label_point?: [number, number];
    /** How wide a name can be at that point and still sit inside the district (map units). */
    label_room?: number;
  };
  geometry: Geometry;
}

interface BoundaryCollection {
  type: 'FeatureCollection';
  features: BoundaryFeature[];
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const divisionAliases: Record<string, string> = {
  barisal: 'barishal',
  barishal: 'barishal',
  'বরিশাল': 'barishal',
  chittagong: 'chattogram',
  chattogram: 'chattogram',
  'চট্টগ্রাম': 'chattogram',
  dhaka: 'dhaka',
  'ঢাকা': 'dhaka',
  khulna: 'khulna',
  'খুলনা': 'khulna',
  mymensingh: 'mymensingh',
  'ময়মনসিংহ': 'mymensingh',
  rajshahi: 'rajshahi',
  'রাজশাহী': 'rajshahi',
  rangpur: 'rangpur',
  'রংপুর': 'rangpur',
  sylhet: 'sylhet',
  'সিলেট': 'sylhet',
};

const districtAliases: Record<string, string> = {
  barisal: 'barishal',
  barishal: 'barishal',
  'বরিশাল': 'barishal',
  chittagong: 'chattogram',
  chattogram: 'chattogram',
  'চট্টগ্রাম': 'chattogram',
  brahamanbaria: 'brahmanbaria',
  comilla: 'cumilla',
  bogra: 'bogura',
  jessore: 'jashore',
  maulvibazar: 'moulvibazar',
  nawabganj: 'chapainawabganj',
  netrakona: 'netrokona',
  'বাগেরহাট': 'bagerhat',
};

// Shades of the flag green, so neighbouring divisions stay distinguishable on the map.
const divisionTints = ['#00503B', '#006A4E', '#1C5E49', '#0E7354', '#2B6650', '#00573F', '#13785A', '#245B47'];
// The map's own colours, matching the home page map: pale greens and creams that read apart, gold edges.
const mapTints = ['#E4F1E8', '#F4ECD8', '#D3E9DA', '#ECF4E4', '#F7F1E3', '#DDEEDD', '#E9E4CF', '#CFE5D6'];
const mapAspect = 1.12;
const ADMIN_STORIES_KEY = 'lwm-admin-archive-stories-v7';

interface ArchiveMapStory extends ArchiveStory {
  location: string;
  division?: string;
  upazila?: string;
  access?: string;
}

function readArchiveStories(): ArchiveMapStory[] {
  const merged = new Map<string, ArchiveMapStory>();
  stories.forEach((story) => merged.set(story.id, { ...story, location: story.district, access: 'public' }));
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_STORIES_KEY) ?? '[]') as Array<Partial<ArchiveMapStory> & { id: string }>;
    for (const record of stored) {
      const original = merged.get(record.id);
      merged.set(record.id, { ...original, ...record, collector: record.collector ?? original?.collector ?? '', respondent: record.respondent ?? original?.respondent ?? '', school: record.school ?? original?.school ?? '', collectorClass: record.collectorClass ?? original?.collectorClass ?? '', respondentAddress: record.respondentAddress ?? original?.respondentAddress ?? '', respondentAge: record.respondentAge ?? original?.respondentAge ?? '', relationship: record.relationship ?? original?.relationship ?? '', details: record.details ?? original?.details ?? [], district: record.district ?? original?.district ?? record.location ?? '', content: record.content ?? original?.content ?? '', title: record.title ?? original?.title ?? 'Untitled story', location: record.location ?? original?.location ?? '', archiveNumber: record.archiveNumber ?? original?.archiveNumber ?? record.id.split('-').slice(-1)[0] ?? record.id, id: record.id });
    }
  } catch {
    // Keep the built-in archive available if local browser storage is unreadable.
  }
  return [...merged.values()];
}

function cleanLocationName(value: string): string {
  if (!value) return '';
  return value
    .replace(/(?:বিভাগ|জেলা|সদর|division|district)/gi, '')
    .trim();
}

function key(value: string) {
  if (!value) return '';
  const cleaned = cleanLocationName(value);
  const compact = normalizeLocation(cleaned).replace(/[^a-z0-9\u0980-\u09ff]/g, '');
  return divisionAliases[compact] ?? districtAliases[compact] ?? compact;
}

function polygonsFor(geometry: Geometry): PolygonCoordinates[] {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function positionsFor(geometry: Geometry): Position[] {
  return polygonsFor(geometry).flat(2);
}

function boundsForGeometry(geometry: Geometry): Bounds {
  const bounds: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [longitude, latitude] of positionsFor(geometry)) {
    bounds.minX = Math.min(bounds.minX, longitude);
    bounds.maxX = Math.max(bounds.maxX, longitude);
    bounds.minY = Math.min(bounds.minY, -latitude);
    bounds.maxY = Math.max(bounds.maxY, -latitude);
  }
  return bounds;
}

function boundsFor(features: BoundaryFeature[]): Bounds {
  const bounds: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const feature of features) {
    for (const [longitude, latitude] of positionsFor(feature.geometry)) {
      bounds.minX = Math.min(bounds.minX, longitude);
      bounds.maxX = Math.max(bounds.maxX, longitude);
      bounds.minY = Math.min(bounds.minY, -latitude);
      bounds.maxY = Math.max(bounds.maxY, -latitude);
    }
  }
  return bounds;
}

function viewBoxFor(bounds: Bounds) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  let width = Math.max(bounds.maxX - bounds.minX, 0.15) * 1.12;
  let height = Math.max(bounds.maxY - bounds.minY, 0.15) * 1.12;
  if (width / height < mapAspect) width = height * mapAspect;
  else height = width / mapAspect;
  return `${centerX - width / 2} ${centerY - height / 2} ${width} ${height}`;
}

function pathFor(geometry: Geometry) {
  return polygonsFor(geometry).map((polygon) => polygon.map((ring) => {
    if (ring.length < 3) return '';
    return `M${ring.map(([longitude, latitude]) => `${longitude},${-latitude}`).join('L')}Z`;
  }).join('')).join('');
}

function divisionFor(feature: BoundaryFeature) {
  const featureKey = key(feature.properties.division_name);
  return divisions.find((division) => key(division.name) === featureKey);
}

function districtFor(feature: BoundaryFeature) {
  const division = divisionFor(feature);
  const featureKey = key(feature.properties.district_name);
  return division?.districts.find((district) => key(district.name) === featureKey);
}

function resolveDistrict(value: string) {
  const valueKey = key(value);
  for (const division of divisions) {
    const district = division.districts.find(
      (item) =>
        key(item.name) === valueKey ||
        key(item.nameBn) === valueKey ||
        districtMatchesStory(item.nameBn, value) ||
        districtMatchesStory(item.name, value)
    );
    if (district) return { division, district };
  }
  return undefined;
}

function districtForArchiveRecord(story: ArchiveMapStory, boundary: BoundaryCollection | null) {
  for (const value of [story.district, story.location, story.upazila]) {
    if (!value) continue;
    const direct = resolveDistrict(value);
    if (direct) return direct;
    const matchedArea = boundary?.features.find((feature) => key(feature.properties.name) === key(value) || (feature.properties.bn_name && key(feature.properties.bn_name) === key(value)));
    if (matchedArea) {
      const division = divisionFor(matchedArea);
      const district = districtFor(matchedArea);
      if (division && district) return { division, district };
    }
  }
  return undefined;
}

function divisionForArchiveRecord(story: ArchiveMapStory, boundary: BoundaryCollection | null) {
  const storyDivKey = key(story.division ?? '');
  const directDivision = divisions.find(
    (division) => key(division.name) === storyDivKey || key(division.nameBn) === storyDivKey
  );
  return directDivision ?? districtForArchiveRecord(story, boundary)?.division;
}

function MapPinIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

const placeNamesBn = new Map(divisions.flatMap((d) => [[d.name, d.nameBn] as const, ...d.districts.map((x) => [x.name, x.nameBn] as const)]));

export default function LocationBrowsePage({ navigate, initialDivisionId, initialDistrictId }: LocationBrowsePageProps) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  /** A division/district name in the current language. */
  const place = (name: string) => (bn ? placeNamesBn.get(name) ?? name : name);
  const n = (value: number) => num(value, lang);
  const [boundary, setBoundary] = useState<BoundaryCollection | null>(null);
  const [archiveStories, setArchiveStories] = useState<ArchiveMapStory[]>(readArchiveStories);
  const [boundaryError, setBoundaryError] = useState(false);
  const [liveSynced, setLiveSynced] = useState(false);
  const startDivision = divisions.find((division) => division.id === initialDivisionId) ?? null;
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [selectedDivisionName, setSelectedDivisionName] = useState<string | null>(startDivision?.name ?? null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(startDivision?.districts.find((district) => district.id === initialDistrictId)?.name ?? null);

  useEffect(() => {
    let active = true;
    getStories({ limit: 10000 })
      .then((res) => {
        if (!active || !res.stories?.length) return;
        setArchiveStories((prev) => {
          const map = new Map<string, ArchiveMapStory>();
          prev.forEach((s) => map.set(s.id, s));
          for (const s of res.stories as any[]) {
            map.set(s.id, {
              ...s,
              location: s.district || s.location || '',
              district: s.district || '',
              division: s.division || '',
              access: s.access || 'public',
            });
          }
          return [...map.values()];
        });
        setLiveSynced(true);
      })
      .catch((err) => {
        console.warn('Could not load live stories for location map:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDivisionName) return;
    let active = true;
    getStories({ division: selectedDivisionName, limit: 5000 })
      .then((res) => {
        if (!active || !res.stories?.length) return;
        setArchiveStories((prev) => {
          const map = new Map<string, ArchiveMapStory>();
          prev.forEach((s) => map.set(s.id, s));
          for (const s of res.stories as any[]) {
            map.set(s.id, {
              ...s,
              location: s.district || s.location || '',
              district: s.district || '',
              division: s.division || '',
              access: s.access || 'public',
            });
          }
          return [...map.values()];
        });
      })
      .catch((err) => {
        console.warn('Could not load division stories:', err);
      });
    return () => {
      active = false;
    };
  }, [selectedDivisionName]);

  useEffect(() => {
    let active = true;
    fetch('/bangladesh-admin-boundaries.geojson')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load the Bangladesh map.');
        return response.json() as Promise<BoundaryCollection>;
      })
      .then((data) => {
        if (active) setBoundary(data);
      })
      .catch(() => {
        if (active) setBoundaryError(true);
      });
    return () => { active = false; };
  }, []);

  const selectedDivision = divisions.find((division) => division.name === selectedDivisionName) ?? null;
  const selectedDistrict = selectedDivision?.districts.find((district) => district.name === selectedDistrictName) ?? null;

  // Bring the map into view when the page opens on a place, and whenever a place is chosen.
  const mapRef = useRef<HTMLElement>(null);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; if (!initialDivisionId) return; }
    const top = (mapRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 90;
    window.scrollTo({ top, behavior: firstRun.current ? 'auto' : 'smooth' });
  }, [selectedDivision?.id, selectedDistrict?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the choice in the browser history entry, so coming back from a story returns to the same place.
  useEffect(() => {
    const nav = window.history.state?.lwmNav;
    if (!nav) return;
    window.history.replaceState({ ...window.history.state, lwmNav: { ...nav, page: selectedDivision ? 'location-detail' : 'location-browse', locationDivisionId: selectedDivision?.id, locationDistrictId: selectedDistrict?.id } }, '');
  }, [selectedDivision, selectedDistrict]);

  const visibleFeatures = useMemo(() => {
    const allFeatures = boundary?.features ?? [];
    if (!selectedDivision) return allFeatures.filter((feature) => !feature.properties.district_name);
    return allFeatures.filter((feature) => divisionFor(feature)?.id === selectedDivision.id &&
      (selectedDistrict ? districtFor(feature)?.id === selectedDistrict.id : Boolean(feature.properties.district_name)));
  }, [boundary, selectedDivision, selectedDistrict]);

  const pathsToRender = useMemo(() => visibleFeatures.map((feature, index) => ({
    feature,
    index,
    path: pathFor(feature.geometry),
    itemKey: `${feature.properties.division_name}-${feature.properties.district_name}-${feature.properties.name}-${index}`,
  })), [visibleFeatures]);

  const divisionLabels = useMemo(() => {
    if (selectedDivision || !boundary) return [];
    return divisions.flatMap((division) => {
      const features = boundary.features.filter((feature) => divisionFor(feature)?.id === division.id);
      if (!features.length) return [];
      const shape = features.find((feature) => !feature.properties.district_name) ?? features[0];
      const spot = DIVISION_LABEL_AT[division.name.toLowerCase()] ?? shape.properties.map_center;
      if (spot) return [{ name: division.name, x: spot[0], y: -spot[1] }];
      const bounds = boundsFor(features);
      return [{ name: division.name, x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }];
    });
  }, [boundary, selectedDivision]);

  const districtLabels = useMemo(() => {
    if (!selectedDivision || !boundary) return [];
    return selectedDivision.districts.filter((district) => !selectedDistrict || district.id === selectedDistrict.id).flatMap((district) => {
      const feature = boundary.features.find((item) => districtFor(item)?.id === district.id);
      if (!feature) return [];
      const spot = feature.properties.label_point ?? feature.properties.map_center;
      if (spot) {
        return [{ name: district.name, x: spot[0], y: -spot[1], room: feature.properties.label_room }];
      }
      const bounds = boundsForGeometry(feature.geometry);
      return [{ name: district.name, x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }];
    });
  }, [boundary, selectedDivision, selectedDistrict]);

  const mapViewBox = useMemo(() => visibleFeatures.length ? viewBoxFor(boundsFor(visibleFeatures)) : '88 -27 5 7', [visibleFeatures]);
  const mapLabelSize = Number(mapViewBox.split(' ')[2]) * 0.022;

  // Where every story belongs, worked out once (not on every hover or render): stories grouped by
  // division and by district.
  const publicStories = useMemo(() => archiveStories.filter((story) => story.access !== 'restricted'), [archiveStories]);
  const storyIndex = useMemo(() => {
    const byDivision = new Map<string, ArchiveMapStory[]>();
    const byDistrict = new Map<string, ArchiveMapStory[]>();
    for (const story of publicStories) {
      const place = districtForArchiveRecord(story, boundary);
      const divisionId = divisionForArchiveRecord(story, boundary)?.id;
      if (divisionId) byDivision.set(divisionId, [...(byDivision.get(divisionId) ?? []), story]);
      if (place) {
        const districtKey = `${place.division.id}:${place.district.name}`;
        byDistrict.set(districtKey, [...(byDistrict.get(districtKey) ?? []), story]);
      }
    }
    return { byDivision, byDistrict };
  }, [publicStories, boundary]);
  const storiesForDistrict = (districtName: string, divisionId: string) => storyIndex.byDistrict.get(`${divisionId}:${districtName}`) ?? [];
  const focusedStoryList = selectedDistrict && selectedDivision
    ? storiesForDistrict(selectedDistrict.name, selectedDivision.id)
    : selectedDivision
      ? storyIndex.byDivision.get(selectedDivision.id) ?? []
      : [];
  const storyCountForDivision = (divisionId: string) => storyIndex.byDivision.get(divisionId)?.length ?? 0;

  const chooseDivision = (divisionName: string) => {
    setSelectedDivisionName(divisionName);
    setSelectedDistrictName(null);
  };

  const chooseDistrict = (districtName: string) => {
    setSelectedDistrictName(districtName);
  };

  const resetMap = () => {
    setSelectedDivisionName(null);
    setSelectedDistrictName(null);
  };

  const handleMapFeatureClick = (feature: BoundaryFeature) => {
    const division = divisionFor(feature);
    const district = districtFor(feature);
    if (!division) return;
    if (!selectedDivision) chooseDivision(division.name);
    else if (!selectedDistrict && district) chooseDistrict(district.name);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1F1F1F]">
      <div className="border-b-4 border-flag bg-forest-deep">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 text-sm text-white/75 sm:px-8">
          <button onClick={() => navigate('landing')} className="transition hover:text-white">{t('Oral History', 'মৌখিক ইতিহাস')}</button>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-white">{t('Browse by Location', 'স্থান অনুযায়ী দেখুন')}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-flag">{t('Explore the archive geographically', 'মানচিত্রে আর্কাইভ ঘুরে দেখুন')}</p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-forest-deep sm:text-5xl">{t('Stories across Bangladesh', 'সারা বাংলাদেশের গল্প')}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#5E5E5E]">{t('Choose a division on the map, zoom into its districts, and open the stories collected there.', 'মানচিত্রে একটি বিভাগ বেছে নিন, তার জেলাগুলো দেখুন, এবং সেখানে সংগৃহীত গল্পগুলো পড়ুন।')}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5E5E5E]">
            <span className="rounded-full border border-[#e7dcc8] bg-white px-3 py-1.5">{t('8 divisions', '৮টি বিভাগ')}</span>
            <span className="rounded-full border border-[#e7dcc8] bg-white px-3 py-1.5">{t('64 districts', '৬৪টি জেলা')}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)] xl:items-stretch">
          <section ref={mapRef} className="flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-forest-deep shadow-[0_22px_60px_rgba(11,15,13,0.2)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <button onClick={resetMap} className="hover:text-[#D9B36C]">{t('Bangladesh', 'বাংলাদেশ')}</button>
                  {selectedDivision && <><span>/</span><button onClick={() => chooseDivision(selectedDivision.name)} className="hover:text-[#D9B36C]">{place(selectedDivision.name)}</button></>}
                  {selectedDistrict && <><span>/</span><span className="text-white/80">{place(selectedDistrict.name)}</span></>}
                </div>
                <h2 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">
                  {selectedDistrict ? t(`${selectedDistrict.name} District`, `${selectedDistrict.nameBn} জেলা`) : selectedDivision ? t(`${selectedDivision.name} Division`, `${selectedDivision.nameBn} বিভাগ`) : t('Bangladesh', 'বাংলাদেশ')}
                </h2>
              </div>
              {(selectedDivision || selectedDistrict) && <button onClick={selectedDistrict ? () => chooseDivision(selectedDivision!.name) : resetMap} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/75 transition hover:border-[#D9B36C]/70 hover:text-white"><span aria-hidden="true">←</span>{selectedDistrict ? t('All districts', 'সকল জেলা') : t('All divisions', 'সকল বিভাগ')}</button>}
            </div>

            <div className="relative h-[380px] flex-1 overflow-hidden sm:h-[480px] md:h-[620px] xl:h-auto xl:min-h-[700px]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-60"><div className="film-grain" /></div>
              {boundary ? (
                <svg viewBox={mapViewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t(`${selectedDistrict?.name ?? selectedDivision?.name ?? 'Bangladesh'} administrative map`, `${selectedDistrict?.nameBn ?? selectedDivision?.nameBn ?? 'বাংলাদেশ'} প্রশাসনিক মানচিত্র`)} className="relative h-full w-full overflow-visible p-5 sm:p-8">

                  {pathsToRender.map(({ feature, path, itemKey }) => {
                    const division = divisionFor(feature);
                    const district = districtFor(feature);
                    const showingDistricts = Boolean(selectedDivision);
                    const shade = selectedDivision
                      ? (district ? selectedDivision.districts.findIndex((item) => item.id === district.id) : 0)
                      : (division ? divisions.findIndex((item) => item.id === division.id) : 0);
                    const hovered = hoveredArea === itemKey;
                    const fill = hovered ? '#D11F35' : mapTints[Math.max(0, shade) % mapTints.length];
                    return <path
                      key={itemKey}
                      d={path}
                      fill={fill}
                      fillRule="evenodd"
                      stroke={showingDistricts ? (hovered ? '#FFE3E6' : '#B8924A') : fill}
                      strokeWidth={hovered && showingDistricts ? 2 : showingDistricts ? 1.1 : 0.6}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className="cursor-pointer outline-none transition-[fill,stroke] duration-200 focus-visible:fill-[#D11F35]"
                      onPointerEnter={() => { setHoveredArea(itemKey); setHoveredName(feature.properties.name); }}
                      onPointerLeave={() => { setHoveredArea(null); setHoveredName(null); }}
                      tabIndex={0}
                      role="button"
                      aria-label={feature.properties.district_name ? t(`${feature.properties.name} District, ${feature.properties.division_name} Division`, `${place(feature.properties.name)} জেলা, ${place(feature.properties.division_name)} বিভাগ`) : t(`${feature.properties.name} Division`, `${place(feature.properties.name)} বিভাগ`)}
                      onClick={() => handleMapFeatureClick(feature)}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleMapFeatureClick(feature); } }}
                    ><title>{feature.properties.district_name ? `${place(feature.properties.name)} · ${place(feature.properties.division_name)}` : place(feature.properties.name)}</title></path>;
                  })}
                  {/* Division borders, worked out ahead of time (no costly effect needed) */}
                  {!selectedDivision && divisions.map((division) => divisionOutlines[division.name] && (
                    <path key={`o-${division.id}`} d={divisionOutlines[division.name]} fill="none" stroke={hoveredName === division.name ? '#FFE3E6' : '#B8924A'} strokeWidth={hoveredName === division.name ? 2 : 1.3} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />
                  ))}
                  {divisionLabels.map((label) => <g key={label.name} pointerEvents="none" className="select-none">
                    <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" fill={hoveredName === label.name ? '#FFFFFF' : '#00503B'} fontSize={mapLabelSize} fontWeight="700" paintOrder="stroke" stroke={hoveredName === label.name ? '#8E1424' : '#FAF8F3'} strokeOpacity="0.85" strokeWidth={mapLabelSize * 0.18} strokeLinejoin="round" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>{place(label.name)}</text>
                  </g>)}
                  {districtLabels.map((label) => {
                    // As large as the standard size allows, but never wider than the district's own room:
                    // a Bangla name is about 0.42 of the font size per character (vowel signs take no room of their own).
                    const text = place(label.name);
                    const room = 'room' in label ? Number(label.room) : 0;
                    // …and never so small that it can't be read: tiny districts keep a readable minimum.
                    const fitted = room ? Math.max(mapLabelSize * 0.62, Math.min(mapLabelSize, (room * 0.95) / (text.length * 0.42))) : mapLabelSize;
                    return <g key={label.name} pointerEvents="none" className="select-none">
                    <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" fill={hoveredName === label.name ? '#FFFFFF' : '#00503B'} fontSize={fitted} fontWeight="700" paintOrder="stroke" stroke={hoveredName === label.name ? '#8E1424' : '#FAF8F3'} strokeOpacity="0.85" strokeWidth={fitted * 0.18} strokeLinejoin="round" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>{place(label.name)}</text>
                  </g>;
                  })}
                </svg>
              ) : boundaryError ? (
                <div className="absolute inset-0 grid place-items-center px-8 text-center text-white/70"><div><p className="font-display text-xl text-white">{t('The map could not be loaded.', 'মানচিত্রটি লোড করা যায়নি।')}</p><p className="mt-2 text-sm">{t('Please refresh the page to load the administrative boundaries.', 'প্রশাসনিক সীমানা দেখতে পেজটি আবার লোড করুন।')}</p></div></div>
              ) : (
                <div className="absolute inset-0 grid place-items-center text-sm text-white/60"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D9B36C]/30 border-t-[#D9B36C]" />
                  <span className="sr-only">{t('Loading Bangladesh boundaries…', 'বাংলাদেশের সীমানা লোড হচ্ছে…')}</span></div>
              )}
              <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-night/70 px-3 py-2 text-[11px] text-white/80 backdrop-blur sm:bottom-6 sm:left-6">
                <span className="h-2 w-2 rounded-full bg-flag" />{t('Click a mapped area to zoom in', 'বড় করে দেখতে মানচিত্রের কোনো এলাকায় ক্লিক করুন')}
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#E7DCC8] bg-white shadow-[0_15px_45px_rgba(11,15,13,0.07)]">
            {/* Header: where you are, and how many stories are here */}
            <div className="relative overflow-hidden bg-forest-deep px-6 pb-6 pt-5 text-white">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-60"><div className="film-grain" /></div>
              <div className="relative">
                <p className="flex items-center gap-2 text-xs font-semibold text-white/75">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-flag" />
                  {selectedDistrict ? t(`${selectedDivision?.name} Division`, `${selectedDivision?.nameBn} বিভাগ`) : selectedDivision ? t('Division', 'বিভাগ') : t('Bangladesh', 'বাংলাদেশ')}
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <h2 className="min-w-0 truncate text-3xl font-bold leading-tight">{selectedDistrict ? place(selectedDistrict.name) : selectedDivision ? place(selectedDivision.name) : t('All divisions', 'সকল বিভাগ')}</h2>
                  <p className="shrink-0 text-right leading-none">
                    <span className="block text-3xl font-bold tabular-nums">{n(selectedDivision ? focusedStoryList.length : publicStories.length)}</span>
                    <span className="mt-1 block text-xs text-white/70">{t('stories', 'টি গল্প')}</span>
                  </p>
                </div>
                {selectedDivision && !selectedDistrict && (
                  <p className="mt-3 text-sm text-white/75">{bn ? `${n(selectedDivision.districts.length)}টি জেলা · জেলা বেছে নিলে শুধু সেখানকার গল্প দেখাবে` : `${selectedDivision.districts.length} districts · choose one to see only its stories`}</p>
                )}
              </div>
            </div>

            {/* The list: places with stories first, then the rest, quieter */}
            <div className="flex-1 overflow-y-auto px-3 py-3 xl:max-h-[620px]">
              {(() => {
                const items = selectedDivision
                  ? selectedDivision.districts.map((district) => ({ key: district.id, name: district.name, count: storiesForDistrict(district.name, selectedDivision.id).length, selected: selectedDistrict?.id === district.id, onClick: () => chooseDistrict(district.name) }))
                  : divisions.map((division) => ({ key: division.id, name: division.name, count: storyCountForDivision(division.id), selected: false, onClick: () => chooseDivision(division.name) }));
                const withStories = items.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
                const without = items.filter((item) => item.count === 0);
                const row = (item: (typeof items)[number]) => (
                  <li key={item.key}>
                    <button
                      onClick={item.onClick}
                      aria-pressed={item.selected}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${item.selected ? 'bg-forest-pale' : 'hover:bg-[#F6F3EC]'}`}
                    >
                      {item.selected && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-flag" />}
                      <svg aria-hidden="true" className={`h-4 w-4 shrink-0 ${item.count ? 'text-flag' : 'text-ink-faint/50'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                      <span className={`min-w-0 truncate text-[15px] ${item.count ? 'font-semibold text-ink' : 'text-ink-muted'} ${item.selected ? 'text-forest-deep' : 'group-hover:text-forest-deep'}`}>{place(item.name)}</span>
                      <span aria-hidden="true" className="mx-1 mb-1 h-px flex-1 self-end border-b border-dotted border-[#D9CDB5]" />
                      {item.count > 0
                        ? <span className="shrink-0 rounded-full bg-forest px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">{n(item.count)}</span>
                        : <span className="shrink-0 text-xs text-ink-faint">{t('none yet', 'নেই')}</span>}
                    </button>
                  </li>
                );
                return <>
                  {withStories.length > 0 && <>
                    <ul>{withStories.map(row)}</ul>
                  </>}
                  {without.length > 0 && <>
                    <p className="mt-3 border-t border-[#EFE9DD] px-3 pb-1 pt-4 text-xs font-semibold text-ink-faint">{t('No stories in the archive yet', 'আর্কাইভে এখনো গল্প নেই')}</p>
                    <ul>{without.map(row)}</ul>
                  </>}
                </>;
              })()}
            </div>

            <div className="border-t border-[#E7DCC8] px-6 py-4 text-sm">
              {selectedDistrict ? <button onClick={() => chooseDivision(selectedDivision!.name)} className="font-semibold text-forest hover:underline">← {t(`All districts of ${selectedDivision?.name}`, `${selectedDivision?.nameBn} বিভাগের সব জেলা`)}</button> : selectedDivision ? <button onClick={resetMap} className="font-semibold text-forest hover:underline">← {t('All divisions', 'সকল বিভাগ')}</button> : <span className="text-ink-faint">{t('Choose a division here or on the map.', 'এখান থেকে বা মানচিত্রে একটি বিভাগ বেছে নিন।')}</span>}
            </div>
          </aside>
          </div>

          {selectedDivision && <section className="overflow-hidden rounded-[28px] border border-[#e7dcc8] bg-white shadow-[0_15px_45px_rgba(11,15,13,0.07)]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E7DCC8] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">{t(`Stories from ${selectedDistrict?.name ?? selectedDivision.name}`, `${selectedDistrict?.nameBn ?? selectedDivision.nameBn}-এর গল্প`)}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[#1F1F1F]">{bn ? `${n(focusedStoryList.length)}টি গল্প` : `${focusedStoryList.length} ${focusedStoryList.length === 1 ? 'story' : 'stories'}`}</h2>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {focusedStoryList.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {focusedStoryList.map((story) => <button key={story.id} onClick={() => navigate('story', { storyId: story.id, storyRecord: story })} className="group w-full rounded-2xl border border-[#E7DCC8] bg-white p-4 text-left transition hover:border-[#D9B36C] hover:bg-[#FAF8F3]">
                  <span className="text-[11px] font-semibold text-gold" style={{ fontFamily: "'Noto Sans Bengali', sans-serif", letterSpacing: 0 }}>{t('Archive no.', 'সংরক্ষণ নং')} {story.archiveNumber}</span>
                  <span className="mt-1 block text-base font-semibold leading-6 text-[#1F1F1F] group-hover:text-[#7A5E33]" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>{story.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-[#5E5E5E] line-clamp-3" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>{story.content.replace(/\s+/g, ' ').slice(0, 180)}…</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A5E33]">{t('Read story', 'গল্পটি পড়ুন')} <span aria-hidden="true">→</span></span>
                </button>)}
              </div> : <div className="rounded-2xl border border-dashed border-[#E7DCC8] bg-[#FAF8F3] p-6 text-center">
                <p className="font-display text-xl font-semibold text-[#1F1F1F]">{t('No stories here yet', 'এখানে এখনো কোনো গল্প নেই')}</p>
                <p className="mt-2 text-sm leading-6 text-[#5E5E5E]">{t('The map shows this area, but there are no stories from it in the current archive collection.', 'মানচিত্রে এলাকাটি আছে, তবে বর্তমান আর্কাইভে এখান থেকে কোনো গল্প নেই।')}</p>
              </div>}
            </div>
          </section>}
        </div>
      </main>
    </div>
  );
}
