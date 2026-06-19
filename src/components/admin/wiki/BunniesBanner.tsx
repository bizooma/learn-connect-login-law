import { useMemo } from "react";

interface BunniesBannerProps {
  headline?: string;
  subtext?: string;
}

interface Bunny {
  left: number;
  startY: number;
  size: number;
  delay: number;
  speed: number;
  color: string;
  direction: "left" | "right";
  hopHeight: number;
}

interface Carrot {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface Cloud {
  left: number;
  top: number;
  scale: number;
  opacity: number;
  speed: number;
}

const BUNNY_COLORS = [
  "#FFFFFF",
  "#FFF5E6",
  "#FFE4C4",
  "#F5DEB3",
  "#E8D5B7",
  "#F0E6D2",
];

const BunnySVG = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size}
    height={size * 0.9}
    viewBox="0 0 64 58"
    fill="none"
  >
    {/* Body */}
    <ellipse cx="32" cy="40" rx="18" ry="12" fill={color} />
    {/* Head */}
    <circle cx="32" cy="22" r="12" fill={color} />
    {/* Left ear */}
    <ellipse cx="26" cy="8" rx="4" ry="12" fill={color} transform="rotate(-12 26 8)" />
    <ellipse cx="26" cy="8" rx="2" ry="9" fill="#FFB6C1" transform="rotate(-12 26 8)" opacity="0.6" />
    {/* Right ear */}
    <ellipse cx="38" cy="8" rx="4" ry="12" fill={color} transform="rotate(12 38 8)" />
    <ellipse cx="38" cy="8" rx="2" ry="9" fill="#FFB6C1" transform="rotate(12 38 8)" opacity="0.6" />
    {/* Eye */}
    <circle cx="28" cy="20" r="2.5" fill="#333" />
    <circle cx="28.5" cy="19.5" r="0.8" fill="#FFF" />
    {/* Nose */}
    <ellipse cx="32" cy="24" rx="2" ry="1.5" fill="#FFB6C1" />
    {/* Mouth */}
    <path d="M30 26 Q32 28 34 26" stroke="#333" strokeWidth="0.8" fill="none" />
    {/* Tail */}
    <circle cx="14" cy="38" r="4.5" fill={color} />
    {/* Paws */}
    <ellipse cx="24" cy="50" rx="4" ry="2.5" fill={color} />
    <ellipse cx="40" cy="50" rx="4" ry="2.5" fill={color} />
    {/* Cheek blush */}
    <circle cx="22" cy="24" r="3" fill="#FFB6C1" opacity="0.3" />
    <circle cx="42" cy="24" r="3" fill="#FFB6C1" opacity="0.3" />
  </svg>
);

const CarrotSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 20 26" fill="none">
    <path d="M6 8 C6 8, 4 0, 10 0 C16 0, 14 8, 14 8" fill="#4CAF50" />
    <path d="M8 8 C8 8, 10 2, 12 8" fill="#66BB6A" />
    <ellipse cx="10" cy="16" rx="6" ry="10" fill="#FF9800" />
    <path d="M8 12 L9 13 M11 12 L12 13" stroke="#E65100" strokeWidth="0.6" />
  </svg>
);

const BunniesBanner = ({
  headline = "Your team's playbook, all in one place.",
  subtext = "Policies, procedures, and the way we do things at New Frontier Immigration Law.",
}: BunniesBannerProps) => {
  const bunnies = useMemo<Bunny[]>(() => {
    return Array.from({ length: 6 }, () => ({
      left: -10 + Math.random() * 15,
      startY: 55 + Math.random() * 25,
      size: 20 + Math.random() * 18,
      delay: Math.random() * 6,
      speed: 7 + Math.random() * 5,
      color: BUNNY_COLORS[Math.floor(Math.random() * BUNNY_COLORS.length)],
      direction: Math.random() > 0.3 ? "right" : "left",
      hopHeight: 8 + Math.random() * 12,
    }));
  }, []);

  const carrots = useMemo<Carrot[]>(() => {
    return Array.from({ length: 5 }, () => ({
      left: 10 + Math.random() * 80,
      top: 55 + Math.random() * 30,
      size: 8 + Math.random() * 6,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 2,
    }));
  }, []);

  const clouds = useMemo<Cloud[]>(() => {
    return Array.from({ length: 4 }, () => ({
      left: Math.random() * 90,
      top: 8 + Math.random() * 20,
      scale: 0.4 + Math.random() * 0.5,
      opacity: 0.12 + Math.random() * 0.12,
      speed: 20 + Math.random() * 20,
    }));
  }, []);

  const grassTufts = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      height: 3 + Math.random() * 5,
    }));
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border"
      style={{
        background:
          "linear-gradient(135deg, #1a3264 0%, #2d5bb8 50%, #4a7de0 100%)",
        height: 104,
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes bunny-hop-right {
          0% {
            transform: translateX(-120px) translateY(0) scale(1, 1);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          10% {
            transform: translateX(0px) translateY(-20px) scale(0.9, 1.1);
          }
          20% {
            transform: translateX(80px) translateY(0) scale(1, 1);
          }
          30% {
            transform: translateX(160px) translateY(-18px) scale(0.9, 1.1);
          }
          40% {
            transform: translateX(240px) translateY(0) scale(1, 1);
          }
          50% {
            transform: translateX(320px) translateY(-22px) scale(0.9, 1.1);
          }
          60% {
            transform: translateX(400px) translateY(0) scale(1, 1);
          }
          70% {
            transform: translateX(480px) translateY(-16px) scale(0.9, 1.1);
          }
          80% {
            transform: translateX(560px) translateY(0) scale(1, 1);
          }
          90% {
            transform: translateX(640px) translateY(-14px) scale(0.9, 1.1);
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translateX(720px) translateY(0) scale(1, 1);
            opacity: 0;
          }
        }
        @keyframes bunny-hop-left {
          0% {
            transform: translateX(720px) translateY(0) scale(-1, 1);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          10% {
            transform: translateX(640px) translateY(-20px) scale(-0.9, 1.1);
          }
          20% {
            transform: translateX(560px) translateY(0) scale(-1, 1);
          }
          30% {
            transform: translateX(480px) translateY(-18px) scale(-0.9, 1.1);
          }
          40% {
            transform: translateX(400px) translateY(0) scale(-1, 1);
          }
          50% {
            transform: translateX(320px) translateY(-22px) scale(-0.9, 1.1);
          }
          60% {
            transform: translateX(240px) translateY(0) scale(-1, 1);
          }
          70% {
            transform: translateX(160px) translateY(-16px) scale(-0.9, 1.1);
          }
          80% {
            transform: translateX(80px) translateY(0) scale(-1, 1);
          }
          90% {
            transform: translateX(0px) translateY(-14px) scale(-0.9, 1.1);
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translateX(-120px) translateY(0) scale(-1, 1);
            opacity: 0;
          }
        }
        @keyframes carrot-wiggle {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes cloud-drift {
          0% { transform: translateX(0); }
          50% { transform: translateX(30px); }
          100% { transform: translateX(0); }
        }
        @keyframes grass-sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wiki-bunny, .wiki-carrot, .wiki-cloud, .wiki-grass { animation: none !important; }
        }
      `}</style>

      {/* Clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {clouds.map((c, i) => (
          <div
            key={`cloud-${i}`}
            className="wiki-cloud absolute"
            style={{
              left: `${c.left}%`,
              top: `${c.top}%`,
              opacity: c.opacity,
              transform: `scale(${c.scale})`,
              animation: `cloud-drift ${c.speed}s ease-in-out ${Math.random() * 4}s infinite`,
            }}
          >
            <svg width="60" height="24" viewBox="0 0 60 24" fill="white">
              <ellipse cx="18" cy="14" rx="14" ry="10" />
              <ellipse cx="36" cy="12" rx="18" ry="12" />
              <ellipse cx="50" cy="15" rx="10" ry="7" />
            </svg>
          </div>
        ))}
      </div>

      {/* Grass tufts */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        {grassTufts.map((g, i) => (
          <div
            key={`grass-${i}`}
            className="wiki-grass absolute"
            style={{
              left: `${g.left}%`,
              bottom: 0,
              width: 2,
              height: g.height,
              background: "#4CAF50",
              borderRadius: "1px",
              opacity: 0.4,
              transformOrigin: "bottom center",
              animation: `grass-sway ${2 + Math.random() * 2}s ease-in-out ${Math.random() * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Carrots scattered on ground */}
      <div className="absolute inset-0 pointer-events-none">
        {carrots.map((c, i) => (
          <div
            key={`carrot-${i}`}
            className="wiki-carrot absolute"
            style={{
              left: `${c.left}%`,
              top: `${c.top}%`,
              animation: `carrot-wiggle ${c.duration}s ease-in-out ${c.delay}s infinite`,
            }}
          >
            <CarrotSVG size={c.size} />
          </div>
        ))}
      </div>

      {/* Bunnies hopping across */}
      <div className="absolute inset-0 pointer-events-none">
        {bunnies.map((b, i) => (
          <div
            key={`bunny-${i}`}
            className="wiki-bunny absolute"
            style={{
              left: `${b.left}%`,
              top: `${b.startY}%`,
              animation: `bunny-hop-${b.direction} ${b.speed}s linear ${b.delay}s infinite`,
            }}
          >
            <BunnySVG color={b.color} size={b.size} />
          </div>
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

export default BunniesBanner;
