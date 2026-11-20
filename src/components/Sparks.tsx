// Fixed pseudo-random values, so the sparks look scattered but render the same every time.
const sparks = Array.from({ length: 34 }, (_, i) => {
  const r = (seed: number) => ((Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1;
  // Most sparks rise from the middle, as from a flame; a few stray to the edges.
  const spread = r(1) < 0.75 ? 0.32 : 0.5;
  return {
    left: `${(50 + (r(2) - 0.5) * 2 * spread * 100).toFixed(2)}%`,
    size: 7 + r(3) * 13,
    duration: 7 + r(4) * 9,
    delay: -r(5) * 16,
    drift: (r(6) - 0.5) * 140,
    sway: 10 + r(7) * 26,
    swayTime: 1.6 + r(8) * 2.2,
    rise: 38 + r(9) * 34,
    opacity: 0.45 + r(10) * 0.55,
  };
});

/**
 * Red sparks rising from a low glow at the foot of the hero, like sparks from a memorial flame. Each
 * spark climbs and fades while it sways side to side; the glow beneath slowly breathes.
 * Hidden for visitors who prefer reduced motion.
 */
export default function Sparks() {
  return (
    <div aria-hidden="true" className="sparks pointer-events-none absolute inset-0 overflow-hidden">
      <div className="spark-glow absolute inset-x-0 bottom-0 h-72" />
      {sparks.map((spark, i) => (
        <span
          key={i}
          className="spark"
          style={{
            left: spark.left,
            width: spark.size,
            height: spark.size,
            ['--t' as string]: `${spark.duration}s`,
            ['--delay' as string]: `${spark.delay}s`,
            ['--dx' as string]: `${spark.drift}px`,
            ['--rise' as string]: `-${spark.rise}vh`,
            ['--o' as string]: spark.opacity,
          }}
        >
          <i style={{ ['--sway' as string]: `${spark.sway}px`, ['--sw' as string]: `${spark.swayTime}s` }} />
        </span>
      ))}
    </div>
  );
}
