import React from "react";

export function Notice({ type = "info", children }: { type?: "info" | "success" | "warn" | "error"; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    info: "text-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm",
    success: "text-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-sm",
    warn: "text-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-sm",
    error: "text-red-800 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-sm",
  };
  return (
    <div className={`px-4 py-3 rounded-xl ${styles[type]} backdrop-blur-sm transition-all duration-200`}>
      {children}
    </div>
  );
}


