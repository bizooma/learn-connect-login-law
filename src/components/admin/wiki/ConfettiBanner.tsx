import { useMemo } from "react";

interface ConfettiBannerProps {
  headline?: string;
  subtext?: string;
}

interface ConfettiPiece {
  left: number;
  startY: number;
  size: number;
  shape: "circle" | "square" | "star" | "rect";
  color: string;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  opacity: number;
}

interface Popper {
  left: number;
  size: number;
  delay: number;
}

const CONFETTI_COUNT = 55;

const COLORS = [
  "#FFDA00",
  "#FFEA66",
  "#FFFFFF",
  "#FFD700",
  "#FFF5B8",
  "#6B9FFF",
];

const ConfettiBanner = ({
  headline = "Your team's playbook, all in one place.",
  subtext = "Policies, procedures, and the way we do things at New Frontier Immigration Law.",
}: ConfettiBannerProps) => {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: CONFETTI_COUNT }, () => ({
      left: 5 + Math.random() * 90,
      startY: 100 + Math.random() * 40,
      size: 3 + Math.random() * 7,
      shape: (["circle", "square", "star", "rect"] as const)[
        Math.floor(Math.random() * 4)
      ],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 4,
      duration: 2.5 + Math.random() * 2.5,
      drift: -25 + Math.random() * 50,
      rotate: Math.random() * 360,
      opacity: 0.7 + Math.random() * 0.3,
    }));
  }, []);

  const poppers = useMemo<Popper[]>(() => {
    return Array.from({ length: 4 }, () => ({
      left: 15 + Math.random() * 70,
      size: 10 + Math.random() * 8,
      delay: Math.random() * 2,
    }));
  }, []);

  const renderShape = (piece: ConfettiPiece) => {
    const base = {
      width: piece.size,
      height: piece.size,
      backgroundColor: piece.color,
      opacity: piece.opacity,
    };

    switch (piece.shape) {
      case "circle":
        return <span style={{ ...base, borderRadius: "50%" }} />;
      case "square":
        return (
          <span
            style={{
              ...base,
              borderRadius: "1px",
              transform: `rotate(${piece.rotate}deg)`,
            }}
          />
        );
      case "rect":
        return (
          <span
            style={{
              ...base,
              width: piece.size * 0.4,
              height: piece.size * 2,
              borderRadius: "1px",
              transform: `rotate(${piece.rotate}deg)`,
            }}
          />
        );
      case "star":
        return (
          <svg
            width={piece.size}
            height={piece.size}
            viewBox="0 0 24 24"
            fill={piece.color}
            style={{ opacity: piece.opacity }}
          >
            <path d="M12 0l3.09 6.26L22 7.27l-5 4.87 1.18 6.88L12 15.77l-6.18 3.25L7 12.14 2 7.27l6.91-1.01L12 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border"
      style={{
        background:
          "linear-gradient(135deg, #213C82 0%, #2d5bb8 50%, #3d6cd6 100%)",
        height: 104,
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes wiki-confetti-blast {
          0% {
            transform: translate3d(0, 0, 0) scale(0.2);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(0, -5px, 0) scale(1);
          }
          100% {
            transform: translate3d(var(--confetti-drift, 20px), -140px, 0) scale(0.6) rotate(var(--confetti-rotate, 180deg));
            opacity: 0;
          }
        }
        @keyframes wiki-popper-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.05); }
        }
        @keyframes wiki-sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wiki-confetti, .wiki-popper, .wiki-sparkle { animation: none !important; }
          .wiki-confetti { opacity: 0.2 !important; transform: none !important; }
        }
      `}</style>

      {/* Poppers */}
      <div className="absolute inset-0 pointer-events-none">
        {poppers.map((p, i) => (
          <div
            key={`popper-${i}`}
            className="wiki-popper absolute flex flex-col items-center"
            style={{
              left: `${p.left}%`,
              bottom: 6,
              animation: `wiki-popper-bounce 1.5s ease-in-out ${p.delay}s infinite`,
            }}
          >
            <svg
              width={p.size}
              height={p.size * 1.2}
              viewBox="0 0 20 24"
              fill="none"
            >
              <rect x="4" y="8" width="12" height="14" rx="2" fill="#FFDA00" />
              <polygon points="10,0 14,8 6,8" fill="#FFEA66" />
              <rect x="7" y="11" width="6" height="2" rx="1" fill="#213C82" opacity="0.4" />
              <rect x="7" y="15" width="6" height="2" rx="1" fill="#213C82" opacity="0.4" />
            </svg>
          </div>
        ))}
      </div>

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {pieces.map((p, i) => (
          <div
            key={`confetti-${i}`}
            className="wiki-confetti absolute"
            style={{
              left: `${p.left}%`,
              top: `${p.startY}%`,
              ["--confetti-drift" as any]: `${p.drift}px`,
              ["--confetti-rotate" as any]: `${p.rotate + 360}deg`,
              animation: `wiki-confetti-blast ${p.duration}s ease-out ${p.delay}s infinite`,
            }}
          >
            {renderShape(p)}
          </div>
        ))}
      </div>

      {/* Sparkle dots */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => {
          const left = 10 + Math.random() * 80;
          const top = 10 + Math.random() * 80;
          const delay = Math.random() * 3;
          const duration = 1.5 + Math.random() * 1.5;
          return (
            <span
              key={`sparkle-${i}`}
              className="wiki-sparkle absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                backgroundColor: "#FFDA00",
                animation: `wiki-sparkle ${duration}s ease-in-out ${delay}s infinite`,
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

export default ConfettiBanner;
