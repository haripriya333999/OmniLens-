import React, { useState, useEffect } from 'react';
import {
  Eye,
  Search,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Square,
  ArrowLeft,
  FlipHorizontal,
  Compass,
} from 'lucide-react';
import { ActiveTask, AccessibilitySettings, EngineMode, HealthResponse } from './types';
import { Header } from './components/Header';
import { VoiceAssistantController } from './components/VoiceAssistantController';
import { DescribeSurroundingsView } from './components/DescribeSurroundingsView';
import { FindObjectView } from './components/FindObjectView';
import { ReadTextView } from './components/ReadTextView';
import { AccessibilityModal } from './components/AccessibilityModal';
import { AboutModelModal } from './components/AboutModelModal';
import { BackendModal } from './components/BackendModal';
import { apiService } from './services/apiService';
import { speechService } from './services/speech';
import { HERO_BANNER_SRC } from './data/sampleImages';

export default function App() {
  const [activeTask, setActiveTask] = useState<ActiveTask>('describe');
  const [showDashboard, setShowDashboard] = useState<boolean>(true);
  const [engineMode, setEngineMode] = useState<EngineMode>(apiService.getEngineMode());
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Accessibility & Modals
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isEngineOpen, setIsEngineOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Persistent accessibility configuration
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('omnilens_accessibility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      fontSize: 'normal',
      highContrast: false,
      reduceMotion: false,
      speechRate: 1.0,
      speechPitch: 1.0,
      autoSpeakResults: true,
      announcePosition: true,
      soundEffects: true,
      invertLeftRight: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('omnilens_accessibility', JSON.stringify(settings));
    speechService.setRate(settings.speechRate);
    speechService.setPitch(settings.speechPitch);
  }, [settings]);

  useEffect(() => {
    const unsub = speechService.subscribe((speaking: boolean) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  const refreshHealth = async () => {
    try {
      const res = await apiService.checkHealth();
      setHealth(res);
    } catch (e) {
      setHealth(null);
    }
  };

  useEffect(() => {
    refreshHealth();
  }, [engineMode]);

  const handleUpdateSettings = (newPartial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const handleSelectTaskFromNav = (task: ActiveTask) => {
    setActiveTask(task);
    setShowDashboard(false);
  };

  const handleEngineModeChange = (mode: EngineMode) => {
    apiService.setEngineMode(mode);
    setEngineMode(mode);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8FAFC] text-[#101828] selection:bg-[#6845C2] selection:text-white ${
        settings.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* 1. Simple Top Navigation */}
      <Header
        activeTask={showDashboard ? ('describe' as ActiveTask) : activeTask}
        onSelectTask={handleSelectTaskFromNav}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenEngine={() => setIsEngineOpen(true)}
        engineMode={engineMode}
        isBackendHealthy={health?.status === 'healthy'}
        onGoHome={() => setShowDashboard(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 2. Voice Assistance: One compact, persistent panel */}
        <VoiceAssistantController
          onSelectTask={handleSelectTaskFromNav}
          onRunAction={(task) => {
            setActiveTask(task);
            setShowDashboard(false);
          }}
          isSpeaking={isSpeaking}
          onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        />

        {showDashboard ? (
          /* 3. Main Homepage: Three Equal Feature Cards */
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828]">
                How can I help you?
              </h1>
              <p className="text-sm text-[#101828]/70 mt-1 leading-relaxed">
                Choose a task below or say commands such as “Describe surroundings”, “Find my bottle”, or “Read text”.
              </p>
            </div>

            {/* Three Equal Visual Weight Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Describe Surroundings */}
              <div className="p-7 rounded-3xl bg-white border border-[#101828]/10 shadow-sm hover:shadow-md hover:border-[#6845C2]/40 transition-all flex flex-col justify-between space-y-6 group">
                <div className="space-y-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#6845C2]/10 text-[#6845C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Eye className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-[#101828] group-hover:text-[#6845C2] transition-colors">
                    1. Describe Surroundings
                  </h2>
                  <p className="text-xs sm:text-sm text-[#101828]/70 leading-relaxed">
                    Provides a short spoken summary of the room, nearby objects, visible people, and relevant activities.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTask('describe');
                    setShowDashboard(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6845C2] hover:bg-[#5736a8] text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
                  aria-label="Describe my surroundings"
                >
                  <Eye className="w-4 h-4" />
                  <span>Describe my surroundings</span>
                </button>
              </div>

              {/* Card 2: Find an Object */}
              <div className="p-7 rounded-3xl bg-white border border-[#101828]/10 shadow-sm hover:shadow-md hover:border-[#6845C2]/40 transition-all flex flex-col justify-between space-y-6 group">
                <div className="space-y-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#6845C2]/10 text-[#6845C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-[#101828] group-hover:text-[#6845C2] transition-colors">
                    2. Find an Object
                  </h2>
                  <p className="text-xs sm:text-sm text-[#101828]/70 leading-relaxed">
                    Accepts a spoken or typed object name, detects matching objects, and announces their approximate position.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTask('find');
                    setShowDashboard(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6845C2] hover:bg-[#5736a8] text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
                  aria-label="Find an object"
                >
                  <Search className="w-4 h-4" />
                  <span>Find an object</span>
                </button>
              </div>

              {/* Card 3: Read Text Aloud */}
              <div className="p-7 rounded-3xl bg-white border border-[#101828]/10 shadow-sm hover:shadow-md hover:border-[#6845C2]/40 transition-all flex flex-col justify-between space-y-6 group">
                <div className="space-y-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#6845C2]/10 text-[#6845C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-[#101828] group-hover:text-[#6845C2] transition-colors">
                    3. Read Text Aloud
                  </h2>
                  <p className="text-xs sm:text-sm text-[#101828]/70 leading-relaxed">
                    Extracts text from labels, signs, documents, and packaging, then reads it aloud in a logical order.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTask('read');
                    setShowDashboard(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6845C2] hover:bg-[#5736a8] text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
                  aria-label="Read text aloud"
                >
                  <FileText className="w-4 h-4" />
                  <span>Read text aloud</span>
                </button>
              </div>
            </div>

            {/* Related Everyday Vision Scene Photo & Guidance */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#101828]/10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#087F73] bg-[#087F73]/10 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Everyday Vision Scene Assistance</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#101828] tracking-tight">
                  Clear, spoken directional guidance for your surroundings
                </h3>
                <p className="text-xs sm:text-sm text-[#101828]/70 leading-relaxed">
                  OmniLens identifies everyday items such as doors, windows, eyeglasses, drink bottles, laptops, and human gestures. When using a laptop webcam, spatial mirror correction keeps your physical left and right directions accurate.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      setActiveTask('describe');
                      setShowDashboard(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#6845C2] text-white text-xs font-bold hover:bg-[#5736a8] transition-all cursor-pointer shadow-sm"
                  >
                    Explore Sample Room
                  </button>
                  <button
                    onClick={() => setIsAccessibilityOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#101828]/15 text-[#101828] text-xs font-semibold hover:bg-[#101828]/5 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#6845C2]" />
                    <span>Invert Camera Left/Right</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md border border-[#101828]/10 bg-slate-100 flex items-center justify-center">
                <img
                  src={HERO_BANNER_SRC}
                  alt="Everyday indoor desk scene with laptop, glasses, water bottle, and doorway"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                  <p className="text-xs text-white font-medium">
                    Everyday scene: study desk, doorway on left, window on right, bottle & device detection
                  </p>
                </div>
              </div>
            </div>

            {/* Model & System Status Strip */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#101828]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-[#101828]/80">
                <span className="w-2.5 h-2.5 rounded-full bg-[#087F73] shrink-0" />
                <span className="font-semibold">Engine status:</span>
                <span className="font-mono text-[#6845C2]">
                  {engineMode === 'gemini-vision'
                    ? 'Everyday Vision Model (Online)'
                    : 'FastAPI Local Engine'}
                </span>
                <span className="text-[#101828]/40 hidden sm:inline">|</span>
                <span className="text-[#101828]/60 hidden sm:inline">
                  Spatial left/right calibrated
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAboutOpen(true)}
                  className="font-bold text-[#6845C2] hover:underline cursor-pointer"
                >
                  View Model Details
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Feature Workspace */
          <div className="space-y-6">
            {/* Top Return & Breadcrumb Bar (Single clean row, no duplicate button rows) */}
            <div className="flex items-center justify-between gap-4 p-3.5 bg-white rounded-2xl border border-[#101828]/10 shadow-sm">
              <button
                onClick={() => setShowDashboard(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#101828] hover:bg-[#F8FAFC] border border-[#101828]/15 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
                aria-label="Back to Overview"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#6845C2]" />
                <span>Back to Overview</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#101828]/60">Active Feature:</span>
                <span className="text-xs font-bold text-[#6845C2] bg-[#6845C2]/10 px-3 py-1 rounded-full">
                  {activeTask === 'describe'
                    ? '1. Describe Surroundings'
                    : activeTask === 'find'
                    ? '2. Find an Object'
                    : '3. Read Text Aloud'}
                </span>
              </div>
            </div>

            {/* Feature Viewport */}
            {activeTask === 'describe' && (
              <DescribeSurroundingsView
                highContrast={settings.highContrast}
                onSwitchTask={handleSelectTaskFromNav}
              />
            )}
            {activeTask === 'find' && (
              <FindObjectView
                highContrast={settings.highContrast}
                onSwitchTask={handleSelectTaskFromNav}
              />
            )}
            {activeTask === 'read' && (
              <ReadTextView
                highContrast={settings.highContrast}
                onSwitchTask={handleSelectTaskFromNav}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#101828]/10 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#101828]/60">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-[#101828]">OmniLens</span>
            <span>·</span>
            <span>Voice-first assistive visual companion</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Assistive orientation tool</span>
            <span>·</span>
            <span>Not a replacement for a cane, guide dog, or mobility orientation</span>
          </div>
        </div>
      </footer>

      {/* Accessibility Settings Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* About Model Modal */}
      <AboutModelModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Backend Setup Modal */}
      <BackendModal
        isOpen={isEngineOpen}
        onClose={() => setIsEngineOpen(false)}
        engineMode={engineMode}
        onUpdateEngineMode={handleEngineModeChange}
        health={health}
        onRefreshHealth={refreshHealth}
      />
    </div>
  );
}
