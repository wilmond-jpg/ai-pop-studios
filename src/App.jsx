// src/App.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Download,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
  Phone,
  LogIn,
  LogOut,
  Upload,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

/* -------------------------------------------------------
   Config
------------------------------------------------------- */
const LOGO_SRC_FALLBACK = "AI Pop Studios logo.png"; // local preview fallback
const LOGO_SRC = import.meta.env.VITE_LOGO_SRC || LOGO_SRC_FALLBACK;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || "";
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "drops-public";
const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL || "";

const supa =
  SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

const GROUPS = ["All", "SB19", "BINI", "PPop", "Other"];
const TAGS = [
  "Ken","Stell","Pablo","Josh","Justin",
  "Aiah","Maloi","Jhoanna","Gwen","Sheena","Mikha","Stacey",
  "Ghibli","Anime","Watercolor","Chibi","Sticker","Keychain","Wallpaper","Portrait",
];

function classNames(...s) {
  return s.filter(Boolean).join(" ");
}

function ShopGlyph({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 9.5h17" />
      <path d="M6 4.5h12l2 5H4l2-5Z" />
      <path d="M6.5 9.5V18a2.5 2.5 0 0 0 2.5 2.5h6a2.5 2.5 0 0 0 2.5-2.5V9.5" />
      <path d="M10 14h4" />
    </svg>
  );
}

const SHOP_FEATURES = [
  {
    title: "Instant download",
    description: "Access your templates immediately after checkout—no email wait required.",
  },
  {
    title: "Editable source files",
    description: "Layered Canva and PSD files so you can tweak colors, text, and export sizes fast.",
  },
  {
    title: "Creator-friendly license",
    description: "Personal use plus limited merch runs up to 200 prints included with every pack.",
  },
];

const SHOP_PRODUCTS = [
  {
    id: "sticker-pack",
    name: "Fan Sticker Pack Vol. 01",
    blurb: "25 neon die-cut stickers celebrating SB19 & BINI biases in high-res PNG format.",
    price: "$6.50",
    url: "https://aipopstudios.com/shop?template=stickers",
    highlights: [
      "25 transparent PNG stickers at 2000px",
      "Printable 4×6 layout for Cricut/Silhouette",
      "Commercial mini-run license included",
    ],
    accent: "from-fuchsia-500 via-pink-500 to-amber-400",
  },
  {
    id: "creator-badges",
    name: "Creator Badge Bundle",
    blurb: "Animated live supporter badges and shout-out frames ready for TikTok overlays.",
    price: "$9.00",
    url: "https://aipopstudios.com/shop?template=badges",
    highlights: [
      "12 animated badge templates (1080×1920)",
      "Editable Canva + layered PSD files",
      "Five colorway presets with typography guide",
    ],
    accent: "from-cyan-400 via-sky-500 to-purple-500",
  },
  {
    id: "highlight-kit",
    name: "Story Highlight Kit",
    blurb: "Cohesive Instagram highlight covers with matching wallpapers and gradient art.",
    price: "$7.50",
    url: "https://aipopstudios.com/shop?template=highlights",
    highlights: [
      "18 highlight cover PNGs + editable Canva file",
      "6 looping vertical story backgrounds",
      "Bonus lock-screen wallpaper trio",
    ],
    accent: "from-emerald-400 via-lime-400 to-teal-500",
  },
];

/* -------------------------------------------------------
   URL helpers
------------------------------------------------------- */
function useQueryParam(key) {
  const [value, setValue] = useState(
    () => new URLSearchParams(window.location.search).get(key) || ""
  );
  useEffect(() => {
    const onChange = () =>
      setValue(new URLSearchParams(window.location.search).get(key) || "");
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, [key]);
  return value;
}

/** Add/override a query param to any src (safe with existing params) */
function withParam(src, key, val) {
  try {
    const u = new URL(src);
    u.searchParams.set(key, val);
    return u.toString();
  } catch {
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
  }
}

/** Build a CDN preview URL for Supabase if possible, otherwise return src
 *  - Tries /storage/v1/render/image/public/... (Images Transform)
 *  - Falls back to the original src if it can't safely build a preview.
 */
function buildPreviewUrl(src, { width = 96, quality = 30 } = {}) {
  if (!SUPABASE_URL) return src;
  try {
    const base = new URL(SUPABASE_URL);
    const u = new URL(src);
    const isSameOrigin = u.origin === base.origin;
    const objectPrefix = "/storage/v1/object/public/";
    if (isSameOrigin && u.pathname.startsWith(objectPrefix)) {
      const rest = u.pathname.slice(objectPrefix.length); // "<bucket>/<path>"
      // Attempt Images Transform endpoint
      return `${base.origin}/storage/v1/render/image/public/${rest}?width=${width}&quality=${quality}&resize=contain`;
    }
  } catch {
    /* ignore and fall back */
  }
  // Generic tiny preview (does nothing if your CDN ignores it, still safe)
  return withParam(src, "preview", "1");
}

/** Build a native "save as" URL using ?download=filename
 *  Note: We now prefer the robust DownloadButton below which guarantees PNG/JPG.
 */
function buildDownloadUrl(src, filename = "download") {
  return withParam(src, "download", filename);
}

/* -------------------------------------------------------
   Progressive Image (fast perceived load)
------------------------------------------------------- */
function ProgressiveImg({ src, alt = "", className = "" , previewSrc }) {
  const [loaded, setLoaded] = useState(false);
  const [hasPreviewError, setHasPreviewError] = useState(false);

  // Preload full image then fade in
  useEffect(() => {
    let ok = true;
    const img = new Image();
    img.src = src;
    const settle = () => ok && setLoaded(true);
    img.decode?.().then(settle).catch(settle);
    return () => { ok = false; };
  }, [src]);

  // If you didn't enable Supabase image transforms, this will just equal src (fine)
  const preview = previewSrc || buildPreviewUrl(src, { width: 96, quality: 30 });

  return (
    // IMPORTANT: the wrapper must fill its parent (w-full h-full) and be relative
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Blurred tiny preview UNDERNEATH, absolutely positioned */}
      <img
        src={preview}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-300 ${loaded || hasPreviewError ? "opacity-0" : "opacity-100"}`}
        onError={() => setHasPreviewError(true)}
        loading="eager"
        decoding="async"
      />
      {/* Real image ON TOP, absolutely positioned */}
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="lazy"
        decoding="async"
      />
      {/* Optional skeleton while both aren't ready */}
      {!loaded && <div className="absolute inset-0 animate-pulse bg-neutral-900/40" />}
    </div>
  );
}

/* -------------------------------------------------------
   Robust Download Button (forces correct file type/extension)
   - Fetches the image as a Blob.
   - Re-wraps it as a File with the intended filename + mime.
   - Guarantees OS treats it as PNG/JPEG instead of "document".
------------------------------------------------------- */
function guessMimeFromFilename(name) {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function ensureExtension(name, fallbackExt = ".png") {
  const hasExt = /\.[a-z0-9]+$/i.test(name);
  return hasExt ? name : `${name}${fallbackExt}`;
}

function DownloadButton({ url, filename = "image.png", label = "Download" }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    try {
      setBusy(true);
      // Try GET with no-store to avoid cached funky headers from some CDNs
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();

      // Infer final filename & mime
      const safeName = ensureExtension(filename);
      const type = guessMimeFromFilename(safeName);

      // Wrap blob to force correct filetype on disk
      const file = new File([blob], safeName, { type });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      // Fallback: direct save-as URL (still better than nothing)
      const fallback = buildDownloadUrl(url, filename);
      window.location.href = fallback;
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
  onClick={handleDownload}
  disabled={busy}
  className="download-btn inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-60"
  aria-busy={busy}
  data-file={filename}   // 👈 filename Supabase gave us
  data-url={url}         // 👈 original image URL
>
  <Download className="h-3.5 w-3.5" />
  {busy ? "Preparing…" : label}
</button>

  );
}

/* -------------------------------------------------------
   UI: Header / Hero / Filters / Footer
------------------------------------------------------- */
function Header({ onNavigateHome, onNavigateShop, activeView }) {
  const [logoOk, setLogoOk] = useState(true);
  const isShop = activeView === "shop";
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-2xl px-1 -mx-1"
        >
          {logoOk ? (
            <img
              src={LOGO_SRC}
              alt="AI Pop Studios Logo"
              className="h-12 w-auto"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div className="h-10 px-3 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-pink-400 to-cyan-400 flex items-center text-black font-semibold">
              AI Pop Studios
            </div>
          )}
          <div>
            <h1 className="text-white font-semibold leading-tight">
              AI Pop Studios Download Hub
            </h1>
            <p className="text-xs text-white/70 -mt-0.5">
              AI-generated P-Pop wallpapers, stickers, and more
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateShop}
            className={classNames(
              "inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              isShop
                ? "bg-white text-black shadow-[0_12px_32px_-14px_rgba(255,255,255,0.75)]"
                : "bg-white/10 hover:bg-white/20 text-white"
            )}
            aria-pressed={isShop}
            title="Open the AI Pop Studios template shop"
          >
            <ShopGlyph className="h-4 w-4" />
            <span className="font-medium">Shop</span>
          </button>
          <a
            href="https://aipopstudios.com/shop"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            TikTok Shop
          </a>
          <a
            href="https://www.tiktok.com/@aipopstudios"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            Visit TikTok <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_-10%,rgba(168,85,247,0.25),transparent),radial-gradient(70%_50%_at_80%_10%,rgba(34,211,238,0.18),transparent)]" />
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 text-white/80 text-xs mb-3">
          <Phone className="h-4 w-4" />
          <span>Best viewed on mobile — tap an image, then press Download</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          Download the AI Pop Studios wallpapers from my TikTok drops
        </h2>
        <p className="mt-2 text-white/80 max-w-2xl">
          For Atin & Blooms 💖 Tap an artwork to open, long-press to save to
          Photos, or use the Download button below each image.
        </p>
      </div>
    </section>
  );
}

function ShopPage({ onBackToHome }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(34,211,238,0.14),transparent),radial-gradient(70%_55%_at_80%_10%,rgba(236,72,153,0.18),transparent)]" />
      <div className="relative max-w-6xl mx-auto px-4 py-10 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3">
              Digital Template Marketplace
            </p>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Launch-ready TikTok & IG assets for your next drop
            </h2>
            <p className="mt-4 text-white/80 text-base sm:text-lg">
              Mix-and-match sticker packs, animated supporter badges, and highlight kits made for creators. Each bundle includes layered source files so you can personalize colors, copy, and export sizes in minutes.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
            >
              ← Back to gallery
            </button>
            <a
              href="https://aipopstudios.com/shop"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm shadow-lg"
            >
              Visit full storefront <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {SHOP_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4 backdrop-blur"
            >
              <p className="text-sm font-semibold text-white">{feature.title}</p>
              <p className="mt-2 text-sm text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SHOP_PRODUCTS.map((product) => (
            <article
              key={product.id}
              className="relative rounded-3xl border border-white/10 bg-white/5 overflow-hidden flex flex-col"
            >
              <div
                className={`h-32 bg-gradient-to-br ${product.accent} opacity-90`}
                aria-hidden="true"
              />
              <div className="flex-1 p-5 flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                  <p className="mt-2 text-sm text-white/70">{product.blurb}</p>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  {product.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-base font-semibold text-white">{product.price}</span>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm"
                  >
                    View template <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Filters({ query, setQuery, group, setGroup, activeTags, setActiveTags, sort, setSort }) {
  const toggleTag = (t) =>
    setActiveTags((curr) => (curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]));
  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="grid md:grid-cols-4 gap-3">
        <div className="md:col-span-2 flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
          <Search className="h-4 w-4 text-white/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: Ken, Pablo, Anime, Ghibli…"
            className="bg-transparent outline-none w-full text-white placeholder:text-white/50"
          />
        </div>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white"
        >
          {GROUPS.map((g) => (
            <option className="bg-black" key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white"
        >
          <option className="bg-black" value="new">
            Newest first
          </option>
          <option className="bg-black" value="az">
            A → Z
          </option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => toggleTag(t)}
            className={classNames(
              "text-xs px-3 py-1.5 rounded-full border",
              activeTags.includes(t)
                ? "bg-white text-black border-white"
                : "bg-white/5 text-white border-white/10 hover:bg-white/10"
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Gallery + Modal
------------------------------------------------------- */
function Gallery({ items, onOpen }) {
  if (!items.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-white/70">
        <p className="mb-2">No results. Try removing filters or checking other tags.</p>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 pb-16">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {items.map((item) => {
          const baseName = item.filename || `${item.title || "download"}.png`;
          const fileName = ensureExtension(baseName); // enforce extension if missing
          return (
            <article
              key={item.id}
              className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5"
            >
              <button
                onClick={() => onOpen(item)}
                className="block w-full aspect-[9/16] bg-black"
              >
                <ProgressiveImg
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:opacity-90 transition"
                />
              </button>
              <div className="p-3 text-white">
                <h3 className="text-sm font-semibold line-clamp-2">{item.title}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <DownloadButton url={item.src} filename={fileName} label="Download" />
                  {item.tiktokUrl && (
                    <a
                      href={item.tiktokUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1"
                    >
                      TikTok <ChevronRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ open, onClose, item }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && closeBtnRef.current) closeBtnRef.current.focus();
  }, [open]);

  if (!open || !item) return null;

  const baseName = item?.filename || `${item?.title || "download"}.png`;
  const fileName = ensureExtension(baseName);

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative max-w-[92vw] w-[720px] rounded-3xl overflow-hidden border border-white/10 bg-neutral-900">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gradient-to-b from-black/70 to-black/20 sticky top-0 z-10">
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-medium"
            >
              ← Back to gallery
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          <div className="aspect-[9/16] bg-black relative">
            <ProgressiveImg
              src={item.src}
              alt={item.title}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-black/30 sticky bottom-0 z-10 flex flex-wrap gap-2 items-center justify-between">
            <div className="text-white/80 text-sm font-medium line-clamp-1 pr-2">
              {item.title}
            </div>
            <div className="flex gap-2">
              <DownloadButton url={item.src} filename={fileName} label="Download" />
              {item.tiktokUrl && (
                <a
                  href={item.tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
                >
                  Open TikTok <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Footer
------------------------------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 mt-6">
      <div className="max-w-6xl mx-auto px-4 text-white/70 text-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <p>
            © {new Date().getFullYear()} AI Pop Studios — AI-generated fan art hub for SB19, BINI & P-pop.
          </p>
          <p>Art is AI-generated. Personal use only. Not affiliated with SB19 or BINI.</p>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------
   Admin Panel (unchanged logic, minor formatting)
------------------------------------------------------- */
function AdminPanel({ onCreated }) {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({
    title: "",
    group: "SB19",
    tags: "Wallpaper,Portrait",
    filename: "",
    date: new Date().toISOString().slice(0, 10),
    tiktokUrl: "",
  });

  useEffect(() => {
    if (!supa) return;
    supa.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => {
      sub.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    if (supa)
      await supa.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
  };
  const signOut = async () => {
    if (supa) await supa.auth.signOut();
  };
  const canUse = !!(user?.email && user.email === ALLOWED_EMAIL);

  const upload = async (e) => {
    e.preventDefault();
    if (!supa) return alert("Missing Supabase env");
    if (!canUse) return alert("Not authorized");
    if (!file) return alert("Choose a file");
    try {
      setBusy(true);
      const path = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supa.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supa.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
      const src = pub.publicUrl;
      const tags = meta.tags.split(",").map((s) => s.trim()).filter(Boolean);
      const filename = meta.filename || file.name;

      const { error: insErr, data } = await supa
        .from("drops")
        .insert([
          {
            title: meta.title,
            group: meta.group,
            tags,
            src,
            filename,
            date: meta.date,
            tiktokUrl: meta.tiktokUrl,
          },
        ])
        .select()
        .single();
      if (insErr) throw insErr;

      setFile(null);
      setMeta({ ...meta, title: "", tiktokUrl: "", filename: "" });
      onCreated && onCreated(data);
      alert("Uploaded");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!supa) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-[460px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-white/80 text-sm font-medium">Admin Upload</div>
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={signOut}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          ) : (
            <button
              onClick={signIn}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </button>
          )}
        </div>
      </div>

      {!canUse ? (
        <p className="text-xs text-white/60">
          Sign in with the authorized Google account to upload.
        </p>
      ) : (
        <form onSubmit={upload} className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-white/80"
          />
          <input
            placeholder="Title"
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={meta.group}
              onChange={(e) => setMeta({ ...meta, group: e.target.value })}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
            >
              <option className="bg-black">SB19</option>
              <option className="bg-black">BINI</option>
              <option className="bg-black">PPop</option>
              <option className="bg-black">Other</option>
            </select>
            <input
              placeholder="YYYY-MM-DD"
              value={meta.date}
              onChange={(e) => setMeta({ ...meta, date: e.target.value })}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
            />
          </div>
          <input
            placeholder="Tags (comma-separated)"
            value={meta.tags}
            onChange={(e) => setMeta({ ...meta, tags: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Filename (optional)"
            value={meta.filename}
            onChange={(e) => setMeta({ ...meta, filename: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="TikTok URL (optional)"
            value={meta.tiktokUrl}
            onChange={(e) => setMeta({ ...meta, tiktokUrl: e.target.value })}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
          />
          <button
            disabled={busy || !file || !meta.title}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   App
------------------------------------------------------- */
export default function App() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [activeTags, setActiveTags] = useState([]);
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [remoteDrops, setRemoteDrops] = useState([]);
  const [view, setView] = useState("home");

  const adminMode = useQueryParam("admin") === "1";

  // Fetch drops from Supabase (safe: no-op if env missing)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supa) return;
      const { data, error } = await supa
        .from("drops")
        .select("*")
        .order("date", { ascending: false });
      if (!cancelled && !error && Array.isArray(data)) setRemoteDrops(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...remoteDrops];
    if (group !== "All") list = list.filter((i) => i.group === group);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) =>
        (i.title + " " + (i.tags || []).join(" ")).toLowerCase().includes(q)
      );
    }
    if (activeTags.length)
      list = list.filter((i) => activeTags.every((t) => (i.tags || []).includes(t)));
    if (sort === "new") list.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [remoteDrops, query, group, activeTags, sort]);

  useEffect(() => {
    if (view !== "home") {
      setOpen(false);
      setCurrent(null);
    }
  }, [view]);

  const goHome = () => setView("home");
  const goShop = () => setView("shop");

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-cyan-400" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-cyan-400 to-violet-500" />
      </div>

      <Header
        onNavigateHome={goHome}
        onNavigateShop={goShop}
        activeView={view}
      />

      {view === "home" ? (
        <>
          <Hero />

          <section className="pt-2">
            <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-white/70 text-sm mb-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </div>
            <Filters
              query={query}
              setQuery={setQuery}
              group={group}
              setGroup={setGroup}
              activeTags={activeTags}
              setActiveTags={setActiveTags}
              sort={sort}
              setSort={setSort}
            />
            <Gallery
              items={filtered}
              onOpen={(item) => {
                setCurrent(item);
                setOpen(true);
              }}
            />
          </section>

          <Footer />
          <Modal
            open={open}
            onClose={() => {
              setOpen(false);
              setCurrent(null);
            }}
            item={current}
          />

          {adminMode && (
            <AdminPanel
              onCreated={(rec) =>
                setRemoteDrops((prev) => (prev ? [rec, ...prev] : [rec]))
              }
            />
          )}
        </>
      ) : (
        <>
          <ShopPage onBackToHome={goHome} />
          <Footer />
        </>
      )}
    </main>
  );
}
