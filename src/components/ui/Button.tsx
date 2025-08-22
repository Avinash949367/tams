import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        secondary: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
        destructive: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl",
        outline: "border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white focus:ring-purple-500",
        link: "text-purple-600 hover:text-purple-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ 
  className, 
  variant, 
  size, 
  loading = false,
  disabled,
  children,
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="spinner mr-2" />
      )}
      {children}
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </button>
  );
}

// Special button variants for specific use cases
export function PrimaryButton({ className, ...props }: ButtonProps) {
  return <Button variant="primary" className={cn("group", className)} {...props} />;
}

export function SecondaryButton({ className, ...props }: ButtonProps) {
  return <Button variant="secondary" className={className} {...props} />;
}

export function IconButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button 
      size="icon" 
      variant="ghost" 
      className={cn("rounded-full", className)} 
      {...props}
    >
      {children}
    </Button>
  );
}


