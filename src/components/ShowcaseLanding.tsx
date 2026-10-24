import React, { useState } from 'react';
import {
  Eye,
  Search,
  FileText,
  Activity,
  Mic,
  Volume2,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Server,
  Cloud,
  ChevronRight,
  Compass,
  Play,
  RotateCcw,
  Sliders,
  Laptop,
} from 'lucide-react';
import { ActiveTask } from '../types';
import { speechService } from '../services/speech';

interface ShowcaseLandingProps {
  onLaunchApp: (initialTask?: ActiveTask) => void;
  onOpenAccessibility: () => void;
  onOpenAbout: () => void;
  onOpenEngine: () => void;
}

export const ShowcaseLanding: React.FC<ShowcaseLandingProps> = ({
  onLaunchApp,
  onOpenAccessibility,
  onOpenAbout,
  onOpenEngine,
}) => {
  // Simulator state for the hero interactive demo
  const [demoStep, setDemoStep] = useState<number>(0);
  const [isPlayingDemoVoice, setIsPlayingDemoVoice] = useState<boolean>(false);

  const demoScenarios = [
    {
      title: 'Describe Surroundings',
      command: '“Describe what is around me”',
      status: 'Analyzing room layout & architecture',
      response:
        'In the center is a study desk with a laptop. To your left is an open doorway, and to your right is a window with natural sunlight. Overhead ceiling fan is visible at eye level.',
      tags: ['Study desk (center)', 'Open doorway (left)', 'Window (right)', 'Ceiling fan (overhead)'],
      image: '/assets/sample-room.jpg',
    },
    {
      title: 'Agentic Find Object',
      command: '“Find my water bottle”',
      status: 'Target search: bottle · Attempt 1/2',
      response:
        'I cannot see a bottle clearly in this frame. Slowly move your camera to the right side, or tilt slightly downward toward the desk.',
      tags: ['No bottle above 25%', 'Sub-threshold candidate on right (19%)', 'Guidance: Pan Right'],
      image: '/assets/sample-room.jpg',
    },
    {
      title: 'Read Text Aloud',
      command: '“Read text on the sign”',
      status: 'Neural OCR extraction complete',
      response:
        'Reading extracted text: “ROOM 302 · COMPUTER VISION RESEARCH LAB · AUTHORIZED PERSONNEL ONLY”. Extracted 8 words with high confidence.',
      tags: ['Text region detected', '8 words extracted', 'Line-by-line speech ready'],
      image: '/assets/sample-room.jpg',
    },
    {
      title: 'Live Spatial Detection',
      command: '“Continuous Live Mode Active”',
      status: 'Stream active · Duplicate suppression ON',
      response:
        'Person sitting at desk on your right side. Mobile phone held upright at chest level.',
      tags: ['Person (right)', 'Cell phone (foreground)', 'Spatial audio cue: Right channel'],
      image: '/assets/sample-room.jpg',
    },
  ];

  const currentDemo = demoScenarios[demoStep];

  const handlePlayVoice = (text: string) => {
    setIsPlayingDemoVoice(true);
    speechService.speak(text, 'interrupt');
    setTimeout(() => {
      setIsPlayingDemoVoice(false);
    }, 4500);
  };

  return (
    <div className="bg-[#101820] text-[#FAF7F0] font-sans selection:bg-[#006B66] selection:text-white min-h-screen">
      {/* 1. Header / Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#101820]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006B66] to-[#57D6C5] p-0.5 shadow-lg shadow-[#006B66]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#101820] rounded-[14px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-[#57D6C5]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                  OmniLens
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#57D6C5]/20 text-[#57D6C5] border border-[#57D6C5]/30">
                  OpenCV 5 AI
                </span>
              </div>
              <p className="text-[11px] text-[#FAF7F0]/60 hidden sm:block">
                Understand your world. Through sound.
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav aria-label="Showcase Navigation" className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#FAF7F0]/80">
            <a href="#mission" className="hover:text-[#57D6C5] transition-colors">Mission</a>
            <a href="#capabilities" className="hover:text-[#57D6C5] transition-colors">4 Capabilities</a>
            <a href="#how-it-works" className="hover:text-[#57D6C5] transition-colors">How It Works</a>
            <a href="#voice-demo" className="hover:text-[#57D6C5] transition-colors">Voice-First Loop</a>
            <a href="#architecture" className="hover:text-[#57D6C5] transition-colors">OpenCV 5 & AWS</a>
            <a href="#accessibility" className="hover:text-[#57D6C5] transition-colors">Accessibility</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAccessibility}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-[#FAF7F0]/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              aria-label="Accessibility Settings"
            >
              <Sliders className="w-4 h-4 text-[#57D6C5]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => onLaunchApp('describe')}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#006B66] to-[#087F73] hover:from-[#005753] hover:to-[#006B66] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#006B66]/30 transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#57D6C5]"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4 text-[#57D6C5]" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
        {/* Ambient atmospheric teal glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#006B66]/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-[#57D6C5]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Mission & Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#006B66]/25 border border-[#57D6C5]/40 text-[#57D6C5] text-xs font-bold tracking-wide">
                <Sparkles className="w-4 h-4" />
                <span>OpenCV AI Competition 2026 Submission</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                See the world differently. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#57D6C5] via-[#FAF7F0] to-[#F4BF62]">
                  Understand it through sound.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#FAF7F0]/80 leading-relaxed max-w-2xl">
                OmniLens is a voice-first visual companion for blind and low-vision individuals. Powered by OpenCV 5 image processing, multi-stage neural vision, and continuous voice control, it describes room architecture, locates missing everyday objects with directional audio cues, and reads printed signs aloud.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onLaunchApp('describe')}
                  className="py-4 px-7 rounded-2xl bg-[#006B66] hover:bg-[#005753] text-white font-bold text-sm sm:text-base shadow-xl shadow-[#006B66]/40 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <Eye className="w-5 h-5 text-[#57D6C5] group-hover:scale-110 transition-transform" />
                  <span>Experience OmniLens Workspace</span>
                  <ArrowRight className="w-4 h-4 text-[#57D6C5]" />
                </button>

                <button
                  onClick={() => handlePlayVoice(currentDemo.response)}
                  className="py-4 px-6 rounded-2xl bg-[#172B3A] hover:bg-[#1e374a] text-[#FAF7F0] font-semibold text-sm border border-white/10 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-[#57D6C5]" />
                  <span>Hear Audio Demo</span>
                </button>
              </div>

              {/* Design principles trust badge */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#FAF7F0]/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5]" />
                  <span>Voice-First Architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5]" />
                  <span>OpenCV 5 Validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5]" />
                  <span>Zero Hallucination OCR</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive OmniLens Live Preview Simulator */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-[#172B3A]/90 border border-[#57D6C5]/30 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#006B66] animate-pulse" />
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      Live Interface Simulator
                    </span>
                  </div>
                  <span className="text-[11px] text-[#57D6C5] font-mono">
                    Session: Active
                  </span>
                </div>

                {/* Scenario Tabs */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {demoScenarios.map((sc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDemoStep(idx)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left truncate cursor-pointer ${
                        demoStep === idx
                          ? 'bg-[#006B66] text-white shadow-md'
                          : 'bg-[#101820]/70 text-[#FAF7F0]/70 hover:bg-[#101820] hover:text-white'
                      }`}
                    >
                      {sc.title}
                    </button>
                  ))}
                </div>

                {/* Simulated Screen Body */}
                <div className="mt-5 space-y-4">
                  {/* Spoken User Command */}
                  <div className="p-3.5 rounded-2xl bg-[#101820] border border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#FAF7F0]/50 uppercase tracking-wider font-bold">
                        Spoken Voice Request
                      </div>
                      <div className="text-sm font-bold text-[#57D6C5]">
                        {currentDemo.command}
                      </div>
                    </div>
                  </div>

                  {/* Processing Status */}
                  <div className="flex items-center justify-between text-xs px-1 text-[#FAF7F0]/60">
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Cpu className="w-3.5 h-3.5 text-[#57D6C5]" />
                      {currentDemo.status}
                    </span>
                    <span className="text-[#F4BF62] font-semibold text-[11px]">
                      240ms Latency
                    </span>
                  </div>

                  {/* Spoken AI Result Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#101820] to-[#172B3A] border border-[#57D6C5]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-[#57D6C5]" />
                        Spoken Response
                      </span>
                      <button
                        onClick={() => handlePlayVoice(currentDemo.response)}
                        className="text-[11px] font-bold text-[#57D6C5] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        Play Audio
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-[#FAF7F0] leading-relaxed">
                      “{currentDemo.response}”
                    </p>

                    {/* Spatial Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentDemo.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 rounded-lg bg-[#006B66]/30 text-[#57D6C5] text-[10px] font-semibold border border-[#006B66]/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA to test in workspace */}
                  <button
                    onClick={() => {
                      const tasks: ActiveTask[] = ['describe', 'find', 'read', 'live'];
                      onLaunchApp(tasks[demoStep]);
                    }}
                    className="w-full py-3 rounded-xl bg-[#006B66] hover:bg-[#005753] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <span>Test “{currentDemo.title}” in Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#57D6C5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mission Statement Section */}
      <section id="mission" className="py-20 bg-[#172B3A]/40 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#57D6C5]">
            <Compass className="w-4 h-4" />
            <span>Inclusive Human-Centered Design</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            The world is full of information. <br />
            <span className="text-[#57D6C5]">Everyone deserves a way to access it.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#FAF7F0]/80 leading-relaxed max-w-3xl mx-auto">
            Everyday environments contain visual signposts in doorway states, window openings, furniture arrangements, product labels, and pedestrian corridors. OmniLens bridges physical vision and sound: giving blind and low-vision individuals respectful, high-accuracy perception without requiring complex tactile gestures or intrusive menus.
          </p>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-[#101820] border border-white/10">
              <div className="text-2xl font-extrabold text-[#57D6C5]">Voice First</div>
              <p className="text-xs text-[#FAF7F0]/70 mt-2 leading-relaxed">
                Commands work continuously through natural speech while camera frames stream, avoiding complex touch navigation.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#101820] border border-white/10">
              <div className="text-2xl font-extrabold text-[#57D6C5]">Directional Clarity</div>
              <p className="text-xs text-[#FAF7F0]/70 mt-2 leading-relaxed">
                Objects are communicated through relative human cues: “on your left side”, “in the center”, “on your right side”, and “at waist level”.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#101820] border border-white/10">
              <div className="text-2xl font-extrabold text-[#57D6C5]">Agentic Search</div>
              <p className="text-xs text-[#FAF7F0]/70 mt-2 leading-relaxed">
                When an object is not found, OmniLens coaches the user to re-aim the camera before verifying in subsequent views.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 4 Core Capabilities */}
      <section id="capabilities" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-[#57D6C5]">
            Core Competencies
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Four specialized modalities designed for daily independence
          </h2>
          <p className="text-sm sm:text-base text-[#FAF7F0]/70 leading-relaxed">
            Every mode shares a single, prioritized speech queue and OpenCV 5 image validation pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Capability 1: Describe Surroundings */}
          <div className="p-8 rounded-3xl bg-[#172B3A] border border-white/10 hover:border-[#57D6C5]/50 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white group-hover:text-[#57D6C5] transition-colors">
                1. Describe Surroundings
              </h3>
              <p className="text-sm text-[#FAF7F0]/80 leading-relaxed">
                Delivers a concise spoken breakdown of the room architecture: doors, windows, overhead fans, furniture layout, nearby people, and active gestures. Avoids overwhelming lists of trivial clutter.
              </p>
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-[#57D6C5]">Key Features:</div>
                <ul className="text-xs text-[#FAF7F0]/70 space-y-1.5 list-disc list-inside">
                  <li>Detects architectural elements (closed/open doors, windows, ceiling fans)</li>
                  <li>Identifies person activities (sitting, holding phone, gestures)</li>
                  <li>Lighting assessment & glare advisory</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onLaunchApp('describe')}
              className="py-3 px-4 rounded-xl bg-[#006B66] hover:bg-[#005753] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Explore Describe Mode</span>
              <ArrowRight className="w-4 h-4 text-[#57D6C5]" />
            </button>
          </div>

          {/* Capability 2: Find Object (Agentic Vision) */}
          <div className="p-8 rounded-3xl bg-[#172B3A] border border-white/10 hover:border-[#57D6C5]/50 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Search className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-white group-hover:text-[#57D6C5] transition-colors">
                  2. Find Object
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F4BF62]/20 text-[#F4BF62] border border-[#F4BF62]/30">
                  Agentic Loop
                </span>
              </div>
              <p className="text-sm text-[#FAF7F0]/80 leading-relaxed">
                Accepts spoken object names (phone, eyeglasses, water bottle, keys). If the item is occluded or not in frame, OmniLens provides directional coaching (“Slowly pan right”) rather than failing with “Not found”.
              </p>
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-[#57D6C5]">Key Features:</div>
                <ul className="text-xs text-[#FAF7F0]/70 space-y-1.5 list-disc list-inside">
                  <li>Synonym mapping (e.g. mobile, smartphone, cellphone)</li>
                  <li>Sub-threshold sensitivity recovery with user-adjustable slider</li>
                  <li>Natural directional cues: left side, center, right side, eye level</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onLaunchApp('find')}
              className="py-3 px-4 rounded-xl bg-[#006B66] hover:bg-[#005753] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Explore Find Mode</span>
              <ArrowRight className="w-4 h-4 text-[#57D6C5]" />
            </button>
          </div>

          {/* Capability 3: Read Text Aloud (OCR) */}
          <div className="p-8 rounded-3xl bg-[#172B3A] border border-white/10 hover:border-[#57D6C5]/50 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white group-hover:text-[#57D6C5] transition-colors">
                3. Read Text Aloud
              </h3>
              <p className="text-sm text-[#FAF7F0]/80 leading-relaxed">
                High-precision OCR extracts text from labels, signs, documents, and food packaging. Speaks text in logical reading order with line-by-line navigation, repeat buffers, and distinct error reporting.
              </p>
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-[#57D6C5]">Key Features:</div>
                <ul className="text-xs text-[#FAF7F0]/70 space-y-1.5 list-disc list-inside">
                  <li>Distinguishes between “No text detected” vs “OCR engine unavailable”</li>
                  <li>Line-by-line reading controls with Repeat, Pause, and Resume</li>
                  <li>Zero-hallucination policy: never fabricates missing words</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onLaunchApp('read')}
              className="py-3 px-4 rounded-xl bg-[#006B66] hover:bg-[#005753] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Explore Read Text Mode</span>
              <ArrowRight className="w-4 h-4 text-[#57D6C5]" />
            </button>
          </div>

          {/* Capability 4: Live Spatial Detection */}
          <div className="p-8 rounded-3xl bg-[#172B3A] border border-white/10 hover:border-[#57D6C5]/50 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white group-hover:text-[#57D6C5] transition-colors">
                4. Live Detection
              </h3>
              <p className="text-sm text-[#FAF7F0]/80 leading-relaxed">
                Processes video frames continuously at controlled intervals. Features intelligent duplicate suppression so identical unchanged scenes are not announced repeatedly, protecting user concentration.
              </p>
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-[#57D6C5]">Key Features:</div>
                <ul className="text-xs text-[#FAF7F0]/70 space-y-1.5 list-disc list-inside">
                  <li>Intelligent duplicate suppression (no repeated chatter)</li>
                  <li>Instant voice interruption on Stop command</li>
                  <li>Recent announcement timeline with accessible live regions</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onLaunchApp('live')}
              className="py-3 px-4 rounded-xl bg-[#006B66] hover:bg-[#005753] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Explore Live Detection</span>
              <ArrowRight className="w-4 h-4 text-[#57D6C5]" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. How It Works (4 Steps) */}
      <section id="how-it-works" className="py-20 bg-[#172B3A]/30 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#57D6C5]">
              System Workflow
            </div>
            <h2 className="text-3xl font-extrabold text-white">How OmniLens Works</h2>
            <p className="text-sm text-[#FAF7F0]/70">
              A streamlined perception loop bridging optical sensors to speech synthesis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#101820] border border-white/10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#006B66] text-white font-black flex items-center justify-center text-base">
                1
              </div>
              <h4 className="text-lg font-bold text-white">Point Camera</h4>
              <p className="text-xs text-[#FAF7F0]/70 leading-relaxed">
                The user opens the device camera and faces toward the room, workspace, or printed sign.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#101820] border border-white/10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#006B66] text-white font-black flex items-center justify-center text-base">
                2
              </div>
              <h4 className="text-lg font-bold text-white">Speak Naturally</h4>
              <p className="text-xs text-[#FAF7F0]/70 leading-relaxed">
                Speak commands: “Describe”, “Find bottle”, “Read text”, or “Start live detection”.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#101820] border border-white/10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#006B66] text-white font-black flex items-center justify-center text-base">
                3
              </div>
              <h4 className="text-lg font-bold text-white">OpenCV 5 & AI</h4>
              <p className="text-xs text-[#FAF7F0]/70 leading-relaxed">
                Validates image quality, applies perspective calibration, and extracts spatial bounding boxes.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[#101820] border border-white/10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#006B66] text-white font-black flex items-center justify-center text-base">
                4
              </div>
              <h4 className="text-lg font-bold text-white">Hear the Result</h4>
              <p className="text-xs text-[#FAF7F0]/70 leading-relaxed">
                Clear, prioritized spoken audio delivers concise guidance without overlapping speech.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Showcase the Voice-First Interaction */}
      <section id="voice-demo" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[#57D6C5]">
              Seamless Task Switching
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              One persistent camera session. Zero menu navigation.
            </h2>
            <p className="text-sm sm:text-base text-[#FAF7F0]/80 leading-relaxed">
              Unlike traditional apps where switching from scene description to text reading requires clicking through separate pages, OmniLens keeps the camera running continuously. Speak a new task at any time, and the system seamlessly adjusts its perception pipeline.
            </p>
            <div className="p-4 rounded-2xl bg-[#172B3A] border border-white/10 space-y-2 text-xs">
              <div className="font-bold text-[#57D6C5] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Hands-Free Keyboard Shortcuts</span>
              </div>
              <p className="text-[#FAF7F0]/70">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white">Space</kbd> to activate microphone, <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white">R</kbd> to repeat last answer, and <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white">Esc</kbd> to stop speech instantly.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Interactive Dialogue Timeline */}
            <div className="p-6 rounded-3xl bg-[#172B3A] border border-[#57D6C5]/30 space-y-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between pb-3 border-b border-white/10">
                <span>Multi-Turn Agentic Dialogue Stream</span>
                <span className="text-[#57D6C5]">Continuous Mode</span>
              </div>

              <div className="space-y-4">
                {/* Dialogue Turn 1 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#57D6C5]">
                    <Mic className="w-3.5 h-3.5" />
                    <span>User: “Describe.”</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#101820] text-xs text-[#FAF7F0] border border-white/10">
                    “A study desk is visible in the center, a doorway to your left, and a window to your right.”
                  </div>
                </div>

                {/* Dialogue Turn 2 (Find object & agentic guidance) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#57D6C5]">
                    <Mic className="w-3.5 h-3.5" />
                    <span>User: “Find bottle.”</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#101820] text-xs text-[#FAF7F0] border border-[#F4BF62]/30">
                    <span className="text-[#F4BF62] font-bold block mb-1">OmniLens Agentic Re-aiming:</span>
                    “I can't see a bottle clearly in this view. Slowly move the camera to your right.”
                  </div>
                </div>

                {/* Dialogue Turn 3 (Verification) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FAF7F0]/60 italic">
                    <span>(User pans camera 30 degrees to the right...)</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#101820] text-xs text-[#FAF7F0] border border-[#57D6C5]/40">
                    <span className="text-[#57D6C5] font-bold block mb-1">Target Verified:</span>
                    “BOTTLE detected on your right side at waist level with 88% confidence.”
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. OpenCV 5 & AWS Architecture Section (Competition Highlight) */}
      <section id="architecture" className="py-24 bg-[#172B3A]/40 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#57D6C5] bg-[#006B66]/20 px-3 py-1 rounded-full border border-[#57D6C5]/30">
              <Cpu className="w-3.5 h-3.5" />
              <span>OpenCV AI Competition 2026 Technical Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              OpenCV 5 Processing & AWS Cloud Architecture
            </h2>
            <p className="text-sm sm:text-base text-[#FAF7F0]/70">
              A high-performance hybrid pipeline balancing client-side camera calibration with cloud-accelerated neural inference.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Box 1: OpenCV 5 Pipeline */}
            <div className="p-7 rounded-3xl bg-[#101820] border border-white/10 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">OpenCV 5 Processing</h3>
              <p className="text-xs text-[#FAF7F0]/70 leading-relaxed">
                OpenCV 5 handles foundational computer vision before inference:
              </p>
              <ul className="text-xs text-[#FAF7F0]/80 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>Laplacian Blur Detection:</strong> Measures variance of Laplacian to reject motion-blurred frames.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>Adaptive Contrast (CLAHE):</strong> Equalizes shadows and indoor window glare for reliable detection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>Perspective Calibration:</strong> Inverts left/right coordinates for laptop webcams to match physical world reality.</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Vision Model Cascade */}
            <div className="p-7 rounded-3xl bg-[#101820] border border-white/10 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Detection & OCR Cascade</h3>
              <p className="text-xs text-[#FAF7F0]/70 leading-relaxed">
                Multi-stage fallback ensures zero single-point failure:
              </p>
              <ul className="text-xs text-[#FAF7F0]/80 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>YOLO / Neural Detector:</strong> Fast bounding box generation for 80+ everyday classes & doors/windows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>Multimodal Vision Fallback:</strong> Low-latency Gemini Vision cascade for complex human activity & gestures.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>EasyOCR / Neural Text Engine:</strong> Extracts printed text and numbers without hallucinating unseen words.</span>
                </li>
              </ul>
            </div>

            {/* Box 3: AWS Cloud Deployment */}
            <div className="p-7 rounded-3xl bg-[#101820] border border-white/10 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#006B66]/30 text-[#57D6C5] flex items-center justify-center">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AWS Graviton Architecture</h3>
              <p className="text-xs text-[#FAF7F0]/70 leading-relaxed">
                Cloud infrastructure optimized for high concurrency & low power:
              </p>
              <ul className="text-xs text-[#FAF7F0]/80 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>AWS Graviton 3 / ARM64:</strong> High-efficiency compute instances delivering 40% better price-performance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>Stateless Vision Workers:</strong> Scalable microservices handling `/api/analyze-vision` and `/api/ocr-vision`.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#57D6C5] shrink-0 mt-0.5" />
                  <span><strong>Shared Speech Queue:</strong> Ensures low latency audio delivery to the client.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Accessibility Commitment */}
      <section id="accessibility" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#172B3A] to-[#101820] border border-[#57D6C5]/30 shadow-2xl space-y-8">
          <div className="space-y-3 max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-widest text-[#57D6C5]">
              Universal Accessibility
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Accessibility is built into the experience, not bolted on.
            </h2>
            <p className="text-sm sm:text-base text-[#FAF7F0]/80 leading-relaxed">
              Every interactive element meets WCAG 2.2 AA contrast standards, uses native semantic landmarks, and integrates with assistive screen readers like NVDA, JAWS, VoiceOver, and TalkBack.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-[#101820] border border-white/10 space-y-2">
              <div className="font-bold text-white text-sm">ARIA Live Announcements</div>
              <p className="text-xs text-[#FAF7F0]/60 leading-relaxed">
                Dynamic results are exposed via polite live regions so screen readers receive updates without interrupting focus.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#101820] border border-white/10 space-y-2">
              <div className="font-bold text-white text-sm">No Color-Only State</div>
              <p className="text-xs text-[#FAF7F0]/60 leading-relaxed">
                All detection statuses, errors, and camera states combine distinct iconography, text labels, and audible chimes.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#101820] border border-white/10 space-y-2">
              <div className="font-bold text-white text-sm">Tactile Button Geometry</div>
              <p className="text-xs text-[#FAF7F0]/60 leading-relaxed">
                48px+ minimum touch targets, high contrast borders, and clear focus rings ensure confident touch navigation.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#101820] border border-white/10 space-y-2">
              <div className="font-bold text-white text-sm">Webcam Perspective Flip</div>
              <p className="text-xs text-[#FAF7F0]/60 leading-relaxed">
                Calibrates laptop selfie webcams to prevent inverted left/right confusion in the real physical environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Make more of the world accessible.
          </h2>
          <p className="text-base text-[#FAF7F0]/80 max-w-2xl mx-auto leading-relaxed">
            Experience the voice-controlled companion built for everyday autonomy, room orientation, and real-time guidance.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onLaunchApp('describe')}
              className="py-4 px-8 rounded-2xl bg-[#006B66] hover:bg-[#005753] text-white font-extrabold text-base shadow-xl shadow-[#006B66]/40 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <span>Launch OmniLens Workspace</span>
              <ArrowRight className="w-5 h-5 text-[#57D6C5] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. Comprehensive Footer */}
      <footer className="border-t border-white/10 bg-[#0d141b] py-12 text-xs text-[#FAF7F0]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#006B66] text-white flex items-center justify-center font-black">
                OL
              </div>
              <div>
                <span className="font-bold text-white text-sm block">OmniLens</span>
                <span className="text-[11px] text-[#FAF7F0]/50">Understand your world. Through sound.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#FAF7F0]/70">
              <button onClick={() => onLaunchApp('describe')} className="hover:text-white cursor-pointer">Describe</button>
              <button onClick={() => onLaunchApp('find')} className="hover:text-white cursor-pointer">Find Object</button>
              <button onClick={() => onLaunchApp('read')} className="hover:text-white cursor-pointer">Read Text</button>
              <button onClick={() => onLaunchApp('live')} className="hover:text-white cursor-pointer">Live Detection</button>
              <button onClick={onOpenAbout} className="hover:text-white cursor-pointer">Model Details</button>
              <button onClick={onOpenAccessibility} className="hover:text-white cursor-pointer">Settings</button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#FAF7F0]/50">
            <div>
              Designed for the OpenCV AI Competition 2026.
            </div>
            <div className="text-center sm:text-right">
              Assistive orientation tool · Not a replacement for a cane, guide dog, or mobility orientation.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
