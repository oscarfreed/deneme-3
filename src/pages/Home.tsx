import { Camera, Heart, Music, QrCode, Star, Upload } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen wedding-bg">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[oklch(0.46_0.10_290)]" fill="currentColor" />
          <span className="font-serif text-lg font-semibold text-[oklch(0.28_0.045_285)]">
            Wedding Memories
          </span>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-[oklch(0.46_0.10_290)] hover:text-[oklch(0.36_0.10_290)] transition-colors"
        >
          Admin Panel
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        {/* Geometric accent */}
        <div className="relative inline-block mb-8 corner-bracket px-8 py-2">
          <p className="text-xs tracking-[0.3em] uppercase text-[oklch(0.55_0.04_285)] font-sans font-medium">
            Capture Every Moment
          </p>
        </div>

        <h1
          className="heading-serif text-5xl sm:text-6xl md:text-7xl font-semibold mb-6 max-w-3xl leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Your Wedding,
          <br />
          <em className="italic font-normal">Remembered Forever</em>
        </h1>

        <div className="divider-ornament w-48 mx-auto my-6">
          <span className="text-[oklch(0.55_0.04_285)] text-lg">✦</span>
        </div>

        <p className="text-[oklch(0.45_0.04_285)] text-lg max-w-xl leading-relaxed mb-10 font-light tracking-wide">
          Guests scan a QR code at their table and instantly share photos, videos, and voice messages —
          all gathered in one beautiful gallery for the couple.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[oklch(0.46_0.10_290)] text-white font-medium text-sm tracking-wide hover:bg-[oklch(0.40_0.10_290)] transition-all shadow-lg hover:shadow-xl"
          >
            <Heart className="w-4 h-4" />
            Create Your Wedding
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[oklch(0.46_0.10_290)/0.4] text-[oklch(0.46_0.10_290)] font-medium text-sm tracking-wide hover:bg-[oklch(0.46_0.10_290)/0.06] transition-all"
          >
            How It Works
          </a>
        </div>

        {/* Floating media type badges */}
        <div className="flex gap-3 mt-12 flex-wrap justify-center">
          {[
            { icon: Camera, label: "Photos", color: "oklch(0.46 0.10 290)" },
            { icon: Upload, label: "Videos", color: "oklch(0.60 0.10 340)" },
            { icon: Music, label: "Audio", color: "oklch(0.50 0.08 165)" },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="glass-card flex items-center gap-2 px-4 py-2 text-sm"
              style={{ color }}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-[oklch(0.55_0.04_285)] mb-4">
              Simple & Elegant
            </p>
            <h2
              className="heading-serif text-4xl sm:text-5xl font-semibold"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              How It Works
            </h2>
            <div className="divider-ornament w-32 mx-auto mt-6">
              <span className="text-[oklch(0.55_0.04_285)]">✦</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: QrCode,
                title: "Place QR Codes",
                desc: "Print unique QR codes for each table or location and place them elegantly at your venue.",
              },
              {
                step: "02",
                icon: Camera,
                title: "Guests Upload",
                desc: "Guests scan the code with their phone — no app, no login. Just tap and share their moments.",
              },
              {
                step: "03",
                icon: Heart,
                title: "Couple Receives",
                desc: "Every photo, video, and voice message appears instantly in your private gallery.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="glass-card p-8 corner-bracket text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[oklch(0.46_0.10_290)/0.1] mb-4">
                  <Icon className="w-5 h-5 text-[oklch(0.46_0.10_290)]" />
                </div>
                <p className="text-xs tracking-[0.25em] text-[oklch(0.55_0.04_285)] mb-2 font-sans">
                  {step}
                </p>
                <h3
                  className="heading-serif text-xl font-semibold mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {title}
                </h3>
                <p className="text-sm text-[oklch(0.50_0.04_285)] leading-relaxed font-light">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-10 corner-bracket">
            <div className="text-center mb-10">
              <h2
                className="heading-serif text-3xl sm:text-4xl font-semibold"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Everything You Need
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                "QR codes for every table",
                "Photos, videos & audio",
                "No app download required",
                "Real-time gallery updates",
                "AI-generated captions",
                "Batch ZIP download",
                "Instant notifications",
                "Mobile-first design",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-[oklch(0.46_0.10_290)] flex-shrink-0" fill="currentColor" />
                  <span className="text-sm text-[oklch(0.40_0.04_285)] font-light tracking-wide">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-10 text-center">
        <div className="divider-ornament w-48 mx-auto mb-6">
          <span className="text-[oklch(0.55_0.04_285)]">✦</span>
        </div>
        <p className="text-xs text-[oklch(0.60_0.04_285)] tracking-widest uppercase">
          Wedding Memories — Cherish Every Moment
        </p>
      </footer>
    </div>
  );
}
