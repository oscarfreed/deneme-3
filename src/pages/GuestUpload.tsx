import { useCallback, useRef, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Heart,
  ImageIcon,
  Loader2,
  Mic,
  Music,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

type FileWithPreview = {
  id: string;
  file: File;
  preview?: string;
  mediaType: "image" | "video" | "audio";
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
};

const ALLOWED_TYPES: Record<string, "image" | "video" | "audio"> = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/heic": "image",
  "image/heif": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/mov": "video",
  "audio/m4a": "audio",
  "audio/mp4": "audio",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/webm": "audio",
};

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

function MediaTypeIcon({ type }: { type: "image" | "video" | "audio" }) {
  if (type === "image") return <ImageIcon className="w-5 h-5" />;
  if (type === "video") return <Video className="w-5 h-5" />;
  return <Music className="w-5 h-5" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GuestUpload() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tableQuery = trpc.tables.getByQrToken.useQuery(
    { qrToken: qrToken ?? "" },
    { enabled: !!qrToken }
  );

  const eventQuery = trpc.wedding.getBySlug.useQuery(
    { slug: "" },
    { enabled: false }
  );

  // Fetch event info via table's weddingEventId
  const [eventInfo, setEventInfo] = useState<{
    coupleName: string;
    venue?: string | null;
    weddingDate: Date;
  } | null>(null);

  // Load event info once table is loaded
  const eventInfoQuery = trpc.wedding.getBySlug.useQuery(
    { slug: "" },
    { enabled: false }
  );

  // We'll get event info from a separate query using table data
  const weddingBySlugQuery = trpc.wedding.getBySlug.useQuery(
    { slug: tableQuery.data?.qrToken ?? "" },
    { enabled: false }
  );

  const addFiles = useCallback((newFiles: File[]) => {
    const valid: FileWithPreview[] = [];
    for (const file of newFiles) {
      const mediaType = ALLOWED_TYPES[file.type];
      if (!mediaType) {
        toast.error(`"${file.name}" is not a supported file type.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds 100MB limit.`);
        continue;
      }
      const id = Math.random().toString(36).slice(2);
      let preview: string | undefined;
      if (mediaType === "image") {
        preview = URL.createObjectURL(file);
      }
      valid.push({ id, file, preview, mediaType, progress: 0, status: "pending" });
    }
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const uploadFile = async (item: FileWithPreview): Promise<void> => {
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 5 } : f))
    );

    try {
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 95) + 5;
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress: pct } : f))
            );
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`HTTP ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));

        xhr.open("POST", `/api/upload/${qrToken}`);
        xhr.setRequestHeader("Content-Type", item.file.type);
        xhr.setRequestHeader("X-File-Name", encodeURIComponent(item.file.name));
        if (guestName.trim()) xhr.setRequestHeader("X-Guest-Name", guestName.trim());
        if (guestMessage.trim()) xhr.setRequestHeader("X-Guest-Message", guestMessage.trim());
        xhr.send(item.file);
      });

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "done", progress: 100 } : f))
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: "error", errorMsg: "Upload failed. Please try again." }
            : f
        )
      );
    }
  };

  const handleSubmit = async () => {
    const pending = files.filter((f) => f.status === "pending" || f.status === "error");
    if (pending.length === 0) {
      toast.info("No files to upload.");
      return;
    }
    await Promise.all(pending.map(uploadFile));
    const allSuccess = files.every((f) => f.status === "done");
    if (allSuccess) setAllDone(true);
  };

  const pendingCount = files.filter((f) => f.status === "pending" || f.status === "error").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  if (tableQuery.isLoading) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.46_0.10_290)]" />
      </div>
    );
  }

  if (tableQuery.isError || !tableQuery.data) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center px-6">
        <div className="glass-card p-10 text-center max-w-sm corner-bracket">
          <X className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="heading-serif text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Invalid QR Code
          </h2>
          <p className="text-sm text-muted-foreground">
            This QR code is not valid or has expired. Please ask the event organizer for a new one.
          </p>
        </div>
      </div>
    );
  }

  const table = tableQuery.data;

  if (allDone) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center px-6">
        <div className="glass-card p-12 text-center max-w-sm corner-bracket">
          <div className="w-16 h-16 rounded-full bg-[oklch(0.46_0.10_290)/0.1] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[oklch(0.46_0.10_290)]" />
          </div>
          <h2
            className="heading-serif text-3xl font-semibold mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Thank You!
          </h2>
          <div className="divider-ornament w-24 mx-auto my-4">
            <span className="text-[oklch(0.55_0.04_285)]">✦</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your memories have been shared with the couple. Enjoy the celebration!
          </p>
          <Heart
            className="w-6 h-6 text-[oklch(0.60_0.10_340)] mx-auto mt-6"
            fill="currentColor"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-6 text-xs"
            onClick={() => {
              setAllDone(false);
              setFiles([]);
            }}
          >
            Upload More
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wedding-bg">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="pt-10 pb-6 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-[oklch(0.46_0.10_290)]" fill="currentColor" />
          <span className="font-serif text-base font-medium text-[oklch(0.46_0.10_290)]">
            Wedding Memories
          </span>
        </div>
        <h1
          className="heading-serif text-3xl sm:text-4xl font-semibold mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Share Your Moments
        </h1>
        <div className="divider-ornament w-32 mx-auto my-3">
          <span className="text-[oklch(0.55_0.04_285)] text-sm">✦</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Table: <span className="font-medium text-[oklch(0.46_0.10_290)]">{table.label}</span>
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16 space-y-5">
        {/* ── Guest Info ────────────────────────────────────────────────── */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-[oklch(0.40_0.04_285)] tracking-wide">
            Your Details <span className="text-muted-foreground font-normal">(optional)</span>
          </h3>
          <Input
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="bg-white/60 border-[oklch(0.88_0.018_290)] text-sm"
          />
          <Textarea
            placeholder="A message for the couple... (optional)"
            value={guestMessage}
            onChange={(e) => setGuestMessage(e.target.value)}
            rows={2}
            className="bg-white/60 border-[oklch(0.88_0.018_290)] text-sm resize-none"
          />
        </div>

        {/* ── Drop Zone ─────────────────────────────────────────────────── */}
        <div
          className={`drop-zone p-8 text-center transition-all ${isDragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime,.m4a,audio/mpeg,audio/wav,audio/webm"
            className="hidden"
            onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          />
          <div className="flex justify-center gap-4 mb-4 text-[oklch(0.55_0.04_285)]">
            <Camera className="w-6 h-6" />
            <Video className="w-6 h-6" />
            <Mic className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-[oklch(0.40_0.04_285)] mb-1">
            Tap to select files
          </p>
          <p className="text-xs text-muted-foreground">
            Photos, videos & audio · Max 100MB each
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG · PNG · HEIC · MP4 · MOV · M4A · MP3
          </p>
        </div>

        {/* ── File List ─────────────────────────────────────────────────── */}
        {files.length > 0 && (
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[oklch(0.40_0.04_285)]">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </h3>
              {doneCount > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  {doneCount} uploaded
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/50 border border-[oklch(0.88_0.018_290)/0.5]"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-[oklch(0.95_0.012_290)] flex items-center justify-center">
                    {item.preview ? (
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[oklch(0.55_0.04_285)]">
                        <MediaTypeIcon type={item.mediaType} />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[oklch(0.35_0.04_285)] truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </p>
                    {item.status === "uploading" && (
                      <div className="progress-bar mt-1.5">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === "error" && (
                      <p className="text-xs text-destructive mt-0.5">{item.errorMsg}</p>
                    )}
                  </div>

                  {/* Status / Remove */}
                  <div className="flex-shrink-0">
                    {item.status === "done" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {item.status === "uploading" && (
                      <Loader2 className="w-4 h-4 animate-spin text-[oklch(0.46_0.10_290)]" />
                    )}
                    {(item.status === "pending" || item.status === "error") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Submit ────────────────────────────────────────────────────── */}
        {files.length > 0 && (
          <Button
            className="w-full py-6 text-base font-medium rounded-full bg-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.40_0.10_290)] text-white shadow-lg"
            onClick={handleSubmit}
            disabled={uploadingCount > 0 || pendingCount === 0}
          >
            {uploadingCount > 0 ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading {uploadingCount} file{uploadingCount !== 1 ? "s" : ""}…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Share {pendingCount} Memory{pendingCount !== 1 ? "ies" : ""}
              </>
            )}
          </Button>
        )}

        {/* ── Footer note ───────────────────────────────────────────────── */}
        <p className="text-center text-xs text-muted-foreground pb-2">
          Your memories will be shared privately with the couple ❤️
        </p>
      </div>
    </div>
  );
}
