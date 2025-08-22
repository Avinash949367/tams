import React from "react";
import { cn } from "@/lib/utils";

interface NoticeProps {
  type?: "info" | "success" | "warn" | "error";
  children: React.ReactNode;
  className?: string;
}

export function Notice({ type = "info", children, className }: NoticeProps) {
  const styles: Record<string, string> = {
    info: "text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
    success: "text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
    warn: "text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
    error: "text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
  };
  
  return (
    <div className={cn(
      "px-4 py-3 rounded-xl backdrop-blur-sm transition-all duration-200",
      styles[type],
      className
    )}>
      {children}
    </div>
  );
}


