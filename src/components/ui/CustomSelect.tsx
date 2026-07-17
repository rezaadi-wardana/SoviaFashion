"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  image?: string;
  category?: string;
  badge?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Komponen Dropdown Select kustom yang mendukung opsi berupa teks, gambar varian, badge, dan kategori.
 * 
 * @param options - Array opsi pilihan (berupa value, label, gambar, kategori, dll)
 * @param value - Nilai saat ini yang terpilih
 * @param onChange - Fungsi callback ketika nilai berubah
 * @param placeholder - Teks placeholder jika belum ada pilihan
 * @param className - Kelas CSS tambahan untuk styling container dropdown
 */
export function CustomSelect({ options, value, onChange, placeholder = "Select...", className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    // Handler untuk menutup dropdown jika pengguna mengeklik di luar container dropdown
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
          "flex h-12 w-full items-center justify-between rounded-xl border border-sovia-200 bg-sovia-100  px-4 py-3 text-sm text-sovia-700 focus:outline-none focus:ring-2 focus:ring-accent-400 transition-all",
          isOpen ? "ring-2 ring-accent-400" : ""
        )}
      >
        <span className="truncate pr-4">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-50 shrink-0 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 max-h-60 w-full overflow-auto rounded-xl border border-sovia-200/60 bg-sovia-100 shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="p-1.5 flex flex-col gap-0.5">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none hover:bg-sovia-200 focus:bg-sovia-100 transition-colors",
                  value === option.value ? "bg-sovia-200/50 font-medium text-sovia-900" : "text-sovia-900"
                )}
              >
                {value === option.value && (
                  <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4 text-sovia-900" />
                  </span>
                )}
                <div className="flex items-center gap-3 w-full">
                  {option.image && (
                    <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0 bg-sovia-50 border border-sovia-200">
                      <img src={option.image} alt={option.label} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between flex-1 overflow-hidden gap-2">
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="truncate">{option.label}</span>
                      {option.category && (
                        <span className="text-xs text-sovia-600 truncate opacity-80">{option.category}</span>
                      )}
                    </div>
                    {option.badge && (
                      <div className="flex-shrink-0">
                        {option.badge}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
