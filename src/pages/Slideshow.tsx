import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Heart,
  Loader2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Settings,
} from "lucide-react";

type MediaItem = {
  id: number;
  mediaType: "image" | "video" | "audio";
  fileUrl: string;
  fileName: string;
  guestName?: string | null;
  uploadedAt: Date;
};

const BACKGROUND_MUSIC = [
  { id: "piano-soft", name: "Soft Piano", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "strings", name: "Romantic Strings", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "acoustic", name: "Acoustic Guitar", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

export default function Slideshow() {
  const { coupleToken } = useParams<{ coupleToken: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [photoDuration, setPhotoDuration] = useState(3); // seconds
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Set audio volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mediaQuery = trpc.media.list.useQuery(
    { coupleToken: coupleToken ?? "", mediaType: "image" },
    { enabled: !!coupleToken }
  );

  const eventQuery = trpc.wedding.getByCoupleToken.useQuery(
    { token: coupleToken ?? "" },
    { enabled: !!coupleToken }
  );

  const images = (mediaQuery.data ?? []) as MediaItem[];

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying || images.length === 0) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, photoDuration * 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, images.length, photoDuration]);

  // Handle music playback
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying && selectedMusic) {
      audioRef.current.play().catch(() => {
        toast.error("Could not play music");
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, selectedMusic]);

  // Handle music loop
  const handleMusicEnded = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  // Handle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      toast.error("Fullscreen not supported");
    }
  };

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === "f") {
        toggleFullscreen();
      } else if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, isPlaying, isFullscreen]);

  if (mediaQuery.isLoading || eventQuery.isLoading) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.46_0.10_290)]" />
      </div>
    );
  }

  if (!images.length) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center px-6">
        <div className="glass-card p-10 text-center max-w-sm corner-bracket">
          <Music className="w-10 h-10 text-[oklch(0.46_0.10_290)/0.4] mx-auto mb-4" />
          <h2
            className="heading-serif text-2xl font-semibold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            No Photos Yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Photos will appear here once guests start uploading.
          </p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const progress = ((currentIndex + 1) / images.length) * 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={() => isFullscreen && setShowControls(true)}
    >
      {/* ── Photo Display ────────────────────────────────────────────────────── */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {currentImage && (
          <img
            key={currentImage.id}
            src={currentImage.fileUrl}
            alt={`Slide ${currentIndex + 1}`}
            className="w-full h-full object-contain animate-fade-in"
          />
        )}

        {/* Guest name overlay */}
        {currentImage?.guestName && (
          <div className="absolute bottom-6 left-6 text-white text-sm font-light opacity-80">
            📸 {currentImage.guestName}
          </div>
        )}

        {/* Photo counter */}
        <div className="absolute top-6 right-6 text-white text-sm font-light opacity-80">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-[oklch(0.46_0.10_290)] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Settings panel */}
        {showSettings && (
          <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-sm">Slideshow Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Music selection */}
            <div>
              <label className="text-white/80 text-xs font-medium block mb-2">Background Music</label>
              <div className="space-y-2">
                {BACKGROUND_MUSIC.map((music) => (
                  <button
                    key={music.id}
                    onClick={() => setSelectedMusic(music.id)}
                    className={`w-full px-3 py-2 rounded text-xs text-left transition-colors ${
                      selectedMusic === music.id
                        ? "bg-[oklch(0.46_0.10_290)] text-white"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    <Music className="w-3 h-3 inline mr-2" />
                    {music.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo duration */}
            <div>
              <label className="text-white/80 text-xs font-medium block mb-2">
                Photo Duration: {photoDuration}s
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={photoDuration}
                onChange={(e) => setPhotoDuration(parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded cursor-pointer accent-[oklch(0.46_0.10_290)]"
              />
            </div>

            {/* Music volume */}
            {selectedMusic && (
              <div>
                <label className="text-white/80 text-xs font-medium block mb-2">Music Volume</label>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-white/60" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={musicVolume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setMusicVolume(vol);
                      if (audioRef.current) audioRef.current.volume = vol;
                    }}
                    className="flex-1 h-1 bg-white/20 rounded cursor-pointer accent-[oklch(0.46_0.10_290)]"
                  />
                  <span className="text-white/60 text-xs w-8 text-right">{Math.round(musicVolume * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Control buttons */}
        <div className="bg-gradient-to-t from-black/80 to-transparent px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
              title="Previous (← arrow)"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              className="bg-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.40_0.10_290)] text-white"
              onClick={() => setIsPlaying(!isPlaying)}
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
              title="Next (→ arrow)"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Audio element ────────────────────────────────────────────────────── */}
      <audio
        ref={audioRef}
        src={selectedMusic ? BACKGROUND_MUSIC.find((m) => m.id === selectedMusic)?.url : ""}
        onEnded={handleMusicEnded}
      />

      {/* ── CSS for fade animation ───────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
