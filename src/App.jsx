// src/App.jsx
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
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

const SHOP_PRODUCTS = [
  {
    id: "sticker-pack",
    name: "Fan Sticker Pack Vol. 01",
    description:
      "25 die-cut ready stickers celebrating SB19 and BINI biases in vibrant neon gradients.",
    price: "$6.50",
    includes: [
      "25 transparent PNG stickers at 2000px",
      "Printable 4x6 layout for home cutters",
      "Commercial mini-run license (up to 200 prints)",
    ],
    accent: "from-fuchsia-500 via-pink-500 to-amber-400",
    buyUrl: "https://aipopstudios.com/shop?template=stickers",
  },
  {
    id: "creator-badges",
    name: "Creator Badge Bundle",
    description:
      "Animated TikTok live badges and supporter shout-out frames built for fast customization.",
    price: "$9.00",
    includes: [
      "12 animated badge templates (1080x1920)",
      "Editable Canva + layered PSD files",
      "5 colorway presets and typography guide",
    ],
    accent: "from-cyan-400 via-sky-500 to-purple-500",
    buyUrl: "https://aipopstudios.com/shop?template=badges",
  },
  {
    id: "highlight-kit",
    name: "Story Highlight Kit",
    description:
      "A cohesive Instagram highlight set with matching wallpapers and gradient cover art.",
    price: "$7.50",
    includes: [
      "18 highlight cover PNGs + editable Canva file",
      "Six looping vertical story backgrounds",
      "Bonus lock-screen wallpaper trio",
    ],
    accent: "from-emerald-400 via-lime-400 to-teal-500",
    buyUrl: "https://aipopstudios.com/shop?template=highlights",
  },
];

const SHOP_HIGHLIGHTS = [
  {
    title: "Instant downloads",
    detail: "Get a download link right after checkout—no waiting for email attachments.",
  },
  {
    title: "Editable source files",
    detail: "Each kit ships with layered Canva or PSD assets so you can tweak colors and text.",
  },
  {
    title: "Creator-friendly licensing",
    detail: "Use the templates for personal projects or limited merch runs up to 200 pieces.",
  },
];

function usePathname() {
  const [path, setPath] = useState(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname || "/";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next, { replace = false, preserveSearch = false } = {}) => {
    if (typeof window === "undefined" || !next) return;
    const base = next.startsWith("/") ? next : `/${next}`;
    const search = preserveSearch ? window.location.search : "";
    const target = `${base}${search}`;
    const method = replace ? "replaceState" : "pushState";
    window.history[method]?.({}, "", target);
    setPath(window.location.pathname || "/");
  }, []);

  return [path, navigate];
}

function ShopIcon({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 9.5h14" />
      <path d="M6.2 4.5h11.6l2 5H4.2l2-5Z" fill="currentColor" opacity="0.12" />
      <path d="M6.5 9.5V18a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V9.5" />
      <path d="M10 14h4" />
    </svg>
  );
}

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
function Header({ onHome, onShop, activePath }) {
  const [logoOk, setLogoOk] = useState(true);
  const isShopActive = activePath.startsWith("/shop");
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          className="flex items-center gap-3 text-white no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-2xl px-1 -mx-1"
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
        </a>
        <div className="flex items-center gap-2">
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              onShop();
            }}
            className={classNames(
              "inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              isShopActive
                ? "bg-white text-black shadow-[0_10px_30px_-12px_rgba(255,255,255,0.6)]"
                : "bg-white/10 hover:bg-white/20 text-white"
            )}
            aria-current={isShopActive ? "page" : undefined}
            title="Open the digital template shop"
          >
            <ShopIcon className="h-4 w-4" />
            <span className="font-medium">Shop</span>
          </a>
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

function ShopPage({ onNavigateHome }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(34,211,238,0.12),transparent),radial-gradient(70%_55%_at_80%_10%,rgba(236,72,153,0.18),transparent)]" />
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
              Mix-and-match sticker packs, animated supporter badges, and highlight kits made for creators.
              Each template includes layered source files so you can customize colors, text, and export sizes in minutes.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
            >
              ← Back to gallery
            </button>
            <a
              href="https://aipopstudios.com/shop"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold shadow-lg shadow-fuchsia-500/30"
            >
              Explore full store <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {SHOP_HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-white/70">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SHOP_PRODUCTS.map((product) => (
            <article
              key={product.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/60 backdrop-blur"
            >
              <div className={`h-40 bg-gradient-to-br ${product.accent}`} />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <p className="mt-2 text-sm text-white/70">{product.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {product.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">{product.price}</span>
                  <a
                    href={product.buyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white text-black px-3 py-1.5 text-sm font-medium shadow-[0_12px_30px_-16px_rgba(255,255,255,0.9)] transition hover:-translate-y-0.5"
                  >
                    Buy template <ArrowUpRight className="h-4 w-4" />
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

function NotFound({ onNavigateHome }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(75%_55%_at_30%_0%,rgba(244,114,182,0.12),transparent),radial-gradient(60%_40%_at_80%_10%,rgba(59,130,246,0.14),transparent)]" />
      <div className="relative max-w-6xl mx-auto px-4 py-20 text-center text-white">
        <h2 className="text-3xl font-semibold">Page not found</h2>
        <p className="mt-3 text-white/70 max-w-2xl mx-auto">
          The page you were looking for has moved. Jump back to the download gallery to keep exploring the latest drops.
        </p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white text-black px-5 py-2 text-sm font-medium"
        >
          ← Back to gallery
        </button>
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

  const [path, navigate] = usePathname();
  const goHome = useCallback(() => navigate("/", { preserveSearch: true }), [navigate]);
  const goShop = useCallback(() => navigate("/shop"), [navigate]);

  const isHome = path === "/" || path === "";
  const isShop = path.startsWith("/shop");

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
    if (!isHome) {
      setOpen(false);
      setCurrent(null);
    }
  }, [isHome]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-cyan-400" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-cyan-400 to-violet-500" />
      </div>

      <Header onHome={goHome} onShop={goShop} activePath={path} />

      {isHome ? (
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
        </>
      ) : isShop ? (
        <ShopPage onNavigateHome={goHome} />
      ) : (
        <NotFound onNavigateHome={goHome} />
      )}

      <Footer />

      {isHome && (
        <>
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
      )}
    </main>
  );
}
