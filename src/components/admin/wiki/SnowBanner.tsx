import { useMemo } from "react";

interface SnowBannerProps {
  headline?: string;
  subtext?: string;
}

interface Snowflake {
  left: number;
  startTop: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  drift: number;
  sway: number;
  rotate: number;
}

const FLAKE_COUNT = 70;

const SnowBanner = ({
  headline = "Your team's playbook, all in one place.",
  subtext = "Policies, procedures, and the way we do things at New Frontier Immigration Law.",
}: SnowBannerProps) => {
  const flakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: FLAKE_COUNT }, () => {
      const size = 1.5 + Math.random() * 5;
      return {
        left: Math.random() * 100,
        startTop: Math.random() * 120 - 20, // start above or scattered throughout
        size,
        delay: Math.random() * 10,
        duration: 4 + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.65,
        drift: -40 + Math.random() * 80,
        sway: 1 + Math.random() * 3,
        rotate: Math.random() * 360,
      };
    });
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border"
      style={{
        background:
          "linear-gradient(120deg, #1a3264 0%, #213C82 35%, #2d5bb8 75%, #3b6fc9 100%)",
        height: 104,
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes wiki-snow-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: var(--snow-opacity, 0.6);
          }
          95% {
            opacity: var(--snow-opacity, 0.6);
          }
          100% {
            transform: translate3d(var(--snow-drift, 10px), var(--snow-fall, 130px), 0) rotate(var(--snow-rotate, 180deg));
            opacity: 0;
          }
        }
        @keyframes wiki-snow-sway {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(var(--snow-sway, 8px)); }
          75% { transform: translateX(calc(var(--snow-sway, 8px) * -1)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wiki-snowflake { animation: none !important; opacity: 0.25 !important; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        {flakes.map((f, i) => {
          const isLarge = f.size > 4;
          return (
            <span
              key={i}
              className="wiki-snowflake absolute"
              style={{
                left: `${f.left}%`,
                top: `${f.startTop}%`,
                width: f.size,
                height: f.size,
                opacity: f.opacity,
                background: isLarge
                  ? `radial-gradient(circle at 40% 40%, rgba(255,255,255,0.98) 0%, rgba(230,245,255,0.8) 35%, rgba(255,255,255,0.2) 100%)`
                  : `radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.5) 100%)`,
                boxShadow: isLarge
                  ? `0 0 ${f.size * 2}px rgba(255,255,255,0.45), 0 0 ${f.size}px rgba(200,230,255,0.3)`
                  : `0 0 ${f.size}px rgba(255,255,255,0.35)`,
                borderRadius: isLarge ? "30% 70% 70% 30% / 30% 30% 70% 70%" : "50%",
                animation: `wiki-snow-fall ${f.duration}s linear ${f.delay}s infinite, wiki-snow-sway ${f.sway * 2}s ease-in-out ${f.delay}s infinite`,
                ["--snow-opacity" as any]: f.opacity,
                ["--snow-drift" as any]: `${f.drift}px`,
                ["--snow-fall" as any]: `${120 + Math.random() * 40}%`,
                ["--snow-rotate" as any]: `${f.rotate}deg`,
                ["--snow-sway" as any]: `${f.sway * 4}px`,
              }}
            />
          );
        })}
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
