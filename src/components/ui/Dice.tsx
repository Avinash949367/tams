import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DiceProps {
  value?: number | null;
  rolling?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Dice({ value, rolling, size = "md", className }: DiceProps) {
  const [display, setDisplay] = useState<number | null>(value ?? null);
  
  useEffect(() => {
    if (!rolling) { 
      setDisplay(value ?? null); 
      return; 
    }
    let ticks = 0;
    const iv = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks > 20) clearInterval(iv as any);
    }, 80);
    return () => clearInterval(iv as any);
  }, [rolling, value]);

  const sizeClasses = {
    sm: "w-16 h-16 text-2xl",
    md: "w-20 h-20 sm:w-24 sm:h-24 text-3xl sm:text-4xl",
    lg: "w-28 h-28 sm:w-32 sm:h-32 text-4xl sm:text-5xl",
  };

  const dotPositions: Record<number, string[]> = {
    1: ["center"],
    2: ["top-left", "bottom-right"],
    3: ["top-left", "center", "bottom-right"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
  };

  const renderDots = (num: number) => {
    const positions = dotPositions[num] || [];
    return positions.map((pos, index) => (
      <div
        key={index}
        className={cn(
          "w-2 h-2 sm:w-3 sm:h-3 bg-gray-800 rounded-full",
          pos === "center" && "col-start-2 row-start-2",
          pos === "top-left" && "col-start-1 row-start-1",
          pos === "top-right" && "col-start-3 row-start-1",
          pos === "middle-left" && "col-start-1 row-start-2",
          pos === "middle-right" && "col-start-3 row-start-2",
          pos === "bottom-left" && "col-start-1 row-start-3",
          pos === "bottom-right" && "col-start-3 row-start-3"
        )}
      />
    ));
  };
  
  return (
    <div 
      className={cn(
        "relative rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105",
        sizeClasses[size],
        rolling && "animate-bounce",
        className
      )}
    >
      {display ? (
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 place-items-center p-2 sm:p-3">
          {renderDots(display)}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-2xl sm:text-3xl">🎲</span>
        </div>
      )}
      
      {/* Shimmer effect when rolling */}
      {rolling && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
      )}
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

// Special dice variants
export function RollingDice({ className, ...props }: DiceProps) {
  return (
    <div className="relative">
      <Dice {...props} rolling={true} className={className} />
      <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse" />
    </div>
  );
}

export function StaticDice({ className, ...props }: DiceProps) {
  return <Dice {...props} rolling={false} className={className} />;
}


