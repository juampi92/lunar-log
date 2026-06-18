import { useMemo, type ReactNode } from 'react';

interface Star {
  x: number;
  y: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailySeed(): number {
  const today = new Date();
  return Number(`${today.getFullYear()}${today.getMonth()}${today.getDate()}`);
}

function generateStars(numStars: number, width: number, height: number): Star[] {
  const seed = getDailySeed();
  const stars: Star[] = [];
  for (let i = 0; i < numStars; i++) {
    const x = seededRandom(seed + i) * width;
    const y = seededRandom(seed + i + 100) * (height * 0.8);
    stars.push({ x, y });
  }
  return stars;
}

interface NightSkyBackgroundProps {
  children: ReactNode;
}

export default function NightSkyBackground({ children }: NightSkyBackgroundProps) {
  const stars = useMemo(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return generateStars(30, width, height);
  }, []);

  return (
    <>
      <div className="nightsky" aria-hidden="true">
        <div className="nightsky__stars">
          {stars.map((star, index) => (
            <span key={index} className="nightsky__star" style={{ left: star.x, top: star.y }} />
          ))}
        </div>
      </div>
      <div className="app__content">{children}</div>
    </>
  );
}
