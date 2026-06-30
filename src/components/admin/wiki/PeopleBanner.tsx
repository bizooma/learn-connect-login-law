import { useMemo } from "react";

interface PeopleBannerProps {
  headline?: string;
  subtext?: string;
}

interface Person {
  startY: number;
  size: number;
  delay: number;
  speed: number;
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  direction: "left" | "right";
}

const SKIN = ["#F5C9A6", "#E8B48A", "#C68B5E", "#8D5524", "#FFE0BD", "#D2A074"];
const SHIRT = ["#213C82", "#E94560", "#4CAF50", "#FF9800", "#9C27B0", "#00BCD4", "#FFFFFF"];
const PANTS = ["#1A237E", "#3E2723", "#37474F", "#212121", "#5D4037"];
const HAIR = ["#2C1810", "#5D4037", "#8B4513", "#1A1A1A", "#D4A574", "#A0522D"];

const PersonSVG = ({
  size,
  skin,
  shirt,
  pants,
  hair,
}: {
  size: number;
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
}) => (
  <svg width={size} height={size * 1.8} viewBox="0 0 20 36" fill="none">
    {/* Head */}
    <circle cx="10" cy="5" r="3.5" fill={skin} />
    {/* Hair */}
    <path d="M6.5 4 Q6 1 10 1 Q14 1 13.5 4 Q13 2.5 10 2.5 Q7 2.5 6.5 4 Z" fill={hair} />
    {/* Body / shirt */}
    <rect x="6" y="9" width="8" height="10" rx="1.5" fill={shirt} />
    {/* Arms - swinging via group transform handled by parent walk anim */}
    <rect x="4.5" y="9.5" width="1.8" height="7" rx="0.9" fill={shirt} className="person-arm-l" />
    <rect x="13.7" y="9.5" width="1.8" height="7" rx="0.9" fill={shirt} className="person-arm-r" />
    {/* Pants */}
    <rect x="6.5" y="18.5" width="3" height="9" rx="0.8" fill={pants} className="person-leg-l" />
    <rect x="10.5" y="18.5" width="3" height="9" rx="0.8" fill={pants} className="person-leg-r" />
    {/* Shoes */}
    <ellipse cx="8" cy="28.5" rx="1.8" ry="0.8" fill="#1a1a1a" />
    <ellipse cx="12" cy="28.5" rx="1.8" ry="0.8" fill="#1a1a1a" />
    {/* Face */}
    <circle cx="8.8" cy="5" r="0.4" fill="#222" />
    <circle cx="11.2" cy="5" r="0.4" fill="#222" />
    <path d="M9 6.3 Q10 7 11 6.3" stroke="#222" strokeWidth="0.3" fill="none" />
  </svg>
);

const PeopleBanner = ({
  headline = "Keep your account organized with groups",
  subtext = "Bulk-share content and gate features by role, department, team and more.",
}: PeopleBannerProps) => {
  const people = useMemo<Person[]>(() => {
    return Array.from({ length: 14 }, () => ({
      startY: 25 + Math.random() * 45,
      size: 14 + Math.random() * 8,
      delay: Math.random() * 20,
      speed: 28 + Math.random() * 18,
      skin: SKIN[Math.floor(Math.random() * SKIN.length)],
      shirt: SHIRT[Math.floor(Math.random() * SHIRT.length)],
      pants: PANTS[Math.floor(Math.random() * PANTS.length)],
      hair: HAIR[Math.floor(Math.random() * HAIR.length)],
      direction: Math.random() > 0.5 ? "right" : "left",
    }));
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border"
      style={{ backgroundColor: "#FFDA00", height: 104 }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes person-walk-right {
          0% { transform: translateX(-60px) scaleX(1); }
          100% { transform: translateX(calc(100vw + 60px)) scaleX(1); }
        }
        @keyframes person-walk-left {
          0% { transform: translateX(calc(100vw + 60px)) scaleX(-1); }
          100% { transform: translateX(-60px) scaleX(-1); }
        }
        @keyframes person-bob {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-1.5px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-1.5px); }
        }
        .person-leg-l { transform-origin: 8px 18.5px; animation: leg-l 1.1s ease-in-out infinite; }
        .person-leg-r { transform-origin: 12px 18.5px; animation: leg-r 1.1s ease-in-out infinite; }
        .person-arm-l { transform-origin: 5.4px 9.5px; animation: leg-r 1.1s ease-in-out infinite; }
        .person-arm-r { transform-origin: 14.6px 9.5px; animation: leg-l 1.1s ease-in-out infinite; }
        @keyframes leg-l {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes leg-r {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wiki-person, .person-leg-l, .person-leg-r, .person-arm-l, .person-arm-r { animation: none !important; }
        }
      `}</style>

      {/* Sun */}
      <div
        className="absolute"
        style={{
          right: 16,
          top: 10,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#FFF3A0",
          boxShadow: "0 0 20px rgba(255,255,255,0.6)",
          opacity: 0.7,
        }}
      />

      {/* Ground line */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: 6,
          height: 2,
          background: "rgba(33,60,130,0.25)",
        }}
      />

      {/* People walking */}
      <div className="absolute inset-0 pointer-events-none">
        {people.map((p, i) => (
          <div
            key={`person-${i}`}
            className="wiki-person absolute"
            style={{
              top: `${p.startY}%`,
              left: 0,
              animation: `person-walk-${p.direction} ${p.speed}s linear ${p.delay}s infinite`,
            }}
          >
            <div style={{ animation: "person-bob 1.1s ease-in-out infinite" }}>
              <PersonSVG
                size={p.size}
                skin={p.skin}
                shirt={p.shirt}
                pants={p.pants}
                hair={p.hair}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col items-start justify-center px-5">
        <h3 className="text-[#213C82] font-semibold text-lg">{headline}</h3>
        <p className="text-[#213C82]/80 text-sm mt-1">{subtext}</p>
      </div>
    </div>
  );
};

export default PeopleBanner;
