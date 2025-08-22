import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="w-full block">
      {label && <div className="text-sm font-medium mb-2 text-gray-700">{label}</div>}
      <input 
        className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm ${className}`} 
        {...props} 
      />
    </label>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string };
export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <label className="w-full block">
      {label && <div className="text-sm font-medium mb-2 text-gray-700">{label}</div>}
      <select 
        className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm ${className}`} 
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };
export function Textarea({ label, className = "", ...props }: TextareaProps) {
  return (
    <label className="w-full block">
      {label && <div className="text-sm font-medium mb-2 text-gray-700">{label}</div>}
      <textarea 
        className={`w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none ${className}`} 
        {...props} 
      />
    </label>
  );
}


