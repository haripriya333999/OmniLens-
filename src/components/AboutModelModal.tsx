import React, { useState } from 'react';
import { X, ShieldAlert, Cpu, Eye, BookOpen, Volume2, Search } from 'lucide-react';
import { SUPPORTED_EVERYDAY_CLASSES } from '../types';

interface AboutModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModelModal: React.FC<AboutModelModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredClasses = SUPPORTED_EVERYDAY_CLASSES.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-model-title"
    >
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-[#392743]/15 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#392743]/10">
          <div>
            <h3 id="about-model-title" className="text-lg font-bold text-[#392743]">
              About OmniLens & Vision Architecture
            </h3>
            <p className="text-xs text-[#392743]/60">
              Technical transparency, door/window detection, gestures, and safety boundaries
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#392743]/60 hover:text-[#392743] hover:bg-[#FFF9F0] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Boundary Banner */}
        <div className="p-4.5 rounded-2xl bg-[#FFE5D8] border border-orange-200 text-xs text-[#9A3412] space-y-1.5 shadow-2xs">
          <div className="font-bold flex items-center gap-1.5 text-sm text-[#7C2D12]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Safety Notice & Intended Scope
          </div>
          <p className="leading-relaxed">
            OmniLens is designed as an <strong>assistive visual-understanding prototype</strong> to help users identify everyday objects, doors, windows, people, gestures, and read visible text. It is <strong>NOT</strong> a collision-avoidance system or a replacement for a white cane, guide dog, or orientation and mobility training.
          </p>
        </div>

        {/* Vision Engine Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FFF9F0] border border-[#392743]/10 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#7353B5]">
              <Eye className="w-4 h-4" />
              Everyday & Campus Vision
            </div>
            <div className="text-xs font-bold text-[#392743]">Doors, Windows, Gestures</div>
            <p className="text-[11px] text-[#392743]/70 leading-normal">
              Detects doors (open/closed/latch), window grills, ceiling fans, people & their gestures (thumbs-down, holding snacks, sitting).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF9F0] border border-[#392743]/10 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#7353B5]">
              <BookOpen className="w-4 h-4" />
              High-Precision OCR
            </div>
            <div className="text-xs font-bold text-[#392743]">Neural Character Reader</div>
            <p className="text-[11px] text-[#392743]/70 leading-normal">
              Extracts text from badges (e.g. AWS Academy), certificates, medicine bottles, room number signs, and notices.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF9F0] border border-[#392743]/10 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#7353B5]">
              <Volume2 className="w-4 h-4" />
              Spoken Audio Feedback
            </div>
            <div className="text-xs font-bold text-[#392743]">Directional Cues</div>
            <p className="text-[11px] text-[#392743]/70 leading-normal">
              Provides left side, center, right side audio cues with repeat, pause, stop, and rate adjustments.
            </p>
          </div>
        </div>

        {/* Supported Categories Search */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#392743] uppercase tracking-wider">
              Everyday Categories & Items ({SUPPORTED_EVERYDAY_CLASSES.length})
            </h4>
            <span className="text-[11px] text-[#392743]/60">
              Open-vocabulary open search supported
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#392743]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter items (e.g. door, window, fan, cookie, chair)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#392743]/20 bg-[#FFF9F0]/50 text-[#392743] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#7353B5]"
            />
          </div>
          <div className="p-3.5 bg-[#FFF9F0]/60 rounded-2xl border border-[#392743]/10 max-h-48 overflow-y-auto flex flex-wrap gap-1.5">
            {filteredClasses.map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-[#392743]/10 text-[#392743]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#392743]/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#7353B5] hover:bg-[#5E409B] rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
