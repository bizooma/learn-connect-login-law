import { useMemo } from "react";

interface ButterfliesBannerProps {
  headline?: string;
  subtext?: string;
}

interface Butterfly {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  flutterDuration: number;
  drift: number;
  rotate: number;
  hue: number;
  opacity: number;
}

const BUTTERFLY_COUNT = 12;

const ButterflyShape = ({ hue }: { hue: number }) => {
  // Two-tone wings using brand palette accents with hue shift for variety
  const wingA = `hsl(${hue}, 85%, 70%)`;
  const wingB = `hsl(${(hue + 30) % 360}, 90%, 80%)`;
  return (
    <svg viewBox="0 0 64 48" className="block w-full h-full overflow-visible">
      <defs>
        <radialGradient id={`bf-grad-${hue}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={wingB} stopOpacity="0.95" />
          <stop offset="100%" stopColor={wingA} stopOpacity="0.85" />
        </radialGradient>
      </defs>
      {/* Left wing */}
      <g className="bf-wing bf-wing-l" style={{ transformOrigin: "32px 24px" }}>
        <path
          d="M32 24 C 18 4, 2 6, 4 22 C 2 36, 16 42, 32 28 Z"
          fill={`url(#bf-grad-${hue})`}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.6"
        />
        <circle cx="12" cy="16" r="2.2" fill="rgba(255,255,255,0.7)" />
        <circle cx="10" cy="30" r="1.4" fill="rgba(255,255,255,0.55)" />
      </g>
      {/* Right wing */}
      <g className="bf-wing bf-wing-r" style={{ transformOrigin: "32px 24px" }}>
        <path
          d="M32 24 C 46 4, 62 6, 60 22 C 62 36, 48 42, 32 28 Z"
          fill={`url(#bf-grad-${hue})`}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.6"
        />
        <circle cx="52" cy="16" r="2.2" fill="rgba(255,255,255,0.7)" />
        <circle cx="54" cy="30" r="1.4" fill="rgba(255,255,255,0.55)" />
      </g>
      {/* Body */}
      <ellipse cx="32" cy="26" rx="1.6" ry="9" fill="rgba(20,20,30,0.85)" />
      {/* Antennae */}
      <path d="M32 17 C 30 13, 28 11, 26 10" stroke="rgba(20,20,30,0.85)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M32 17 C 34 13, 36 11, 38 10" stroke="rgba(20,20,30,0.85)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </svg>
  );
};

const ButterfliesBanner = ({
  headline = "Your team's playbook, all in one place.",
  subtext = "Policies, procedures, and the way we do things at New Frontier Immigration Law.",
}: ButterfliesBannerProps) => {
  const butterflies = useMemo<Butterfly[]>(() => {
    // Bias toward warm amber/yellow tones to harmonize with the brand yellow #FFDA00,
    // with a few pink/coral accents.
    const palette = [42, 48, 38, 50, 28, 18, 340, 320];
    return Array.from({ length: BUTTERFLY_COUNT }, (_, i) => ({
      left: Math.random() * 100,
      top: 10 + Math.random() * 70,
      size: 22 + Math.random() * 26,
      delay: Math.random() * 8,
      duration: 14 + Math.random() * 10,
      flutterDuration: 0.22 + Math.random() * 0.25,
      drift: 30 + Math.random() * 60,
      rotate: -18 + Math.random() * 36,
      hue: palette[i % palette.length],
      opacity: 0.7 + Math.random() * 0.3,
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
        @keyframes wiki-bf-float {
          0%   { transform: translate3d(0, 0, 0) rotate(var(--bf-rot, 0deg)); }
          25%  { transform: translate3d(calc(var(--bf-drift, 40px) * 0.6), -14px, 0) rotate(calc(var(--bf-rot, 0deg) + 6deg)); }
          50%  { transform: translate3d(var(--bf-drift, 40px), 6px, 0) rotate(calc(var(--bf-rot, 0deg) - 4deg)); }
          75%  { transform: translate3d(calc(var(--bf-drift, 40px) * 0.4), -10px, 0) rotate(calc(var(--bf-rot, 0deg) + 4deg)); }
          100% { transform: translate3d(0, 0, 0) rotate(var(--bf-rot, 0deg)); }
        }
        @keyframes wiki-bf-flap-l {
          0%, 100% { transform: rotateY(0deg); }
          50%      { transform: rotateY(70deg); }
        }
        @keyframes wiki-bf-flap-r {
          0%, 100% { transform: rotateY(0deg); }
          50%      { transform: rotateY(-70deg); }
        }
        .wiki-butterfly { will-change: transform; }
        .wiki-butterfly .bf-wing-l { animation: wiki-bf-flap-l var(--bf-flap, 0.3s) ease-in-out infinite; transform-origin: 32px 24px; }
        .wiki-butterfly .bf-wing-r { animation: wiki-bf-flap-r var(--bf-flap, 0.3s) ease-in-out infinite; transform-origin: 32px 24px; }
        @media (prefers-reduced-motion: reduce) {
          .wiki-butterfly { animation: none !important; }
          .wiki-butterfly .bf-wing-l, .wiki-butterfly .bf-wing-r { animation: none !important; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        {butterflies.map((b, i) => (
          <span
            key={i}
            className="wiki-butterfly absolute"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size * 0.75,
              opacity: b.opacity,
              animation: `wiki-bf-float ${b.duration}s ease-in-out ${b.delay}s infinite`,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
              ["--bf-drift" as any]: `${b.drift}px`,
              ["--bf-rot" as any]: `${b.rotate}deg`,
              ["--bf-flap" as any]: `${b.flutterDuration}s`,
            }}
          >
            <ButterflyShape hue={b.hue} />
          </span>
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

export default ButterfliesBanner;
