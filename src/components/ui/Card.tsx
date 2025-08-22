import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "glass";
}

export function Card({ 
  className, 
  children, 
  variant = "default",
  ...props 
}: CardProps) {
  const variants = {
    default: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50",
    elevated: "bg-white dark:bg-gray-800 shadow-xl border-0",
    outlined: "bg-transparent border-2 border-gray-200 dark:border-gray-700",
    glass: "glass border border-white/20 dark:border-gray-700/50",
  };

  return (
    <div 
      className={cn(
        "rounded-2xl p-6 transition-all duration-300 hover:shadow-lg",
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-3 mb-2">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn("flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700", className)} {...props}>
      {children}
    </div>
  );
}

// Special card variants
export function FeatureCard({ className, children, ...props }: CardProps) {
  return (
    <Card 
      variant="glass" 
      className={cn("group hover:scale-105 transition-transform duration-300", className)} 
      {...props}
    >
      {children}
    </Card>
  );
}

export function StatsCard({ className, children, ...props }: CardProps) {
  return (
    <Card 
      variant="elevated" 
      className={cn("text-center", className)} 
      {...props}
    >
      {children}
    </Card>
  );
}


