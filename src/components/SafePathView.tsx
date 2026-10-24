import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  ShieldAlert,
  Camera,
  FlipHorizontal,
  Sliders,
  CheckCircle2,
  Info,
  Activity,
  Footprints,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { SafePathResponse, SafePathObstacle, OpenCVQualityMetrics } from '../types';
import { apiService } from '../services/apiService';
import { speechService } from '../services/speech';
import { SAMPLE_IMAGES } from '../data/sampleImages';

interface SafePathViewProps {
  highContrast?: boolean;
  onSwitchTask?: (task: any) => void;
}

export const SafePathView: React.FC<SafePathViewProps> = ({
  highContrast = false,
  onSwitchTask,
}) => {
  // Mode: Live Camera vs Upload/Sample Image
  const [sourceMode, setSourceMode] = useState<'camera' | 'sample'>('camera');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<SafePathResponse | null>(null);
  const [currentAlert, setCurrentAlert] = useState<string>(
    'SafePath ready. Press Start Scanning or tap Inspect Path.'
  );
  const [alertHistory, setAlertHistory] = useState<
    Array<{ text: string; time: string; sector: string; proximity: string }>
  >([]);

  // Camera state
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);

  // Settings
  const [invertLR, setInvertLR] = useState<boolean>(true); // Default true for laptop webcam
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.35);
  const [scanIntervalMs, setScanIntervalMs] = useState<number>(1400);

  // Diagnostics
  const [opencvQuality, setOpencvQuality] = useState<OpenCVQualityMetrics | null>(null);
  const [opencvVersion, setOpencvVersion] = useState<string>('5.0.0.93');
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Audio state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimerRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    const unsub = speechService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  // Initialize Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setHasCameraPermission(true);
        };
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraError(
        'Camera access was denied or is unavailable. You can use sample corridor images to test SafePath.'
      );
      setSourceMode('sample');
      setHasCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setHasCameraPermission(false);
  };

  useEffect(() => {
    if (sourceMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current);
      }
    };
  }, [sourceMode]);

  // Capture frame as Blob
  const captureFrameBlob = useCallback(async (): Promise<Blob | null> => {
    if (sourceMode === 'camera') {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      });
    } else {
      // Use selected sample image
      const sample = SAMPLE_IMAGES[selectedSampleIndex] || SAMPLE_IMAGES[0];
      try {
        const response = await fetch(sample.src);
        return await response.blob();
      } catch (e) {
        return null;
      }
    }
  }, [sourceMode, selectedSampleIndex]);

  // Draw walking path overlay on canvas
  const drawOverlay = useCallback(
    (obstacles: SafePathObstacle[], width: number, height: number) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Sector boundaries: Left < 0.35, Center 0.35 - 0.65, Right > 0.65
      const leftBoundary = width * 0.35;
      const rightBoundary = width * 0.65;
      const floorBoundary = height * 0.55;

      // 1. Draw subtle sector divider lines
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';

      // Left divider
      ctx.beginPath();
      ctx.moveTo(leftBoundary, 0);
      ctx.lineTo(leftBoundary, height);
      ctx.stroke();

      // Right divider
      ctx.beginPath();
      ctx.moveTo(rightBoundary, 0);
      ctx.lineTo(rightBoundary, height);
      ctx.stroke();

      // 2. Center Walking Path Corridor Highlight
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(8, 127, 115, 0.12)';
      ctx.fillRect(leftBoundary, 0, rightBoundary - leftBoundary, height);

      // Walking corridor borders
      ctx.strokeStyle = 'rgba(8, 127, 115, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftBoundary, 0);
      ctx.lineTo(leftBoundary, height);
      ctx.moveTo(rightBoundary, 0);
      ctx.lineTo(rightBoundary, height);
      ctx.stroke();

      // 3. Floor Level Horizon line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(166, 83, 18, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, floorBoundary);
      ctx.lineTo(width, floorBoundary);
      ctx.stroke();

      // Floor Zone Tag
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(166, 83, 18, 0.85)';
      ctx.fillRect(8, floorBoundary - 22, 120, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('FLOOR LEVEL (Y>0.55)', 12, floorBoundary - 8);

      // Sector Headers
      ctx.font = 'bold 11px sans-serif';

      // Left
      ctx.fillStyle = 'rgba(16, 24, 40, 0.7)';
      ctx.fillRect(leftBoundary / 2 - 35, 12, 70, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('LEFT', leftBoundary / 2 - 16, 27);

      // Center Corridor
      ctx.fillStyle = 'rgba(8, 127, 115, 0.85)';
      ctx.fillRect((leftBoundary + rightBoundary) / 2 - 60, 12, 120, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('WALKING PATH', (leftBoundary + rightBoundary) / 2 - 45, 27);

      // Right
      ctx.fillStyle = 'rgba(16, 24, 40, 0.7)';
      ctx.fillRect((rightBoundary + width) / 2 - 35, 12, 70, 22);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('RIGHT', (rightBoundary + width) / 2 - 20, 27);

      // 4. Render Detected Obstacles
      obstacles.forEach((obs) => {
        const { box, sector, proximity, label, confidence } = obs;
        const x = box.x;
        const y = box.y;
        const w = box.width;
        const h = box.height;

        let strokeColor = '#087F73';
        let fillColor = 'rgba(8, 127, 115, 0.2)';
        let tagBg = '#087F73';

        if (proximity === 'immediate_path') {
          strokeColor = '#B42318';
          fillColor = 'rgba(180, 35, 24, 0.3)';
          tagBg = '#B42318';
        } else if (proximity === 'approaching') {
          strokeColor = '#A65312';
          fillColor = 'rgba(166, 83, 18, 0.25)';
          tagBg = '#A65312';
        }

        // Box
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);

        // Header Pill
        const title = `${label.toUpperCase()} (${Math.round(confidence * 100)}%) - ${sector.toUpperCase()}`;
        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(title).width;

        ctx.fillStyle = tagBg;
        ctx.fillRect(x, Math.max(0, y - 24), textWidth + 12, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(title, x + 6, Math.max(16, y - 8));
      });
    },
    []
  );

  // Main Single-Frame Analysis
  const performAnalysis = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    const startTime = performance.now();
    try {
      const blob = await captureFrameBlob();
      if (!blob) {
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }

      const file = new File([blob], 'safepath_frame.jpg', { type: 'image/jpeg' });
      const response = await apiService.analyzeSafePath(file, invertLR, confidenceThreshold);

      setLatencyMs(Math.round(performance.now() - startTime));
      setLastResponse(response);

      if (response.opencv_quality) {
        setOpencvQuality(response.opencv_quality);
      }
      if (response.opencv_version) {
        setOpencvVersion(response.opencv_version);
      }

      // Handle Spoken Alert
      if (response.spoken_alert && response.should_speak) {
        setCurrentAlert(response.spoken_alert);
        speechService.speak(response.spoken_alert);

        // Add to alert history (prevent duplicates in history)
        const nowStr = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const primarySector = response.primary_obstacle?.sector || 'center';
        const primaryProx = response.primary_obstacle?.proximity || 'path';

        setAlertHistory((prev) => [
          {
            text: response.spoken_alert,
            time: nowStr,
            sector: primarySector,
            proximity: primaryProx,
          },
          ...prev.slice(0, 7), // Keep last 8 alerts
        ]);
      } else if (response.obstacles.length === 0) {
        setCurrentAlert('No obstacles visible in walking corridor.');
      }

      // Draw overlay
      const width = videoRef.current?.videoWidth || 640;
      const height = videoRef.current?.videoHeight || 480;
      drawOverlay(response.obstacles, width, height);
    } catch (err) {
      console.error('SafePath analysis error:', err);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [captureFrameBlob, invertLR, confidenceThreshold, drawOverlay]);

  // Start continuous loop
  const handleStartScanning = () => {
    setIsScanning(true);
    speechService.speak('SafePath walking awareness started. Monitoring path ahead.');
    performAnalysis();
    scanTimerRef.current = setInterval(() => {
      if (isScanningRef.current) {
        performAnalysis();
      }
    }, scanIntervalMs);
  };

  // Stop/Pause continuous loop
  const handleStopScanning = () => {
    setIsScanning(false);
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    speechService.stop();
    speechService.speak('SafePath monitoring paused.');
  };

  // Immediate Stop Speech
  const handleImmediateStop = () => {
    speechService.stop();
  };

  // Repeat Last Spoken Alert
  const handleRepeatLast = () => {
    if (currentAlert) {
      speechService.repeat();
    } else {
      speechService.speak('No recent alert to repeat.');
    }
  };

  return (
    <div className={`space-y-6 ${highContrast ? 'contrast-125' : ''}`}>
      {/* Feature Title & Primary Action Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#101828] text-white shadow-xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#087F73]/25 border border-[#087F73]/50 text-[#57D6C5] text-xs font-bold uppercase tracking-wider">
            <Footprints className="w-3.5 h-3.5" />
            <span>Voice-First Walking Path Awareness</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>SafePath</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-lg bg-white/10 text-white/80 border border-white/10">
              OpenCV 5 Engine
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
            Prioritizes potential obstacles on your floor and in your forward walking path. Divides your view into Left, Center Walking Corridor, and Right sectors with adaptive dim-light contrast enhancement and duplicate-suppressed voice feedback.
          </p>
        </div>

        {/* Primary Scanner Toggle Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!isScanning ? (
            <button
              onClick={handleStartScanning}
              className="flex-1 sm:flex-initial py-3.5 px-6 rounded-2xl bg-[#087F73] hover:bg-[#06655c] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#087F73]/25 flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#57D6C5]"
              aria-label="Start SafePath Walking Path Awareness Scanning"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start SafePath</span>
            </button>
          ) : (
            <button
              onClick={handleStopScanning}
              className="flex-1 sm:flex-initial py-3.5 px-6 rounded-2xl bg-[#A65312] hover:bg-[#85420e] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#A65312]/25 flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white"
              aria-label="Pause SafePath Scanning"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause SafePath</span>
            </button>
          )}

          {/* Single Snapshot Button */}
          <button
            onClick={performAnalysis}
            disabled={isProcessing}
            className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
            title="Scan single frame on demand"
            aria-label="Inspect Walking Path Ahead Now"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Inspect Path Now</span>
          </button>

          {/* Urgent Stop Speech Button */}
          <button
            onClick={handleImmediateStop}
            className="py-3.5 px-4 rounded-2xl bg-[#B42318] hover:bg-[#911c13] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            title="Stop Speech Immediately (Esc or S)"
            aria-label="Silence Speech Immediately"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Speech</span>
          </button>
        </div>
      </div>

      {/* Spoken Alert Announcement Banner */}
      <div
        role="region"
        aria-live="polite"
        className="p-5 rounded-2xl bg-white border-2 border-[#087F73] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isSpeaking
                ? 'bg-[#087F73] text-white animate-pulse'
                : 'bg-[#087F73]/10 text-[#087F73]'
            }`}
          >
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#087F73] flex items-center gap-1.5">
              <span>Current Voice Guidance</span>
              {isSpeaking && (
                <span className="w-2 h-2 rounded-full bg-[#087F73] animate-ping" />
              )}
            </div>
            <div className="text-base sm:text-lg font-bold text-[#101828] mt-0.5 leading-snug">
              {currentAlert}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={handleRepeatLast}
            className="py-2 px-3.5 rounded-xl bg-[#101828]/5 hover:bg-[#101828]/10 text-[#101828] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#101828]/15"
            aria-label="Repeat last voice alert (Press A)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#087F73]" />
            <span>Repeat (A)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Viewport & Corridor Visualization vs Real-time Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Corridor Viewport (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-[#101828] border border-white/10 aspect-video shadow-lg flex items-center justify-center">
            {sourceMode === 'camera' ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${invertLR ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <img
                src={SAMPLE_IMAGES[selectedSampleIndex]?.src || SAMPLE_IMAGES[0].src}
                alt="SafePath Test Scene"
                className="w-full h-full object-cover"
              />
            )}

            {/* Hidden capture canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Walking Corridor and Obstacle Overlay Canvas */}
            <canvas
              ref={overlayCanvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${
                invertLR && sourceMode === 'camera' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Scanning indicator */}
            {isScanning && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-[#087F73]/90 text-white text-xs font-bold backdrop-blur-sm shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#57D6C5] animate-ping" />
                <span>Monitoring Path ({latencyMs}ms)</span>
              </div>
            )}

            {/* Quality badge overlay */}
            {opencvQuality && (
              <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 text-white text-[11px] font-mono backdrop-blur-sm border border-white/10">
                <span>Blur: {Math.round(opencvQuality.laplacian_variance ?? opencvQuality.blur_score ?? 0)}</span>
                <span>•</span>
                <span>Lum: {Math.round(opencvQuality.mean_luminance ?? 0)}</span>
              </div>
            )}

            {/* Camera error fallback banner */}
            {cameraError && (
              <div className="absolute inset-x-4 bottom-4 p-4 rounded-2xl bg-[#B42318]/90 text-white backdrop-blur-md text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-bold">Camera Unavailable</div>
                  <div>{cameraError}</div>
                </div>
              </div>
            )}
          </div>

          {/* Corridor Legend & Sector Mapping Guide */}
          <div className="p-4 rounded-2xl bg-white border border-[#101828]/10 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-[#101828]">Walking Sectors:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#101828]/20 border border-[#101828]/40" />
                <span className="text-[#101828]/80 font-medium">Left (x &lt; 35%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#087F73]/40 border border-[#087F73]" />
                <span className="text-[#087F73] font-bold">Center Path (35% - 65%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#101828]/20 border border-[#101828]/40" />
                <span className="text-[#101828]/80 font-medium">Right (x &gt; 65%)</span>
              </div>
            </div>

            {/* Mirroring toggle button */}
            <button
              onClick={() => setInvertLR(!invertLR)}
              className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                invertLR
                  ? 'bg-[#6845C2]/10 border-[#6845C2]/30 text-[#6845C2]'
                  : 'bg-white border-[#101828]/15 text-[#101828]/70 hover:bg-[#101828]/5'
              }`}
              title="Mirror left/right orientation for laptop webcam"
              aria-label="Toggle camera left-right mirror inversion"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Mirror: {invertLR ? 'Webcam Mirrored' : 'Natural'}</span>
            </button>
          </div>

          {/* Test Scene Selector when Camera is off */}
          <div className="p-4 rounded-2xl bg-white border border-[#101828]/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#101828]">Input Source:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSourceMode('camera')}
                  className={`py-1 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    sourceMode === 'camera'
                      ? 'bg-[#087F73] text-white'
                      : 'bg-[#101828]/5 text-[#101828]/70 hover:bg-[#101828]/10'
                  }`}
                >
                  Live Webcam
                </button>
                <button
                  onClick={() => setSourceMode('sample')}
                  className={`py-1 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    sourceMode === 'sample'
                      ? 'bg-[#087F73] text-white'
                      : 'bg-[#101828]/5 text-[#101828]/70 hover:bg-[#101828]/10'
                  }`}
                >
                  Sample Corridor Scenes
                </button>
              </div>
            </div>

            {sourceMode === 'sample' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {SAMPLE_IMAGES.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setSelectedSampleIndex(idx);
                      performAnalysis();
                    }}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedSampleIndex === idx
                        ? 'border-[#087F73] bg-[#087F73]/10 font-bold'
                        : 'border-[#101828]/10 hover:border-[#101828]/30'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-[#101828] truncate">
                      {img.title}
                    </div>
                    <div className="text-[10px] text-[#101828]/60 truncate">
                      {img.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SafePath Obstacle Intelligence & History (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* OpenCV 5 Quality & Low-Light Enhancement Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#101828]/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#101828] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#087F73]" />
                <span>OpenCV 5.0.0 Metrics</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#087F73]/10 text-[#087F73] font-bold">
                {opencvVersion}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC]">
                <span className="text-[#101828]/70">Mean Luminance:</span>
                <span className="font-bold text-[#101828]">
                  {opencvQuality ? Math.round(opencvQuality.mean_luminance) : '--'}
                  {opencvQuality?.is_low_light && (
                    <span className="ml-1 text-[10px] text-[#A65312] font-semibold">
                      (Low Light)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC]">
                <span className="text-[#101828]/70">Laplacian Blur Index:</span>
                <span className="font-bold text-[#101828]">
                  {opencvQuality
                    ? Math.round(opencvQuality.laplacian_variance ?? opencvQuality.blur_score ?? 0)
                    : '--'}
                  {opencvQuality?.is_blurry && (
                    <span className="ml-1 text-[10px] text-[#B42318] font-semibold">
                      (Blurry)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC]">
                <span className="text-[#101828]/70">Adaptive Processing:</span>
                <span className="font-bold text-[#087F73]">
                  {opencvQuality?.is_low_light
                    ? 'CLAHE + Gamma (γ=1.5)'
                    : 'Bilateral Denoise'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Detected Obstacles */}
          <div className="p-5 rounded-3xl bg-white border border-[#101828]/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#6845C2]" />
                <span>Path Detections ({lastResponse?.obstacles.length || 0})</span>
              </h2>
              {lastResponse?.tracked_count ? (
                <span className="text-[10px] font-mono text-[#101828]/60">
                  {lastResponse.tracked_count} tracked
                </span>
              ) : null}
            </div>

            {lastResponse && lastResponse.obstacles.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lastResponse.obstacles.map((obs) => (
                  <div
                    key={obs.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      obs.proximity === 'immediate_path'
                        ? 'border-[#B42318]/40 bg-[#B42318]/5'
                        : obs.proximity === 'approaching'
                        ? 'border-[#A65312]/30 bg-[#A65312]/5'
                        : 'border-[#101828]/10 bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#101828] capitalize">
                        {obs.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          obs.sector === 'center'
                            ? 'bg-[#087F73] text-white'
                            : 'bg-[#101828]/10 text-[#101828]'
                        }`}
                      >
                        {obs.sector}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#101828]/70 mt-1">
                      <span>
                        {obs.isFloorLevel ? 'Floor Level Object' : 'Elevated / Furniture'}
                      </span>
                      <span className="font-mono text-[10px]">
                        {Math.round(obs.confidence * 100)}% conf
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] text-center text-xs text-[#101828]/60">
                No potential obstacles currently in view.
              </div>
            )}
          </div>

          {/* Recent Spoken Alerts Log */}
          <div className="p-5 rounded-3xl bg-white border border-[#101828]/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101828] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#087F73]" />
                <span>Spoken Alert History</span>
              </h2>
              <span className="text-[10px] text-[#101828]/50">Duplicate-Suppressed</span>
            </div>

            {alertHistory.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alertHistory.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#101828]/10 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#087F73] uppercase">{h.sector}</span>
                      <span className="font-mono text-[#101828]/50">{h.time}</span>
                    </div>
                    <div className="text-[#101828] font-medium leading-tight">{h.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] text-center text-xs text-[#101828]/50">
                Voice alerts will appear here as you walk.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Notice Banner (Mandatory Safety Boundary) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#A65312]/30 flex items-start gap-3.5 text-xs text-[#101828]/80 leading-relaxed shadow-sm">
        <ShieldAlert className="w-5 h-5 text-[#A65312] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#A65312]">
            Essential Mobility & Safety Notice:{' '}
          </span>
          SafePath is a visual assistance awareness tool and does not provide guaranteed collision protection. It does not replace a white cane, guide dog, mobility training, or human judgment. Monocular cameras cannot detect drop-offs, clear glass, drop edges, or low-contrast stair treads. Always proceed with cane probing before stepping forward.
        </div>
      </div>
    </div>
  );
};
