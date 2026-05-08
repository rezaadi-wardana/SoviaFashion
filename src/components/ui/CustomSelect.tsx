"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = "Select...", className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-sovia-200 bg-sovia-50 dark:bg-sovia-800 px-4 py-3 text-sm text-sovia-700 dark:text-sovia-200 focus:outline-none focus:ring-2 focus:ring-accent-400 transition-all",
          isOpen ? "ring-2 ring-accent-400" : ""
        )}
      >
        <span className="truncate pr-4">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 shrink-0 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 max-h-60 w-full overflow-auto rounded-xl border border-sovia-200/60 dark:border-sovia-700/60 bg-white dark:bg-sovia-900 shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="p-1.5 flex flex-col gap-0.5">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none hover:bg-sovia-100 dark:hover:bg-sovia-800 focus:bg-sovia-100 transition-colors",
                  value === option.value ? "bg-sovia-50 dark:bg-sovia-800/80 font-medium text-sovia-900 dark:text-sovia-50" : "text-sovia-600 dark:text-sovia-300"
                )}
              >
                {value === option.value && (
                  <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                  </span>
                )}
                <span className="truncate">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
