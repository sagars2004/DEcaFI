import React from 'react';
import { cn } from "@/lib/utils";

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const BentoItem = ({ className, children, ...props }: BentoItemProps) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden group",
        "border-[3px] border-slate-700 bg-slate-900 text-slate-100",
        "shadow-[6px_6px_0_0_#334155] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#334155]",
        "transition-all duration-200 ease-in-out",
        "flex flex-col p-5 sm:p-6",
        className
      )}
      {...props}
    >
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
      
      {/* Brutalist pattern overlay / texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
    </div>
  );
};
