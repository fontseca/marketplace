"use client";

import { useEffect, useState } from "react";

type Props = {
  expiresAt: string | Date;
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

export function OfferCountdown({ expiresAt }: Props) {
  const [remaining, setRemaining] = useState(
    formatTime(new Date(expiresAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(formatTime(new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (new Date(expiresAt).getTime() < Date.now()) return null;

  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
      <span>Termina en:</span>
      <span>
        {remaining.days}d {remaining.hours}h {remaining.minutes}m {remaining.seconds}s
      </span>
    </div>
  );
}

