import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Calendar,
  Camera,
  Copy,
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  Plus,
  Settings,
  Trash2,
  Users,
} from "lucide-react";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [coupleName, setCoupleName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [venue, setVenue] = useState("");

  const eventsQuery = trpc.wedding.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createMutation = trpc.wedding.create.useMutation({
    onSuccess: () => {
      eventsQuery.refetch();
      setShowCreate(false);
      setCoupleName("");
      setWeddingDate("");
      setVenue("");
      toast.success("Wedding event created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.wedding.delete.useMutation({
    onSuccess: () => {
      eventsQuery.refetch();
      toast.success("Event deleted.");
    },
    onError: () => toast.error("Failed to delete event."),
  });

  const handleCreate = () => {
    if (!coupleName.trim() || !weddingDate) {
      toast.error("Please fill in couple name and wedding date.");
      return;
    }
    createMutation.mutate({ coupleName: coupleName.trim(), weddingDate, venue: venue.trim() || undefined });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  if (loading) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.46_0.10_290)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center px-6">
        <div className="glass-card p-10 text-center max-w-sm corner-bracket">
          <Heart className="w-10 h-10 text-[oklch(0.46_0.10_290)] mx-auto mb-4" fill="currentColor" />
          <h2
            className="heading-serif text-3xl font-semibold mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Admin Access
          </h2>
          <div className="divider-ornament w-24 mx-auto my-4">
            <span className="text-[oklch(0.55_0.04_285)]">✦</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Please sign in to manage wedding events.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[oklch(0.46_0.10_290)] text-white font-medium text-sm hover:bg-[oklch(0.40_0.10_290)] transition-all"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen wedding-bg flex items-center justify-center px-6">
        <div className="glass-card p-10 text-center max-w-sm corner-bracket">
          <h2
            className="heading-serif text-2xl font-semibold mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Access Restricted
          </h2>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to access this page.
          </p>
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
        <h1
          className="heading-serif text-4xl sm:text-5xl font-semibold mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Admin Dashboard
        </h1>
        <div className="divider-ornament w-32 mx-auto my-3">
          <span className="text-[oklch(0.55_0.04_285)]">✦</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Welcome, <span className="font-medium">{user.name}</span>
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* ── Create Event ──────────────────────────────────────────────── */}
        {showCreate ? (
          <div className="glass-card p-6 corner-bracket mb-6">
            <h3
              className="heading-serif text-2xl font-semibold mb-5"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              New Wedding Event
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[oklch(0.40_0.04_285)] mb-1.5 block tracking-wide">
                  Couple's Names *
                </label>
                <Input
                  placeholder="e.g. Emma & James"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  className="bg-white/60 border-[oklch(0.88_0.018_290)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[oklch(0.40_0.04_285)] mb-1.5 block tracking-wide">
                  Wedding Date *
                </label>
                <Input
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="bg-white/60 border-[oklch(0.88_0.018_290)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[oklch(0.40_0.04_285)] mb-1.5 block tracking-wide">
                  Venue
                </label>
                <Input
                  placeholder="e.g. The Grand Ballroom, Istanbul"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="bg-white/60 border-[oklch(0.88_0.018_290)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.40_0.10_290)] text-white"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Event
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-[oklch(0.88_0.018_290)]"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            className="w-full mb-6 py-5 rounded-full bg-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.40_0.10_290)] text-white shadow-md text-sm font-medium"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Wedding Event
          </Button>
        )}

        {/* ── Events List ───────────────────────────────────────────────── */}
        {eventsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.46_0.10_290)]" />
          </div>
        ) : !eventsQuery.data?.length ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[oklch(0.46_0.10_290)/0.08] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-[oklch(0.46_0.10_290)/0.4]" />
            </div>
            <h3
              className="heading-serif text-2xl font-medium mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              No events yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Create your first wedding event to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventsQuery.data.map((event) => {
              const galleryUrl = `${window.location.origin}/gallery/${event.coupleToken}`;
              return (
                <div key={event.id} className="glass-card p-5 corner-bracket">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3
                        className="heading-serif text-xl font-semibold"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {event.coupleName}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(event.weddingDate)}
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.venue}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={event.isActive === "yes" ? "default" : "secondary"}
                      className={event.isActive === "yes"
                        ? "bg-[oklch(0.46_0.10_290)] text-white text-xs"
                        : "text-xs"
                      }
                    >
                      {event.isActive === "yes" ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Gallery Link */}
                  <div className="p-3 rounded-lg bg-[oklch(0.46_0.10_290)/0.05] border border-[oklch(0.46_0.10_290)/0.15] mb-3">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium tracking-wide">
                      Couple's Gallery Link
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[oklch(0.40_0.06_290)] flex-1 truncate font-mono">
                        {galleryUrl}
                      </p>
                      <button
                        onClick={() => copyToClipboard(galleryUrl, "Gallery link")}
                        className="text-[oklch(0.46_0.10_290)] hover:text-[oklch(0.36_0.10_290)] flex-shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={galleryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[oklch(0.46_0.10_290)] hover:text-[oklch(0.36_0.10_290)] flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[oklch(0.88_0.018_290)] text-xs font-medium text-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.46_0.10_290)/0.06] transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Manage Tables & QR
                    </Link>
                    <a
                      href={galleryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[oklch(0.88_0.018_290)] text-xs font-medium text-[oklch(0.46_0.10_290)] hover:bg-[oklch(0.46_0.10_290)/0.06] transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      View Gallery
                    </a>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${event.coupleName}"? This cannot be undone.`)) {
                          deleteMutation.mutate({ id: event.id });
                        }
                      }}
                      className="p-2 rounded-lg border border-[oklch(0.88_0.018_290)] text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
