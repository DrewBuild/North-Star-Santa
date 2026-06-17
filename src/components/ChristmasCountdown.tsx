import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getTimeUntilChristmas = (): TimeLeft => {
  const now = new Date();
  const christmasYear = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
  const christmas = new Date(christmasYear, 11, 25);
  const diff = Math.max(0, christmas.getTime() - now.getTime());

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const pad = (value: number) => String(value).padStart(2, "0");

const ChristmasCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilChristmas);

  useEffect(() => {
    const interval = window.setInterval(() => setTimeLeft(getTimeUntilChristmas()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="santa-hand-cta countdown-card" aria-label="Countdown until Christmas">
      <p className="countdown-label">Countdown Until Christmas</p>
      <div className="countdown-units">
        <span><strong>{timeLeft.days}</strong><em>Days</em></span>
        <span><strong>{pad(timeLeft.hours)}</strong><em>Hrs</em></span>
        <span><strong>{pad(timeLeft.minutes)}</strong><em>Min</em></span>
        <span><strong>{pad(timeLeft.seconds)}</strong><em>Sec</em></span>
      </div>
    </div>
  );
};

export default ChristmasCountdown;
