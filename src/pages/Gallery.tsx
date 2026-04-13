import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera,
  Download,
  Filter,
  Heart,
  ImageIcon,
  Loader2,
  Music,
  Video,
  X,
  ZoomIn,
  Calendar,
  User,
  MessageSquare,
  Sparkles,
  Archive,
  Play,
} from "lucide-react";

type MediaType = "all" | "image" | "video" | "audio";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type MediaItem = {
  id: number;
  mediaType: "image" | "video" | "audio";
  fileUrl: string;
  fileName: string;
  fileSize: number;
  guestName?: string | null;
  guestMessage?: string | null;
  aiCaption?: string | null;
  uploadedAt: Date;
};

function MediaCard({
  item,
  onSelect,
}: {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
}) {
  return (
    <div
      className="group relative glass-card overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={() => onSelect(item)}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-[oklch(0.95_0.012_290)] flex items-center justify-center overflow-hidden">
        {item.mediaType === "image" ? (
          <img
            src={item.fileUrl}
            alt={item.fileName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : item.mediaType === "video" ? (
          <div className="relative w-full h-full flex items-center justify-center bg-[oklch(0.93_0.025_340)/0.3]">
            <Video className="w-10 h-10 text-[oklch(0.46_0.10_290)]" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-[oklch(0.90_0.04_165)/0.3]">
            <Music className="w-10 h-10 text-[oklch(0.46_0.10_290)]" />
          </div>
        )}
      </div>

      {/* Info overlay */}
      <div className="p-2.5">
        {item.guestName && (
          <p className="text-xs font-medium text-[oklch(0.40_0.04_285)] truncate">
            {item.guestName}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDate(item.uploadedAt)}
        </p>
        {item.aiCaption && (
          <p className="text-xs text-[oklch(0.50_0.06_290)] italic mt-1 line-clamp-2">
            {item.aiCaption}
          </p>
        )}
      </div>

      {/* Type badge */}
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-white/80 text-[oklch(0.46_0.10_290)] font-medium">
          {item.mediaType === "image" && <ImageIcon className="w-3 h-3" />}
          {item.mediaType === "video" && <Video className="w-3 h-3" />}
          {item.mediaType === "audio" && <Music className="w-3 h-3" />}
        </span>
      </div>
    </div>
  );
}

function LightboxModal({
  item,
  onClose,
  onDownload,
}: {
  item: MediaItem;
  onClose: () => void;
  onDownload: (item: MediaItem) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[oklch(0.88_0.018_290)/0.5]">
          <div className="flex items-center gap-2">
            {item.mediaType === "image" && <ImageIcon className="w-4 h-4 text-[oklch(0.46_0.10_290)]" />}
            {item.mediaType === "video" && <Video className="w-4 h-4 text-[oklch(0.46_0.10_290)]" />}
            {item.mediaType === "audio" && <Music className="w-4 h-4 text-[oklch(0.46_0.10_290)]" />}
            <span className="text-sm font-medium text-[oklch(0.40_0.04_285)] truncate max-w-xs">
              {item.fileName}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div className="p-4">
          {item.mediaType === "image" && (
            <img
              src={item.fileUrl}
              alt={item.fileName}
              className="w-full rounded-lg max-h-96 object-contain bg-[oklch(0.95_0.012_290)]"
            />
          )}
          {item.mediaType === "video" && (
            <video
              src={item.fileUrl}
              controls
              className="w-full rounded-lg max-h-96"
              style={{ background: "oklch(0.20 0.00 0)" }}
            />
          )}
          {item.mediaType === "audio" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full bg-[oklch(0.46_0.10_290)/0.1] flex items-center justify-center">
                <Music className="w-10 h-10 text-[oklch(0.46_0.10_290)]" />
              </div>
              <audio src={item.fileUrl} controls className="w-full" />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="px-4 pb-4 space-y-3">
          {item.aiCaption && (
            <div className="flex gap-2 p-3 rounded-lg bg-[oklch(0.46_0.10_290)/0.05] border border-[oklch(0.46_0.10_290)/0.15]">
              <Sparkles className="w-4 h-4 text-[oklch(0.46_0.10_290)] flex-shrink-0 mt-0.5" />
              <p className="text-sm italic text-[oklch(0.40_0.06_290)] leading-relaxed">
                {item.aiCaption}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            {item.guestName && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{item.guestName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(item.uploadedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>{formatBytes(item.fileSize)}</span>
            </div>
          </div>

          {item.guestMessage && (
            <div className="flex gap-2 p-3 rounded-lg bg-[oklch(0.93_0.025_340)/0.2]">
              <MessageSquare className="w-4 h-4 text-[oklch(0.60_0.10_340)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[oklch(0.40_0.04_285)] italic">"{item.guestMessage}"</p>
            </div>
          )}

          <Button
            className="w-full bg-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.40_0.10_290)] text-white"
            onClick={() => onDownload(item)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const { coupleToken } = useParams<{ coupleToken: string }>();
  const [filter, setFilter] = useState<MediaType>("all");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const eventQuery = trpc.wedding.getByCoupleToken.useQuery(
    { token: coupleToken ?? "" },
    { enabled: !!coupleToken }
  );

  const mediaQuery = trpc.media.list.useQuery(
    {
      coupleToken: coupleToken ?? "",
      mediaType: filter === "all" ? undefined : filter,
    },
    { enabled: !!coupleToken, refetchInterval: 30000 }
  );

  const deleteMedia = trpc.media.delete.useMutation({
    onSuccess: () => {
      mediaQuery.refetch();
      setSelectedItem(null);
      toast.success("Media deleted.");
    },
    onError: () => toast.error("Failed to delete."),
  });

  const handleDownload = (item: MediaItem) => {
    const a = document.createElement("a");
    a.href = item.fileUrl;
    a.download = item.fileName;
    a.target = "_blank";
    a.click();
  };

  const handleDownloadAll = async () => {
    if (!mediaQuery.data?.length) return;
    setIsDownloadingZip(true);
    try {
      const res = await fetch(`/api/download-zip/${coupleToken}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wedding-memories-${coupleToken?.slice(0, 8)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("ZIP download failed. Please try downloading files individually.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const stats = useMemo(() => {
    const all = mediaQuery.data ?? [];
    return {
      total: all.length,
      images: all.filter((m) => m.mediaType === "image").length,
      videos: all.filter((m) => m.mediaType === "video").length,
      audio: all.filter((m) => m.mediaType === "audio").length,
    };
  }, [mediaQuery.data]);

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.46_0.10_290)]" />
      </div>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center px-6">
        <div className="glass-card p-10 text-center max-w-sm corner-bracket">
          <X className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="heading-serif text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Gallery Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            This gallery link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const event = eventQuery.data;

  return (
    <div className="min-h-screen wedding-bg">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="pt-10 pb-6 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-[oklch(0.46_0.10_290)]" fill="currentColor" />
          <span className="font-serif text-base text-[oklch(0.46_0.10_290)]">Wedding Memories</span>
        </div>
        <h1
          className="heading-serif text-4xl sm:text-5xl font-semibold mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {event.coupleName}
        </h1>
        <div className="divider-ornament w-32 mx-auto my-3">
          <span className="text-[oklch(0.55_0.04_285)]">✦</span>
        </div>
        {event.venue && (
          <p className="text-sm text-muted-foreground mb-1">{event.venue}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {new Date(event.weddingDate).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, icon: Camera },
            { label: "Photos", value: stats.images, icon: ImageIcon },
            { label: "Videos", value: stats.videos, icon: Video },
            { label: "Audio", value: stats.audio, icon: Music },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-card p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1 text-[oklch(0.46_0.10_290)]" />
              <p className="text-lg font-semibold text-[oklch(0.35_0.04_285)]">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex items-center gap-1 bg-white/60 rounded-full p-1 border border-[oklch(0.88_0.018_290)]">
            {(["all", "image", "video", "audio"] as MediaType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === t
                    ? "bg-[oklch(0.46_0.10_290)] text-white shadow-sm"
                    : "text-[oklch(0.50_0.04_285)] hover:bg-[oklch(0.46_0.10_290)/0.08]"
                }`}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {mediaQuery.isFetching && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {stats.images > 0 && (
              <Link
                href={`/slideshow/${coupleToken}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[oklch(0.88_0.018_290)] text-xs font-medium text-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.46_0.10_290)/0.06] transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Slideshow
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-[oklch(0.88_0.018_290)]"
              onClick={handleDownloadAll}
              disabled={isDownloadingZip || !stats.total}
            >
              {isDownloadingZip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              Download All
            </Button>
          </div>
        </div>

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {mediaQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.46_0.10_290)]" />
          </div>
        ) : !mediaQuery.data?.length ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[oklch(0.46_0.10_290)/0.08] flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-[oklch(0.46_0.10_290)/0.5]" />
            </div>
            <h3
              className="heading-serif text-2xl font-medium mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              No memories yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Share the QR codes with your guests to start collecting memories.
            </p>
          </div>
        ) : (
          <div className="media-grid">
            {mediaQuery.data.map((item) => (
              <MediaCard
                key={item.id}
                item={item as MediaItem}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {selectedItem && (
        <LightboxModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
