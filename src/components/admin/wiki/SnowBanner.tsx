import { useMemo } from "react";

interface SnowBannerProps {
  headline?: string;
  subtext?: string;
}

interface Snowflake {
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  drift: number;
  blur: number;
}

const FLAKE_COUNT = 40;

const SnowBanner = ({
  headline = "Your team's playbook, all in one place.",
  subtext = "Policies, procedures, and the way we do things at New Frontier Immigration Law.",
}: SnowBannerProps) => {
  const flakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: FLAKE_COUNT }, () => ({
      left: Math.random() * 100,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 12,
      duration: 6 + Math.random() * 8,
      opacity: 0.35 + Math.random() * 0.5,
      drift: -20 + Math.random() * 40,
      blur: Math.random() > 0.7 ? 1 : 0,
    }));
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border"
      style={{
        background:
          "linear-gradient(120deg, #213C82 0%, #2d5bb8 55%, #4178d6 100%)",
        height: 104,
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes wiki-snow-fall {
          0% {
            transform: translate3d(0, -20%, 0);
            opacity: 0;
          }
          10% {
            opacity: var(--snow-opacity, 0.6);
          }
          90% {
            opacity: var(--snow-opacity, 0.6);
          }
          100% {
            transform: translate3d(var(--snow-drift, 10px), 120%, 0);
            opacity: 0;
          }
        }
        @keyframes wiki-snow-shimmer {
          0%, 100% { opacity: var(--snow-opacity, 0.6); }
          50% { opacity: calc(var(--snow-opacity, 0.6) * 0.6); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wiki-snowflake { animation: none !important; opacity: 0.3 !important; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        {flakes.map((f, i) => (
          <span
            key={i}
            className="wiki-snowflake absolute rounded-full"
            style={{
              left: `${f.left}%`,
              top: 0,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              background:
                "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, rgba(220,235,255,0.7) 40%, rgba(255,255,255,0.3) 100%)",
              boxShadow: `0 0 ${f.size * 1.5}px rgba(255,255,255,0.35)`,
              filter: f.blur > 0 ? `blur(${f.blur}px)` : "none",
              animation: `wiki-snow-fall ${f.duration}s linear ${f.delay}s infinite`,
              ["--snow-opacity" as any]: f.opacity,
              ["--snow-drift" as any]: `${f.drift}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <h3
          className="text-white font-semibold text-lg sm:text-xl"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}
        >
          {headline}
        </h3>
        <p
          className="text-white/85 text-xs sm:text-sm mt-1"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}
        >
          {subtext}
        </p>
      </div>
    </div>
  );
};

export default SnowBanner;
