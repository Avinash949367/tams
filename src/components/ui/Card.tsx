import React from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-gray-200/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{title}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1 sm:mt-2">{subtitle}</div>}
    </div>
  );
}


