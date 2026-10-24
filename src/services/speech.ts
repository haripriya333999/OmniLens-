class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private lastSpokenText: string = '';
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private useAiVoice: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isAvailable(): boolean {
    return this.synth !== null || typeof Audio !== 'undefined';
  }

  public setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  public getRate(): number {
    return this.rate;
  }

  public setPitch(pitch: number): void {
    this.pitch = Math.max(0.5, Math.min(1.5, pitch));
  }

  public setUseAiVoice(val: boolean): void {
    this.useAiVoice = val;
  }

  public getUseAiVoice(): boolean {
    return this.useAiVoice;
  }

  public subscribe(callback: (speaking: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(speaking: boolean): void {
    this.listeners.forEach((fn) => {
      try {
        fn(speaking);
      } catch (e) {
        console.error('Error in speech listener', e);
      }
    });
  }

  public async speak(text: string, priority: 'interrupt' | 'queue' = 'interrupt'): Promise<void> {
    if (!text || !text.trim()) return;

    if (priority === 'interrupt') {
      this.stop();
    }

    this.lastSpokenText = text;

    // Optional Gemini TTS for ultra-natural voice if enabled
    if (this.useAiVoice) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audioDataUrl) {
            const audio = new Audio(data.audioDataUrl);
            audio.playbackRate = this.rate;
            this.currentAudio = audio;
            this.notify(true);
            audio.onended = () => {
              this.currentAudio = null;
              this.notify(false);
            };
            audio.onerror = () => {
              this.currentAudio = null;
              this.notify(false);
              this.speakBrowserSynth(text);
            };
            await audio.play();
            return;
          }
        }
      } catch (e) {
        console.warn('AI TTS failed, falling back to Web Speech Synthesis:', e);
      }
    }

    this.speakBrowserSynth(text);
  }

  private speakBrowserSynth(text: string): void {
    if (!this.synth) return;

    // Split very long text if needed or speak smoothly
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => {
      this.currentUtterance = utterance;
      this.notify(true);
    };

    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      this.notify(false);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      this.notify(false);
    };

    this.synth.speak(utterance);
  }

  public repeat(): void {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, 'interrupt');
    }
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
    }
  }

  public isPaused(): boolean {
    return Boolean(this.synth?.paused || (this.currentAudio && this.currentAudio.paused && this.currentAudio.currentTime > 0));
  }

  /**
   * Speak background / live alert with duplicate suppression
   */
  public speakLiveAlert(text: string, cooldownMs: number = 7000): boolean {
    if (!text || !text.trim()) return false;
    const now = Date.now();
    const clean = text.trim().toLowerCase();

    // Check duplicate suppression
    if (this.lastSpokenLiveText === clean && (now - this.lastSpokenLiveTime) < cooldownMs) {
      return false; // suppressed duplicate
    }

    // Do not talk over an active direct command announcement
    if (this.isSpeaking()) {
      return false;
    }

    this.lastSpokenLiveText = clean;
    this.lastSpokenLiveTime = now;
    this.speak(text, 'interrupt');
    return true;
  }

  private lastSpokenLiveText: string = '';
  private lastSpokenLiveTime: number = 0;

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.notify(false);
  }

  public isSpeaking(): boolean {
    return (this.synth ? this.synth.speaking : false) || (this.currentAudio !== null && !this.currentAudio.paused);
  }

  public getLastSpoken(): string {
    return this.lastSpokenText;
  }
}

export const speechService = new SpeechService();
