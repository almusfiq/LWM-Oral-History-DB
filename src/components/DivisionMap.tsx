import { useEffect, useState } from 'react';
import { divisions } from '../data/bangladeshLocations';
import { divisionOutlines } from '../data/divisionOutlines';
import { useLang } from '../i18n';

type Ring = [number, number][];
interface DivisionFeature {
  properties: { name: string; district_name?: string | null; map_center?: [number, number] };
  geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
}

// The same shades of flag green the map page uses, one per division in the archive's division order.
// Pale shades, light against the card's dark green, distinct enough that neighbours read apart.
const TINTS = ['#E4F1E8', '#F4ECD8', '#D3E9DA', '#ECF4E4', '#F7F1E3', '#DDEEDD', '#E9E4CF', '#CFE5D6'];

let cache: DivisionFeature[] | null = null;

// Where each name sits (longitude, latitude): in the widest open part of the division, clear of its
// borders and the coast, so the whole word stays inside.
export const DIVISION_LABEL_AT: Record<string, [number, number]> = {
  rangpur: [89.1, 25.72],
  rajshahi: [88.92, 24.55],
  mymensingh: [90.4, 24.97],
  sylhet: [91.66, 24.68],
  dhaka: [90.2, 23.95],
  khulna: [89.25, 23.05],
  barishal: [90.32, 22.55],
  chattogram: [92.08, 22.45],
};

/**
 * The eight divisions of Bangladesh in shades of flag green, named in place, each one a link that opens
 * the stories from that division. Shares its outlines with the map page.
 */
export default function DivisionMap({ onSelect, className = '' }: { onSelect: (divisionId: string) => void; className?: string }) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';
  const [features, setFeatures] = useState<DivisionFeature[] | null>(cache);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let live = true;
    fetch('/bangladesh-admin-boundaries.geojson')
      .then((response) => response.json())
      .then((data: { features: DivisionFeature[] }) => {
        cache = data.features.filter((feature) => !feature.properties.district_name);
        if (live) setFeatures(cache);
      })
      .catch(() => { /* the card still works without the drawing */ });
    return () => { live = false; };
  }, []);

  if (!features) return null;

  const polygons = (feature: DivisionFeature) => (feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates);
  const path = (feature: DivisionFeature) => polygons(feature)
    .map((polygon) => polygon.map((ring) => `M${ring.map(([x, y]) => `${x},${-y}`).join('L')}Z`).join(''))
    .join('');

  return (
    <svg viewBox="88.0 -26.75 4.8 6.25" preserveAspectRatio="xMidYMid meet" role="group" aria-label={t('Divisions of Bangladesh', 'বাংলাদেশের বিভাগ')} className={className}>
      {features.map((feature) => {
        const index = divisions.findIndex((division) => division.name.toLowerCase() === feature.properties.name.toLowerCase());
        const division = divisions[index];
        if (!division) return null;
        const label = bn ? division.nameBn : division.name;
        const active = hovered === division.id;
        return (
          <path
            key={division.id}
            d={path(feature)}
            fill={active ? '#D11F35' : TINTS[index % TINTS.length]}
            fillRule="evenodd"
            stroke={active ? '#D11F35' : TINTS[index % TINTS.length]}
            strokeWidth={0.6}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer outline-none transition-[fill,stroke] duration-200 focus-visible:fill-[#D11F35]"
            role="link"
            tabIndex={0}
            aria-label={t(`Stories from ${division.name} Division`, `${division.nameBn} বিভাগের গল্প`)}
            onPointerEnter={() => setHovered(division.id)}
            onPointerLeave={() => setHovered(null)}
            onClick={(event) => { event.stopPropagation(); onSelect(division.id); }}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onSelect(division.id); } }}
          >
            <title>{label}</title>
          </path>
        );
      })}
      {/* Each division's outer border, worked out ahead of time, so no costly effect is needed to draw it */}
      {features.map((feature) => {
        const division = divisions.find((item) => item.name.toLowerCase() === feature.properties.name.toLowerCase());
        const outline = divisionOutlines[feature.properties.name];
        if (!division || !outline) return null;
        const active = hovered === division.id;
        return <path key={`o-${division.id}`} d={outline} fill="none" stroke={active ? '#FFE3E6' : '#B8924A'} strokeWidth={active ? 2 : 1.3} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />;
      })}
      {features.map((feature) => {
        const division = divisions.find((item) => item.name.toLowerCase() === feature.properties.name.toLowerCase());
        const center = DIVISION_LABEL_AT[feature.properties.name.toLowerCase()] ?? feature.properties.map_center;
        if (!division || !center) return null;
        return (
          <text
            key={`l-${division.id}`}
            x={center[0]}
            y={-center[1]}
            textAnchor="middle"
            dominantBaseline="central"
            pointerEvents="none"
            fill={hovered === division.id ? '#FFFFFF' : '#00503B'}
            fontSize={0.2}
            fontWeight={700}
            paintOrder="stroke"
            stroke={hovered === division.id ? '#8E1424' : '#FAF8F3'}
            strokeOpacity={0.8}
            strokeWidth={0.035}
            strokeLinejoin="round"
            style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
          >
            {bn ? division.nameBn : division.name}
          </text>
        );
      })}
    </svg>
  );
}
