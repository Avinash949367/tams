import React, { useEffect, useState } from "react";

export function Dice({ value, rolling }: { value?: number | null; rolling?: boolean }) {
  const [display, setDisplay] = useState<number | null>(value ?? null);
  useEffect(() => {
    if (!rolling) { setDisplay(value ?? null); return; }
    let ticks = 0;
    const iv = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks > 20) clearInterval(iv as any);
    }, 80);
    return () => clearInterval(iv as any);
  }, [rolling, value]);
  return (
    <div className="w-24 h-24 rounded-2xl grid place-items-center text-4xl font-bold border bg-white shadow-sm">
      {display ?? "🎲"}
    </div>
  );
}


