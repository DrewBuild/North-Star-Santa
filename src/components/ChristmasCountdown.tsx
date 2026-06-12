import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeUntilChristmas = (): TimeLeft => {
  const now = new Date();
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
  const christmas = new Date(year, 11, 25, 0, 0, 0, 0);
  const diff = Math.max(0, christmas.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const pad = (n: number) => String(n).padStart(2, "0");

const ChristmasCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeUntilChristmas);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeUntilChristmas()), 1000);
    return () => clearInterval(id);
  }, []);

  const isChristmas = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="santa-hand-cta countdown-card" aria-label="Countdown to Christmas">
      <div className="countdown-inner">
        {isChristmas ? (
          <p className="countdown-label text-gold font-christmas-display text-xs font-bold tracking-wide">
            Merry Christmas! 🎄
          </p>
        ) : (
          <>
            <p className="countdown-label">Countdown to Christmas</p>
            <div className="countdown-units">
              <span><strong>{timeLeft.days}</strong><em>Days</em></span>
              <span><strong>{pad(timeLeft.hours)}</strong><em>Hrs</em></span>
              <span><strong>{pad(timeLeft.minutes)}</strong><em>Min</em></span>
              <span><strong>{pad(timeLeft.seconds)}</strong><em>Sec</em></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChristmasCountdown;
