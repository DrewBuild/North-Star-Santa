import { useMemo } from "react";

interface SnowProps {
  count?: number;
}

const Snow = ({ count = 18 }: SnowProps) => {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 8 + Math.random() * 18,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * 8,
        opacity: 0.5 + Math.random() * 0.5,
      })),
    [count],
  );

  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            opacity: f.opacity,
          }}
        >
          ❄
        </span>
      ))}
    </div>
  );
};

export default Snow;
