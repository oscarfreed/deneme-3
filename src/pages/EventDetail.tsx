import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Copy,
  Download,
  Heart,
  ImageIcon,
  Loader2,
  Music,
  Plus,
  QrCode,
  Trash2,
  Video,
} from "lucide-react";

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading, isAuthenticated } = useAuth();
  const [newTableLabel, setNewTableLabel] = useState("");
  const [qrDataUrls, setQrDataUrls] = useState<Record<number, string>>({});
  const [generatingQr, setGeneratingQr] = useState<number | null>(null);

  const eventIdNum = parseInt(eventId ?? "0", 10);

  const eventsQuery = trpc.wedding.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const event = eventsQuery.data?.find((e) => e.id === eventIdNum);

  const tablesQuery = trpc.tables.list.useQuery(
    { weddingEventId: eventIdNum },
    { enabled: !!eventIdNum && isAuthenticated && user?.role === "admin" }
  );

  const analyticsQuery = trpc.wedding.analytics.useQuery(
    { eventId: eventIdNum },
    { enabled: !!eventIdNum && isAuthenticated && user?.role === "admin" }
  );

  const createTableMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      tablesQuery.refetch();
      setNewTableLabel("");
      toast.success("Table created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTableMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      tablesQuery.refetch();
      toast.success("Table deleted.");
    },
  });

  const generateQRMutation = trpc.tables.generateQR.useMutation({
    onSuccess: (data, variables) => {
      const table = tablesQuery.data?.find((t) => t.qrToken === variables.qrToken);
      if (table) {
        setQrDataUrls((prev) => ({ ...prev, [table.id]: data.qrDataUrl }));
      }
      setGeneratingQr(null);
    },
    onError: () => {
      setGeneratingQr(null);
      toast.error("Failed to generate QR code.");
    },
  });

  const handleGenerateQR = async (tableId: number, qrToken: string) => {
    setGeneratingQr(tableId);
    generateQRMutation.mutate({ qrToken, origin: window.location.origin });
  };

  const handleDownloadQR = (tableId: number, label: string) => {
    const dataUrl = qrDataUrls[tableId];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  const copyUploadUrl = (qrToken: string) => {
    const url = `${window.location.origin}/upload/${qrToken}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Upload URL copied!"));
  };

  if (loading) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.46_0.10_290)]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center px-6">
        <div className="glass-card p-10 text-center max-w-sm">
          <p className="text-sm text-muted-foreground">Access restricted.</p>
          <Link href="/admin" className="text-[oklch(0.46_0.10_290)] text-sm mt-2 inline-block">
            ← Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wedding-bg">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="pt-10 pb-6 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-[oklch(0.46_0.10_290)]" fill="currentColor" />
          <span className="font-serif text-base text-[oklch(0.46_0.10_290)]">Wedding Memories</span>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[oklch(0.46_0.10_290)] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <h1
          className="heading-serif text-3xl sm:text-4xl font-semibold mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {event?.coupleName ?? "Event"}
        </h1>
        <div className="divider-ornament w-32 mx-auto my-3">
          <span className="text-[oklch(0.55_0.04_285)]">✦</span>
        </div>
        {event?.venue && (
          <p className="text-sm text-muted-foreground">{event.venue}</p>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16 space-y-6">
        {/* ── Analytics ─────────────────────────────────────────────────── */}
        {analyticsQuery.data && (
          <div className="glass-card p-5">
            <h3
              className="heading-serif text-xl font-semibold mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Upload Statistics
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total", value: analyticsQuery.data.total, icon: Camera },
                ...analyticsQuery.data.byType.map((t) => ({
                  label: t.mediaType.charAt(0).toUpperCase() + t.mediaType.slice(1) + "s",
                  value: t.cnt,
                  icon: t.mediaType === "image" ? ImageIcon : t.mediaType === "video" ? Video : Music,
                })),
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-[oklch(0.46_0.10_290)/0.05]">
                  <Icon className="w-4 h-4 mx-auto mb-1 text-[oklch(0.46_0.10_290)]" />
                  <p className="text-lg font-semibold text-[oklch(0.35_0.04_285)]">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-right">
              Total size: {((analyticsQuery.data.totalSize ?? 0) / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        )}

        {/* ── Add Table ─────────────────────────────────────────────────── */}
        <div className="glass-card p-5 corner-bracket">
          <h3
            className="heading-serif text-xl font-semibold mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Tables & QR Codes
          </h3>
          <div className="flex gap-2 mb-5">
            <Input
              placeholder="e.g. Table 1, Garden, VIP"
              value={newTableLabel}
              onChange={(e) => setNewTableLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTableLabel.trim()) {
                  createTableMutation.mutate({
                    weddingEventId: eventIdNum,
                    label: newTableLabel.trim(),
                    origin: window.location.origin,
                  });
                }
              }}
              className="bg-white/60 border-[oklch(0.88_0.018_290)]"
            />
            <Button
              className="bg-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.40_0.10_290)] text-white flex-shrink-0"
              onClick={() => {
                if (!newTableLabel.trim()) return;
                createTableMutation.mutate({
                  weddingEventId: eventIdNum,
                  label: newTableLabel.trim(),
                  origin: window.location.origin,
                });
              }}
              disabled={createTableMutation.isPending}
            >
              {createTableMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Tables list */}
          {tablesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.46_0.10_290)]" />
            </div>
          ) : !tablesQuery.data?.length ? (
            <div className="text-center py-8">
              <QrCode className="w-10 h-10 mx-auto mb-3 text-[oklch(0.46_0.10_290)/0.3]" />
              <p className="text-sm text-muted-foreground">
                Add tables to generate QR codes for guests.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tablesQuery.data.map((table) => {
                const uploadUrl = `${window.location.origin}/upload/${table.qrToken}`;
                const qrDataUrl = qrDataUrls[table.id];
                return (
                  <div
                    key={table.id}
                    className="p-4 rounded-xl bg-white/50 border border-[oklch(0.88_0.018_290)/0.6]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[oklch(0.46_0.10_290)]" />
                        <span className="font-medium text-sm text-[oklch(0.35_0.04_285)]">
                          {table.label}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${table.label}"?`)) {
                            deleteTableMutation.mutate({ id: table.id });
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Upload URL */}
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs text-muted-foreground font-mono flex-1 truncate">
                        {uploadUrl}
                      </p>
                      <button
                        onClick={() => copyUploadUrl(table.qrToken)}
                        className="text-[oklch(0.46_0.10_290)] hover:text-[oklch(0.36_0.10_290)] flex-shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* QR Code */}
                    {qrDataUrl ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={qrDataUrl}
                          alt={`QR for ${table.label}`}
                          className="w-24 h-24 rounded-lg border border-[oklch(0.88_0.018_290)]"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[oklch(0.88_0.018_290)]"
                          onClick={() => handleDownloadQR(table.id, table.label)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download QR
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-[oklch(0.46_0.10_290)/0.4] text-[oklch(0.46_0.10_290)]"
                        onClick={() => handleGenerateQR(table.id, table.qrToken)}
                        disabled={generatingQr === table.id}
                      >
                        {generatingQr === table.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Generate QR Code
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Gallery Link ──────────────────────────────────────────────── */}
        {event && (
          <div className="glass-card p-5">
            <h3
              className="heading-serif text-xl font-semibold mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Couple's Gallery
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Share this private link with the couple to access their gallery.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[oklch(0.46_0.10_290)/0.05] border border-[oklch(0.46_0.10_290)/0.15]">
              <p className="text-xs font-mono text-[oklch(0.40_0.06_290)] flex-1 truncate">
                {window.location.origin}/gallery/{event.coupleToken}
              </p>
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(`${window.location.origin}/gallery/${event.coupleToken}`)
                    .then(() => toast.success("Gallery link copied!"))
                }
                className="text-[oklch(0.46_0.10_290)] hover:text-[oklch(0.36_0.10_290)] flex-shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
