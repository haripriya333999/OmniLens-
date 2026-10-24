import React, { useState, useEffect } from 'react';
import {
  Eye,
  Search,
  FileText,
  Activity,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Square,
  ArrowLeft,
  FlipHorizontal,
  Compass,
  Play,
  Volume2,
  Footprints,
} from 'lucide-react';
import { ActiveTask, AccessibilitySettings, EngineMode, HealthResponse } from './types';
import { Header } from './components/Header';
import { ShowcaseLanding } from './components/ShowcaseLanding';
import { VoiceAssistantController } from './components/VoiceAssistantController';
import { DescribeSurroundingsView } from './components/DescribeSurroundingsView';
import { FindObjectView } from './components/FindObjectView';
import { ReadTextView } from './components/ReadTextView';
import { LiveDetectionView } from './components/LiveDetectionView';
import { SafePathView } from './components/SafePathView';
import { AccessibilityModal } from './components/AccessibilityModal';
import { AboutModelModal } from './components/AboutModelModal';
import { BackendModal } from './components/BackendModal';
import { apiService } from './services/apiService';
import { speechService } from './services/speech';
import { HERO_BANNER_SRC } from './data/sampleImages';

type ViewExperience = 'showcase' | 'workspace';

export default function App() {
  const [experience, setExperience] = useState<ViewExperience>('workspace');
  const [activeTask, setActiveTask] = useState<ActiveTask>('describe');
  const [showWorkspaceDashboard, setShowWorkspaceDashboard] = useState<boolean>(false);
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
    setShowWorkspaceDashboard(false);
    setExperience('workspace');
  };

  const handleEngineModeChange = (mode: EngineMode) => {
    apiService.setEngineMode(mode);
    setEngineMode(mode);
  };

  const handleLaunchFromShowcase = (initialTask: ActiveTask = 'describe') => {
    setActiveTask(initialTask);
    setShowWorkspaceDashboard(false);
    setExperience('workspace');
    speechService.speak(`Launching OmniLens workspace in ${initialTask} mode.`);
  };

  // If user selected Public Showcase Landing Experience
  if (experience === 'showcase') {
    return (
      <div className={settings.highContrast ? 'contrast-125' : ''}>
        <ShowcaseLanding
          onLaunchApp={handleLaunchFromShowcase}
          onOpenAccessibility={() => setIsAccessibilityOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenEngine={() => setIsEngineOpen(true)}
        />

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

  // Experience B: Accessible Application Workspace
  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8FAFC] text-[#101828] selection:bg-[#6845C2] selection:text-white ${
        settings.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* 1. Simple Top Navigation */}
      <Header
        activeTask={showWorkspaceDashboard ? ('describe' as ActiveTask) : activeTask}
        onSelectTask={handleSelectTaskFromNav}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenEngine={() => setIsEngineOpen(true)}
        engineMode={engineMode}
        isBackendHealthy={health?.status === 'healthy'}
        onGoHome={() => setExperience('showcase')}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 2. Unified Voice Controller */}
        <VoiceAssistantController
          onSelectTask={handleSelectTaskFromNav}
          onRunAction={(task) => {
            setActiveTask(task);
            setShowWorkspaceDashboard(false);
          }}
          isSpeaking={isSpeaking}
          onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        />

        {showWorkspaceDashboard ? (
          /* Workspace Mode Hub (3 Equal Primary Feature Cards + Live Stream) */
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828]">
                How can I help you?
              </h1>
              <p className="text-sm text-[#101828]/70 mt-1 leading-relaxed">
                Tap a task below or speak naturally: “Describe surroundings”, “Find my bottle”, or “Read text”.
              </p>
            </div>

            {/* 3 Equal Primary Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Describe Surroundings */}
              <div className="p-6 rounded-3xl bg-white border border-[#101828]/10 shadow-sm hover:shadow-md hover:border-[#6845C2]/40 transition-all flex flex-col justify-between space-y-6 group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#6845C2]/10 text-[#6845C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Eye className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-[#101828] group-hover:text-[#6845C2] transition-colors">
                    1. Describe Surroundings
                  </h2>
                  <p className="text-xs text-[#101828]/70 leading-relaxed">
                    Provides a short spoken summary of the room, nearby objects, visible people, and relevant activities.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTask('describe');
                    setShowWorkspaceDashboard(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6845C2] hover:bg-[#5736a8] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
                  aria-label="Describe my surroundings"
                >
                  <Eye className="w-4 h-4 text-white" />
                  <span>Describe my surroundings</span>
                </button>
              </div>

              {/* Card 2: Find an Object */}
              <div className="p-6 rounded-3xl bg-white border border-[#101828]/10 shadow-sm hover:shadow-md hover:border-[#6845C2]/40 transition-all flex flex-col justify-between space-y-6 group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#6845C2]/10 text-[#6845C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-[#101828] group-hover:text-[#6845C2] transition-colors">
                    2. Find an Object
                  </h2>
                  <p className="text-xs text-[#101828]/70 leading-relaxed">
                    Accepts a spoken or typed object name, detects matching objects, and announces their approximate position.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTask('find');
                    setShowWorkspaceDashboard(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6845C2] hover:bg-[#5736a8] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
                  aria-label="Find an object"
                >
                  <Search className="w-4 h-4 text-white" />
                  <span>Find an object</span>
                </button>
              </div>

              {/* Card 3: Read Text Aloud */}
              <div className="p-6 rounded-3xl bg-white border border-[#101828]/10 shadow-sm hover:shadow-md hover:border-[#6845C2]/40 transition-all flex flex-col justify-between space-y-6 group">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#6845C2]/10 text-[#6845C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-[#101828] group-hover:text-[#6845C2] transition-colors">
                    3. Read Text Aloud
                  </h2>
                  <p className="text-xs text-[#101828]/70 leading-relaxed">
                    Extracts text from labels, signs, documents, and packaging, then reads it aloud in a logical order.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveTask('read');
                    setShowWorkspaceDashboard(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#6845C2] hover:bg-[#5736a8] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6845C2]"
                  aria-label="Read text aloud"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Read text aloud</span>
                </button>
              </div>
            </div>

            {/* SafePath Walking Awareness Showcase Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#087F73]/15 via-[#087F73]/5 to-transparent border-2 border-[#087F73]/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#087F73] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Footprints className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#101828]">
                      SafePath — Walking Path Awareness
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#087F73] text-white font-bold">
                      OpenCV 5 Engine
                    </span>
                  </div>
                  <p className="text-xs text-[#101828]/70 max-w-2xl leading-relaxed">
                    Voice-first obstacle alert system for blind and low-vision users. Detects bags, boxes, chairs, and people in your floor corridor with Left/Center/Right sector localization and adaptive low-light contrast enhancement.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTask('safepath');
                  setShowWorkspaceDashboard(false);
                }}
                className="w-full md:w-auto py-3 px-6 rounded-xl bg-[#087F73] hover:bg-[#06655c] text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Footprints className="w-4 h-4" />
                <span>Launch SafePath</span>
              </button>
            </div>

            {/* Live Detection Stream Bar */}
            <div className="p-5 rounded-2xl bg-[#101828] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#087F73] text-white flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Continuous Live Detection Stream</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#087F73]/40 text-[#57D6C5] font-semibold border border-[#087F73]">
                      Duplicate-Suppressed
                    </span>
                  </div>
                  <div className="text-xs text-white/70 mt-0.5">
                    Analyzes camera frames at controlled intervals with smart repetition suppression and instant speech interruption.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTask('live');
                  setShowWorkspaceDashboard(false);
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#087F73] hover:bg-[#076f64] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Activity className="w-4 h-4" />
                <span>Launch Live Stream</span>
              </button>
            </div>

            {/* Everyday Scene Showcase Reference */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#101828]/10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#087F73] bg-[#087F73]/10 px-3 py-1 rounded-full border border-[#087F73]/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>OpenCV 5.0.0 Verified & Native Python C++ Preprocessor</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#101828] tracking-tight">
                  Calibrated spatial perception with directional audio
                </h3>
                <p className="text-xs sm:text-sm text-[#101820]/70 leading-relaxed">
                  OmniLens identifies everyday items such as doors, windows, eyeglasses, drink bottles, laptops, and human gestures. When using a laptop webcam, spatial mirror correction keeps your physical left and right directions accurate.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      setActiveTask('describe');
                      setShowWorkspaceDashboard(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#6845C2] text-white text-xs font-bold hover:bg-[#5736a8] transition-all cursor-pointer shadow-sm"
                  >
                    Scan Room View
                  </button>
                  <button
                    onClick={() => setIsAccessibilityOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#101828]/15 text-[#101828] text-xs font-semibold hover:bg-[#101828]/5 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#6845C2]" />
                    <span>Camera Orientation Settings</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md border border-[#101820]/10 bg-slate-100 flex items-center justify-center">
                <img
                  src={HERO_BANNER_SRC}
                  alt="Everyday indoor study desk scene with doorway and window"
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
          </div>
        ) : (
          /* Active Feature Workspace View */
          <div className="space-y-6">
            {/* Top Return & Breadcrumb Bar */}
            <div className="flex items-center justify-between gap-4 p-3.5 bg-white rounded-2xl border border-[#101820]/10 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWorkspaceDashboard(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#101820] hover:bg-[#FAF7F0] border border-[#101820]/15 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006B66]"
                  aria-label="Back to 4 Modes Overview"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#006B66]" />
                  <span>All Modes</span>
                </button>

                <button
                  onClick={() => setExperience('showcase')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#101820]/70 hover:text-[#101820] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                >
                  Showcase Page
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#101820]/60 hidden sm:inline">Active Mode:</span>
                <span className="text-xs font-bold text-[#006B66] bg-[#006B66]/10 px-3 py-1 rounded-full border border-[#006B66]/20">
                  {activeTask === 'describe'
                    ? '1. Describe Surroundings'
                    : activeTask === 'find'
                    ? '2. Find an Object (Agentic)'
                    : activeTask === 'read'
                    ? '3. Read Text Aloud (OCR)'
                    : activeTask === 'safepath'
                    ? '4. SafePath Walking Awareness'
                    : '5. Live Detection Stream'}
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
            {activeTask === 'safepath' && (
              <SafePathView
                highContrast={settings.highContrast}
                onSwitchTask={handleSelectTaskFromNav}
              />
            )}
            {activeTask === 'live' && (
              <LiveDetectionView
                highContrast={settings.highContrast}
                onSwitchTask={handleSelectTaskFromNav}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#101820]/10 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#101820]/60">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-[#101820]">OmniLens</span>
            <span>·</span>
            <span>Voice-first assistive visual companion</span>
            <button
              onClick={() => setExperience('showcase')}
              className="text-[#006B66] font-bold hover:underline ml-2 cursor-pointer"
            >
              (Open Showcase Page)
            </button>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>OpenCV AI Competition 2026</span>
            <span>·</span>
            <span>Not a replacement for mobility cane or guide dog</span>
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
