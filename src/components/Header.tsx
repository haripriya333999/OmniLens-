import React, { useState, useRef, useEffect } from 'react';
import { Sliders, HelpCircle, Eye, Search, FileText, Cpu, ChevronDown, Footprints } from 'lucide-react';
import { ActiveTask, EngineMode } from '../types';

interface HeaderProps {
  activeTask: ActiveTask;
  onSelectTask: (task: ActiveTask) => void;
  onOpenAccessibility: () => void;
  onOpenAbout: () => void;
  onOpenEngine: () => void;
  engineMode: EngineMode;
  isBackendHealthy: boolean;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTask,
  onSelectTask,
  onOpenAccessibility,
  onOpenAbout,
  onOpenEngine,
  engineMode,
  isBackendHealthy,
  onGoHome,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#101828] text-white border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: OmniLens Logo and Name */}
        <button
          onClick={onGoHome || (() => onSelectTask('describe'))}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2] rounded-xl p-1"
          aria-label="OmniLens Home"
        >
          <div className="w-9 h-9 rounded-xl bg-[#6845C2] text-white flex items-center justify-center font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform">
            OL
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-none">
              OmniLens
            </span>
            <span className="text-[10px] text-white/60 font-medium tracking-wide">
              Voice-First Vision
            </span>
          </div>
        </button>

        {/* Middle: 3 Primary Navigation Tasks */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold overflow-x-auto py-1"
        >
          <button
            onClick={() => onSelectTask('describe')}
            className={`whitespace-nowrap shrink-0 transition-all py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2] ${
              activeTask === 'describe'
                ? 'bg-[#6845C2] text-white font-bold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-current={activeTask === 'describe' ? 'page' : undefined}
            aria-label="Describe Surroundings"
          >
            <Eye className="w-4 h-4" />
            <span>Describe</span>
          </button>

          <button
            onClick={() => onSelectTask('find')}
            className={`whitespace-nowrap shrink-0 transition-all py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2] ${
              activeTask === 'find'
                ? 'bg-[#6845C2] text-white font-bold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-current={activeTask === 'find' ? 'page' : undefined}
            aria-label="Find an Object"
          >
            <Search className="w-4 h-4" />
            <span>Find Object</span>
          </button>

          <button
            onClick={() => onSelectTask('read')}
            className={`whitespace-nowrap shrink-0 transition-all py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2] ${
              activeTask === 'read'
                ? 'bg-[#6845C2] text-white font-bold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-current={activeTask === 'read' ? 'page' : undefined}
            aria-label="Read Text Aloud"
          >
            <FileText className="w-4 h-4" />
            <span>Read Text</span>
          </button>

          <button
            onClick={() => onSelectTask('safepath')}
            className={`whitespace-nowrap shrink-0 transition-all py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2] ${
              activeTask === 'safepath'
                ? 'bg-[#087F73] text-white font-bold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-current={activeTask === 'safepath' ? 'page' : undefined}
            aria-label="SafePath Walking Path Awareness"
          >
            <Footprints className="w-4 h-4 text-[#57D6C5]" />
            <span>SafePath</span>
          </button>

          <button
            onClick={() => onSelectTask('live')}
            className={`whitespace-nowrap shrink-0 transition-all py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2] ${
              activeTask === 'live'
                ? 'bg-[#087F73] text-white font-bold shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            aria-current={activeTask === 'live' ? 'page' : undefined}
            aria-label="Live Detection Stream"
          >
            <span className="w-2 h-2 rounded-full bg-[#57D6C5] animate-pulse" />
            <span>Live Stream</span>
          </button>
        </nav>

        {/* Right: Showcase Return, Help/More & Accessibility Settings */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer"
              title="Return to Public Showcase Landing Page"
            >
              <span>Showcase Site</span>
            </button>
          )}
          {/* More Dropdown (Model info, backend mode) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
              aria-label="More options and engine information"
              aria-expanded={isMoreOpen}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">Help & Info</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#101828] border border-white/15 shadow-xl py-2 z-50 text-xs">
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenAbout();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 text-white/90 hover:text-white cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#6845C2]" />
                  <div>
                    <div className="font-bold">Model Info & Benchmark</div>
                    <div className="text-[10px] text-white/60">Everyday classes & metrics</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenEngine();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 text-white/90 hover:text-white cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-[#087F73]" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>Engine Settings</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isBackendHealthy ? 'bg-[#087F73]' : 'bg-[#A65312]'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-white/60">
                      {engineMode === 'gemini-vision' ? 'Active: Vision API' : engineMode}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Accessibility Settings Button */}
          <button
            onClick={onOpenAccessibility}
            className="px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-[#6845C2] hover:bg-[#5736a8] rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
            aria-label="Open accessibility settings dialog"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Accessibility</span>
            <span className="sm:hidden">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
