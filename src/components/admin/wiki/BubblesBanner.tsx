import { useMemo } from "react";

interface BubblesBannerProps {
  headline?: string;
  subtext?: string;
}

interface Bubble {
  size: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
  sway: number;
}

const BUBBLE_COUNT = 18;

const BubblesBanner = ({
  headline = "Your team's playbook, all in one place.",
  subtext = "Policies, procedures, and the way we do things at New Frontier Immigration Law.",
}: BubblesBannerProps) => {
  const bubbles = useMemo<Bubble[]>(() => {
    return Array.from({ length: BUBBLE_COUNT }, () => ({
      size: 8 + Math.random() * 34,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 7 + Math.random() * 9,
      opacity: 0.18 + Math.random() * 0.32,
      sway: 8 + Math.random() * 18,
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
        @keyframes wiki-bubble-rise {
          0% {
            transform: translate3d(0, 110%, 0) scale(0.85);
            opacity: 0;
          }
          15% { opacity: var(--bubble-opacity, 0.4); }
          85% { opacity: var(--bubble-opacity, 0.4); }
          100% {
            transform: translate3d(var(--bubble-sway, 12px), -130%, 0) scale(1);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wiki-bubble { animation: none !important; opacity: 0.25 !important; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        {bubbles.map((b, i) => (
          <span
            key={i}
            className="wiki-bubble absolute rounded-full"
            style={{
              left: `${b.left}%`,
              bottom: 0,
              width: b.size,
              height: b.size,
              opacity: b.opacity,
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(255,218,0,0.35) 35%, rgba(255,255,255,0.05) 70%, transparent 100%)",
              boxShadow:
                "inset 0 0 6px rgba(255,255,255,0.5), 0 0 8px rgba(255,218,0,0.15)",
              animation: `wiki-bubble-rise ${b.duration}s ease-in ${b.delay}s infinite`,
              ["--bubble-opacity" as any]: b.opacity,
              ["--bubble-sway" as any]: `${b.sway}px`,
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

export default BubblesBanner;
