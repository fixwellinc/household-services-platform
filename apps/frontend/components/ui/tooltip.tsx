"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode;
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <div>{children}</div>;
};

interface TooltipProps {
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild }) => {
  if (asChild) {
    return <>{children}</>;
  }
  return <div>{children}</div>;
};

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
}

const TooltipContent: React.FC<TooltipContentProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border bg-white px-3 py-1.5 text-sm shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }