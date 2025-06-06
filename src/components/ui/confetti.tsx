
import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  duration?: number;
}

const Confetti: React.FC<ConfettiProps> = ({ 
  active, 
  onComplete, 
  duration = 3000 
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    // Create initial confetti pieces
    const initialPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 100; i++) {
      initialPieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 6,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
    setPieces(initialPieces);

    // Animation loop
    const animationFrame = () => {
      setPieces(currentPieces => 
        currentPieces.map(piece => ({
          ...piece,
          x: piece.x + piece.speedX,
          y: piece.y + piece.speedY,
          rotation: piece.rotation + piece.rotationSpeed,
          speedY: piece.speedY + 0.1, // gravity
        })).filter(piece => piece.y < window.innerHeight + 50)
      );
    };

    const interval = setInterval(animationFrame, 16);

    // Clean up after duration
    const timeout = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [active, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: piece.x,
            top: piece.y,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size,
            transform: `rotate(${piece.rotation}deg)`,
            transition: 'none',
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
