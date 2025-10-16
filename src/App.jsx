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
  X,
  Shield,
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
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ALLOWED_EMAIL || "";

const supa =
  SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

const GROUPS = ["All", "SB19", "BINI", "PPop", "Other"];

function classNames(...s) {
  return s.filter(Boolean).join(" ");
}

const DEFAULT_CURRENCY = "PHP";
const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: DEFAULT_CURRENCY,
});

function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "";
  try {
    const locale = currency === "PHP" ? "en-PH" : undefined;
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch (err) {
    console.warn("Unable to format currency", currency, err);
    return pesoFormatter.format(amount);
  }
}

function parseCurrencyAmount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function isAdminUser(user) {
  if (!ADMIN_EMAIL) return false;
  const email = user?.email || "";
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
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
    title: "GCash payments",
    description: "Check out locally with secure GCash transfers priced in Philippine pesos.",
  },
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
    priceAmount: 349,
    currency: DEFAULT_CURRENCY,
    price: formatCurrency(349),
    url: "https://aipopstudios.com/shop?template=stickers",
    downloadUrl: "",
    highlights: [
      "25 transparent PNG stickers at 2000px",
      "Printable 4×6 layout for Cricut/Silhouette",
      "Commercial mini-run license included",
    ],
    accent: "from-fuchsia-500 via-pink-500 to-amber-400",
    ctaLabel: "View template",
    ctaType: "external",
  },
  {
    id: "creator-badges",
    name: "Creator Badge Bundle",
    blurb: "Animated live supporter badges and shout-out frames ready for TikTok overlays.",
    priceAmount: 499,
    currency: DEFAULT_CURRENCY,
    price: formatCurrency(499),
    url: "https://aipopstudios.com/shop?template=badges",
    downloadUrl: "",
    highlights: [
      "12 animated badge templates (1080×1920)",
      "Editable Canva + layered PSD files",
      "Five colorway presets with typography guide",
    ],
    accent: "from-cyan-400 via-sky-500 to-purple-500",
    ctaLabel: "View template",
    ctaType: "external",
  },
  {
    id: "highlight-kit",
    name: "Story Highlight Kit",
    blurb: "Cohesive Instagram highlight covers with matching wallpapers and gradient art.",
    priceAmount: 429,
    currency: DEFAULT_CURRENCY,
    price: formatCurrency(429),
    url: "https://aipopstudios.com/shop?template=highlights",
    downloadUrl: "",
    highlights: [
      "18 highlight cover PNGs + editable Canva file",
      "6 looping vertical story backgrounds",
      "Bonus lock-screen wallpaper trio",
    ],
    accent: "from-emerald-400 via-lime-400 to-teal-500",
    ctaLabel: "View template",
    ctaType: "external",
  },
];

function parseHighlights(value) {
  if (Array.isArray(value)) return value.map((v) => `${v}`.trim()).filter(Boolean);
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeShopItem(item) {
  if (!item) return null;
  const highlights = parseHighlights(item.highlights ?? item.highlights_text ?? item.highlights_raw);
  const accent = item.accent || item.accent_class || "from-fuchsia-500 via-pink-500 to-amber-400";
  const downloadUrl = item.download_url || item.file_url || item.asset_url || "";
  const externalUrl = item.external_url || item.url || "";
  const delivery = item.delivery || item.cta_type || (downloadUrl ? "download" : "external");
  const ctaLabel = item.cta_label || (delivery === "download" ? "Download" : "View template");
  const rawCurrency =
    item.currency || item.currency_code || item.price_currency || item.currencyCode || DEFAULT_CURRENCY;
  const currency = `${rawCurrency || DEFAULT_CURRENCY}`.toUpperCase();
  const rawAmount =
    item.price_amount ??
    item.priceAmount ??
    (typeof item.price_in_cents === "number" ? item.price_in_cents / 100 : undefined) ??
    (typeof item.amount_in_cents === "number" ? item.amount_in_cents / 100 : undefined);
  const parsedAmount = parseCurrencyAmount(
    rawAmount ??
      item.price_php ??
      item.price_peso ??
      item.price ??
      item.amount ??
      item.priceLabel ??
      item.price_label
  );
  const priceAmount =
    typeof rawAmount === "number" && Number.isFinite(rawAmount) ? rawAmount : parsedAmount || 0;
  const priceLabel =
    item.price_label ||
    item.priceLabel ||
    (priceAmount ? formatCurrency(priceAmount, currency) : item.price || item.amount || "");

  return {
    id: item.id || item.slug || `shop-${Date.now()}`,
    name: item.name || item.title || "Untitled template",
    blurb: item.blurb || item.description || "",
    price: priceLabel,
    priceAmount,
    currency,
    priceLabel,
    url: delivery === "external" ? externalUrl || downloadUrl : downloadUrl || externalUrl,
    downloadUrl,
    highlights,
    accent,
    ctaLabel,
    ctaType: delivery,
  };
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
function Header({
  onNavigateHome,
  onNavigateShop,
  onOpenAccount,
  onOpenAdmin,
  onSignOut,
  activeView,
  user,
  isAdmin,
}) {
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
          <button
            type="button"
            onClick={onOpenAdmin}
            className={classNames(
              "inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              isAdmin ? "bg-white text-black" : "bg-white/10 hover:bg-white/20 text-white"
            )}
            title="Open admin tools"
          >
            <Shield className="h-4 w-4" />
            <span className="font-medium">Admin</span>
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
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAccount}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <span className="max-w-[140px] truncate">{user.email}</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white text-black font-medium"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAccount}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          )}
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

function ShopPage({
  onBackToHome,
  products = SHOP_PRODUCTS,
  onAddToCart,
  onOpenCart,
  cartCount = 0,
}) {
  const cartLabel = cartCount > 0 ? `View cart (${cartCount})` : "View cart";
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
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm shadow-lg"
            >
              {cartLabel}
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
          {products.map((product) => {
            const actionUrl =
              product.ctaType === "download"
                ? product.downloadUrl || product.url
                : product.url || product.downloadUrl;
            const isDownload = product.ctaType === "download";
            const label = product.ctaLabel || (isDownload ? "Download" : "View template");
            const Icon = isDownload ? Download : ArrowUpRight;
            const disabled = !actionUrl;
            const highlights = Array.isArray(product.highlights)
              ? product.highlights
              : parseHighlights(product.highlights);
            const priceLabel =
              typeof product.priceAmount === "number" && product.priceAmount > 0
                ? formatCurrency(product.priceAmount, product.currency || DEFAULT_CURRENCY)
                : product.price || product.priceLabel || "";
            return (
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
                    {highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-white">{priceLabel}</span>
                      <button
                        type="button"
                        onClick={() => onAddToCart?.(product)}
                        className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
                      >
                        Add to cart
                      </button>
                    </div>
                    <a
                      href={actionUrl || "#"}
                      target={isDownload ? "_self" : "_blank"}
                      rel={isDownload ? undefined : "noreferrer"}
                      download={isDownload ? `${product.name}.zip` : undefined}
                      className={classNames(
                        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm transition",
                        disabled && "pointer-events-none opacity-60"
                      )}
                    >
                      {label} <Icon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CheckoutModal({
  open,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutComplete,
}) {
  const [customer, setCustomer] = useState({ name: "", email: "", gcash: "", note: "" });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isCartEmpty = !cart?.length;

  useEffect(() => {
    if (!open) {
      setCustomer({ name: "", email: "", gcash: "", note: "" });
      setStatus(null);
      setSubmitting(false);
    }
  }, [open]);

  const total = useMemo(() => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, entry) => {
      const amount =
        typeof entry.product?.priceAmount === "number" && entry.product.priceAmount > 0
          ? entry.product.priceAmount
          : parseCurrencyAmount(entry.product?.price || entry.product?.priceLabel || 0);
      return sum + amount * (entry.quantity || 0);
    }, 0);
  }, [cart]);

  const handleUpdate = (id, quantity) => {
    if (!onUpdateQuantity) return;
    if (quantity < 1) {
      onRemoveItem?.(id);
    } else {
      onUpdateQuantity(id, quantity);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isCartEmpty) {
      setStatus({ tone: "error", message: "Add a template to your cart before checking out." });
      return;
    }
    if (!customer.name || !customer.email || !customer.gcash) {
      setStatus({
        tone: "error",
        message: "Please enter your name, email, and 11-digit GCash number.",
      });
      return;
    }
    if (!/^09\d{9}$/.test(customer.gcash)) {
      setStatus({
        tone: "error",
        message: "GCash numbers should start with 09 and include 11 digits.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus({ tone: "info", message: "Creating your GCash payment request…" });
      setTimeout(() => {
        setStatus({
          tone: "success",
          message: `GCash request sent! Approve the ₱${total.toFixed(
            2
          )} payment on your device to receive your download links via email.`,
        });
        onCheckoutComplete?.({
          customer,
          total,
          createdAt: new Date().toISOString(),
        });
        setSubmitting(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setStatus({
        tone: "error",
        message: "We couldn't start the GCash payment right now. Please try again.",
      });
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-neutral-900/95 p-6 text-white shadow-xl backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Close checkout dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Checkout</p>
          <h2 className="text-2xl font-semibold">Pay with GCash</h2>
          <p className="text-sm text-white/70">
            Confirm your cart and enter your GCash details to receive a payment request in Philippine pesos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Cart summary</h3>
                <span className="text-sm text-white/60">{cart?.length || 0} items</span>
              </div>
              <div className="mt-3 space-y-3">
                {!cart?.length && (
                  <p className="text-sm text-white/60">Your cart is empty. Add a sticker pack to begin checkout.</p>
                )}
                {cart?.map((entry) => {
                  const unitAmount =
                    typeof entry.product?.priceAmount === "number" && entry.product.priceAmount > 0
                      ? entry.product.priceAmount
                      : parseCurrencyAmount(entry.product?.price || entry.product?.priceLabel || 0);
                  const priceLabel =
                    unitAmount > 0
                      ? formatCurrency(unitAmount, entry.product?.currency || DEFAULT_CURRENCY)
                      : entry.product?.price || entry.product?.priceLabel || "";
                  const quantity = entry.quantity || 0;
                  const lineTotal = unitAmount * quantity;
                  return (
                    <div
                      key={entry.product?.id}
                      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{entry.product?.name}</p>
                          <p className="text-xs text-white/60">{priceLabel}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem?.(entry.product?.id)}
                          className="text-xs text-white/60 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <label className="flex items-center gap-2">
                          <span className="text-white/60">Qty</span>
                          <input
                            type="number"
                            min="1"
                            value={entry.quantity}
                            onChange={(event) => handleUpdate(entry.product?.id, Number(event.target.value) || 1)}
                            className="w-16 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-white focus:border-white/30 focus:outline-none"
                          />
                        </label>
                        <span className="font-semibold text-white">
                          {formatCurrency(lineTotal, entry.product?.currency || DEFAULT_CURRENCY)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-sm text-white/60">Total</span>
                <span className="text-lg font-semibold text-white">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <label className="block text-sm font-medium text-white/80">
                Full name
                <input
                  value={customer.name}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  placeholder="Juan Dela Cruz"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-white/80">
                Email address
                <input
                  type="email"
                  value={customer.email}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-white/80">
                GCash number
                <input
                  value={customer.gcash}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, gcash: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  placeholder="09XXXXXXXXX"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-white/80">
                Order notes (optional)
                <textarea
                  value={customer.note}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, note: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  rows={3}
                  placeholder="Share customization requests or delivery notes"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting || isCartEmpty}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {submitting ? "Processing GCash payment…" : `Pay ${formatCurrency(total)}`}
            </button>
            {status && (
              <p
                className={classNames(
                  "text-sm",
                  status.tone === "error"
                    ? "text-rose-300"
                    : status.tone === "success"
                    ? "text-emerald-300"
                    : "text-white/70"
                )}
              >
                {status.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ open, onClose, user, onSignOut }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode("signin");
      setForm({ email: "", password: "", confirm: "" });
      setStatus(null);
      setLoading(false);
    }
  }, [open]);

  const supabaseReady = Boolean(supa);

  const updateField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabaseReady) {
      setStatus({
        tone: "error",
        message: "Authentication is disabled. Add Supabase credentials to enable sign in.",
      });
      return;
    }

    if (!form.email || !form.password) {
      setStatus({ tone: "error", message: "Enter your email and password." });
      return;
    }

    if (mode === "signup" && form.password !== form.confirm) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);
      if (mode === "signup") {
        const { error } = await supa.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        setStatus({
          tone: "success",
          message: "Check your email to confirm your account, then sign in.",
        });
        setMode("signin");
        setForm((prev) => ({ ...prev, password: "", confirm: "" }));
      } else {
        const { error } = await supa.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        setStatus({ tone: "success", message: "Signed in successfully." });
        onClose?.();
      }
    } catch (err) {
      setStatus({ tone: "error", message: err.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      if (onSignOut) await onSignOut();
      else if (supa) await supa.auth.signOut();
      onClose?.();
    } catch (err) {
      setStatus({ tone: "error", message: err.message || "Unable to sign out right now." });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900/90 p-6 text-white shadow-xl backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Close authentication dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {user ? (
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Account</p>
              <h3 className="mt-1 text-2xl font-semibold">You're signed in</h3>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/80">
              <p className="font-medium text-white">{user.email}</p>
              {user.user_metadata?.full_name && (
                <p className="text-white/60">{user.user_metadata.full_name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            {status && (
              <p
                className={classNames(
                  "text-sm",
                  status.tone === "error" ? "text-rose-300" : "text-emerald-300"
                )}
              >
                {status.message}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                {mode === "signup" ? "Create account" : "Welcome back"}
              </p>
              <h3 className="mt-1 text-2xl font-semibold">
                {mode === "signup" ? "Join AI Pop Studios" : "Sign in to continue"}
              </h3>
            </div>
            {!supabaseReady && (
              <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Add your Supabase keys to enable email sign up & login.
              </div>
            )}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/80">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField("email")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-white/80">
                Password
                <input
                  type="password"
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={updateField("password")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                />
              </label>
              {mode === "signup" && (
                <label className="block text-sm font-medium text-white/80">
                  Confirm password
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={updateField("confirm")}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                  />
                </label>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode((prev) => (prev === "signup" ? "signin" : "signup"));
                setStatus(null);
              }}
              className="w-full text-center text-sm text-white/70 hover:text-white"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
            {status && (
              <p
                className={classNames(
                  "text-sm",
                  status.tone === "error" ? "text-rose-300" : "text-emerald-300"
                )}
              >
                {status.message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function Filters({ query, setQuery, group, setGroup, sort, setSort }) {
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
        <p className="mb-2">No results. Try adjusting your filters.</p>
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
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-3xl max-h-[85vh] rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-b from-black/70 to-black/20">
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

          <div className="flex-1 min-h-0 bg-black/80 flex items-center justify-center p-4 overflow-auto">
            <ProgressiveImg
              src={item.src}
              alt={item.title}
              className="max-h-full max-w-full w-auto h-auto object-contain"
            />
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-black/30 flex flex-wrap gap-2 items-center justify-between">
            <div className="text-white/80 text-sm font-medium line-clamp-1 pr-2">
              {item.title}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
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
   Admin Modal
------------------------------------------------------- */
function createInitialDropMeta() {
  return {
    title: "",
    group: "SB19",
    tags: "Wallpaper,Portrait",
    filename: "",
    date: new Date().toISOString().slice(0, 10),
    tiktokUrl: "",
  };
}

function createInitialShopMeta() {
  return {
    name: "",
    blurb: "",
    price: "",
    highlights: "High-res PNG exports\nSource PSD/Canva file",
    accent: "from-fuchsia-500 via-pink-500 to-amber-400",
    delivery: "download",
    externalUrl: "",
    ctaLabel: "",
    category: "Stickers",
  };
}

function AdminModal({ open, onClose, user, onSignOut, onDropCreated, onShopCreated }) {
  const [tab, setTab] = useState("drops");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);

  const [dropMeta, setDropMeta] = useState(() => createInitialDropMeta());
  const [dropFile, setDropFile] = useState(null);
  const [dropBusy, setDropBusy] = useState(false);
  const [dropStatus, setDropStatus] = useState(null);

  const [shopMeta, setShopMeta] = useState(() => createInitialShopMeta());
  const [shopFile, setShopFile] = useState(null);
  const [shopBusy, setShopBusy] = useState(false);
  const [shopStatus, setShopStatus] = useState(null);

  useEffect(() => {
    if (!open) {
      setTab("drops");
      setAuthForm({ email: "", password: "" });
      setAuthBusy(false);
      setAuthStatus(null);
      setDropMeta(createInitialDropMeta());
      setDropFile(null);
      setDropBusy(false);
      setDropStatus(null);
      setShopMeta(createInitialShopMeta());
      setShopFile(null);
      setShopBusy(false);
      setShopStatus(null);
    }
  }, [open]);

  const supabaseReady = !!supa;
  const hasAdminEmail = !!ADMIN_EMAIL;
  const authorized = isAdminUser(user);

  const updateAuthField = (field) => (event) => {
    const value = event.target.value;
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdminSignIn = async (event) => {
    event.preventDefault();
    if (!supabaseReady) {
      setAuthStatus({ tone: "error", message: "Add Supabase credentials to enable admin login." });
      return;
    }
    try {
      setAuthBusy(true);
      setAuthStatus(null);
      const { error } = await supa.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });
      if (error) throw error;
      setAuthStatus({
        tone: "success",
        message: "Signed in. If this account is authorized you'll see the upload tools below.",
      });
    } catch (err) {
      setAuthStatus({ tone: "error", message: err.message || "Unable to sign in." });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAdminGoogle = async () => {
    if (!supabaseReady) {
      setAuthStatus({ tone: "error", message: "Add Supabase credentials to enable Google login." });
      return;
    }
    try {
      setAuthBusy(true);
      setAuthStatus(null);
      await supa.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
    } catch (err) {
      setAuthStatus({ tone: "error", message: err.message || "Unable to sign in with Google." });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAdminSignOut = async () => {
    if (!supabaseReady) return;
    try {
      setAuthBusy(true);
      setAuthStatus(null);
      if (onSignOut) await onSignOut();
      else await supa.auth.signOut();
    } catch (err) {
      setAuthStatus({ tone: "error", message: err.message || "Unable to sign out right now." });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleDropUpload = async (event) => {
    event.preventDefault();
    if (!supabaseReady) {
      setDropStatus({ tone: "error", message: "Add Supabase credentials to upload." });
      return;
    }
    if (!authorized) {
      setDropStatus({ tone: "error", message: "Sign in with the admin account to continue." });
      return;
    }
    if (!dropFile) {
      setDropStatus({ tone: "error", message: "Choose an image before uploading." });
      return;
    }

    try {
      setDropBusy(true);
      setDropStatus(null);
      const path = `drops/${Date.now()}-${dropFile.name}`;
      const { error: uploadError } = await supa.storage
        .from(SUPABASE_BUCKET)
        .upload(path, dropFile, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: pub } = supa.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
      const src = pub?.publicUrl;
      if (!src) throw new Error("Could not determine public URL for the uploaded file.");

      const tags = dropMeta.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const filename = dropMeta.filename || dropFile.name;

      const { data, error: insertError } = await supa
        .from("drops")
        .insert([
          {
            title: dropMeta.title,
            group: dropMeta.group,
            tags,
            src,
            filename,
            date: dropMeta.date,
            tiktokUrl: dropMeta.tiktokUrl,
          },
        ])
        .select();

      if (insertError) throw insertError;

      const created = Array.isArray(data) ? data[0] : null;
      if (created && onDropCreated) onDropCreated(created);

      setDropStatus({ tone: "success", message: "Gallery image uploaded." });
      setDropFile(null);
      setDropMeta((prev) => ({
        ...createInitialDropMeta(),
        tags: prev.tags,
        group: prev.group,
      }));
    } catch (err) {
      setDropStatus({ tone: "error", message: err.message || "Upload failed." });
    } finally {
      setDropBusy(false);
    }
  };

  const handleShopUpload = async (event) => {
    event.preventDefault();
    if (!supabaseReady) {
      setShopStatus({ tone: "error", message: "Add Supabase credentials to upload." });
      return;
    }
    if (!authorized) {
      setShopStatus({ tone: "error", message: "Sign in with the admin account to continue." });
      return;
    }
    if (!shopFile) {
      setShopStatus({ tone: "error", message: "Upload the digital asset or preview first." });
      return;
    }

    try {
      setShopBusy(true);
      setShopStatus(null);

      const path = `shop/${Date.now()}-${shopFile.name}`;
      const { error: uploadError } = await supa.storage
        .from(SUPABASE_BUCKET)
        .upload(path, shopFile, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: pub } = supa.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
      const downloadUrl = pub?.publicUrl;
      if (!downloadUrl) throw new Error("Could not determine public URL for the uploaded file.");

      const highlights = shopMeta.highlights
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean);
      const delivery = shopMeta.delivery;
      const ctaLabel = shopMeta.ctaLabel || (delivery === "download" ? "Download" : "View template");
      const externalUrl = delivery === "external" ? shopMeta.externalUrl : "";

      const payload = {
        name: shopMeta.name,
        blurb: shopMeta.blurb,
        description: shopMeta.blurb,
        price: shopMeta.price,
        download_url: downloadUrl,
        external_url: externalUrl || null,
        highlights,
        accent: shopMeta.accent,
        delivery,
        cta_label: ctaLabel,
        category: shopMeta.category,
      };

      const { data, error: insertError } = await supa
        .from("shop_items")
        .insert([payload])
        .select();

      const createdRow = Array.isArray(data) && data.length ? data[0] : null;

      const product = normalizeShopItem(
        createdRow || {
          id: `local-${Date.now()}`,
          ...payload,
          download_url: downloadUrl,
        }
      );

      if (onShopCreated && product) onShopCreated(product);

      setShopStatus({
        tone: insertError ? "warning" : "success",
        message: insertError
          ? `Uploaded file but storing metadata failed: ${insertError.message}`
          : "Shop item added.",
      });
      setShopFile(null);
      setShopMeta((prev) => ({
        ...createInitialShopMeta(),
        accent: prev.accent,
        delivery: prev.delivery,
        category: prev.category,
      }));
    } catch (err) {
      setShopStatus({ tone: "error", message: err.message || "Unable to add shop item." });
    } finally {
      setShopBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-neutral-900/95 p-6 text-white shadow-xl backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Close admin dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-2 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Admin workspace</p>
              <h2 className="text-2xl font-semibold">Manage drops & shop templates</h2>
            </div>
            {authorized ? (
              <button
                type="button"
                onClick={handleAdminSignOut}
                disabled={authBusy}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : null}
          </div>
          <p className="text-sm text-white/70">
            Upload new gallery drops or digital sticker templates for the in-app shop.
          </p>
        </div>

        {!supabaseReady ? (
          <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
            Add <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON</code> to enable admin tools.
          </div>
        ) : !hasAdminEmail ? (
          <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
            Set <code className="font-mono">VITE_ADMIN_EMAIL</code> (or VITE_ALLOWED_EMAIL) with the authorized admin account email.
          </div>
        ) : !authorized ? (
          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={handleAdminSignIn} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Admin login</h3>
                <p className="text-sm text-white/60">Sign in with the email/password you configured in Supabase.</p>
              </div>
              <label className="block text-sm font-medium text-white/80">
                Email
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={updateAuthField("email")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-white/80">
                Password
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={updateAuthField("password")}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={authBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {authBusy ? "Signing in…" : "Sign in"}
              </button>
              {authStatus && (
                <p
                  className={classNames(
                    "text-sm",
                    authStatus.tone === "error"
                      ? "text-rose-300"
                      : authStatus.tone === "warning"
                      ? "text-amber-300"
                      : "text-emerald-300"
                  )}
                >
                  {authStatus.message}
                </p>
              )}
            </form>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <h3 className="text-lg font-semibold text-white">Need Google sign in?</h3>
              <p className="text-sm text-white/60">
                If your admin uses Google auth, use the button below. Make sure the Google account matches the configured admin
                email.
              </p>
              <button
                type="button"
                onClick={handleAdminGoogle}
                disabled={authBusy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" /> Sign in with Google
              </button>
              {authStatus && (
                <p
                  className={classNames(
                    "text-sm",
                    authStatus.tone === "error"
                      ? "text-rose-300"
                      : authStatus.tone === "warning"
                      ? "text-amber-300"
                      : "text-emerald-300"
                  )}
                >
                  {authStatus.message}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "drops", label: "Gallery uploads" },
                { id: "shop", label: "Shop products" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTab(option.id)}
                  className={classNames(
                    "rounded-xl px-4 py-2 text-sm font-medium transition",
                    tab === option.id ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {tab === "drops" ? (
              <form onSubmit={handleDropUpload} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-white/80">
                    Title
                    <input
                      value={dropMeta.title}
                      onChange={(event) => setDropMeta({ ...dropMeta, title: event.target.value })}
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-white/80">
                    Release date
                    <input
                      value={dropMeta.date}
                      onChange={(event) => setDropMeta({ ...dropMeta, date: event.target.value })}
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-white/80">
                    Group
                    <select
                      value={dropMeta.group}
                      onChange={(event) => setDropMeta({ ...dropMeta, group: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    >
                      <option className="bg-black">SB19</option>
                      <option className="bg-black">BINI</option>
                      <option className="bg-black">PPop</option>
                      <option className="bg-black">Other</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-white/80">
                    Tags
                    <input
                      value={dropMeta.tags}
                      onChange={(event) => setDropMeta({ ...dropMeta, tags: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                      placeholder="Wallpaper,Portrait"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-white/80">
                  TikTok URL (optional)
                  <input
                    value={dropMeta.tiktokUrl}
                    onChange={(event) => setDropMeta({ ...dropMeta, tiktokUrl: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    placeholder="https://www.tiktok.com/..."
                  />
                </label>
                <label className="block text-sm font-medium text-white/80">
                  Override filename (optional)
                  <input
                    value={dropMeta.filename}
                    onChange={(event) => setDropMeta({ ...dropMeta, filename: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    placeholder="custom-name.png"
                  />
                </label>
                <label className="block text-sm font-medium text-white/80">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setDropFile(event.target.files?.[0] || null)}
                    className="mt-1 block w-full text-sm text-white/80"
                  />
                </label>
                <button
                  type="submit"
                  disabled={dropBusy || !dropMeta.title || !dropFile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" /> {dropBusy ? "Uploading…" : "Upload image"}
                </button>
                {dropStatus && (
                  <p
                    className={classNames(
                      "text-sm",
                      dropStatus.tone === "error"
                        ? "text-rose-300"
                        : dropStatus.tone === "warning"
                        ? "text-amber-300"
                        : "text-emerald-300"
                    )}
                  >
                    {dropStatus.message}
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={handleShopUpload} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-white/80">
                    Product name
                    <input
                      value={shopMeta.name}
                      onChange={(event) => setShopMeta({ ...shopMeta, name: event.target.value })}
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm font-medium text-white/80">
                    Price
                    <input
                      value={shopMeta.price}
                      onChange={(event) => setShopMeta({ ...shopMeta, price: event.target.value })}
                      placeholder="$5.00"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-white/80">
                  Short description
                  <textarea
                    value={shopMeta.blurb}
                    onChange={(event) => setShopMeta({ ...shopMeta, blurb: event.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-white/80">
                  Highlights (one per line)
                  <textarea
                    value={shopMeta.highlights}
                    onChange={(event) => setShopMeta({ ...shopMeta, highlights: event.target.value })}
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-white/80">
                    Accent gradient utility classes
                    <input
                      value={shopMeta.accent}
                      onChange={(event) => setShopMeta({ ...shopMeta, accent: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                      placeholder="from-fuchsia-500 via-pink-500 to-amber-400"
                    />
                  </label>
                  <label className="block text-sm font-medium text-white/80">
                    Category label
                    <input
                      value={shopMeta.category}
                      onChange={(event) => setShopMeta({ ...shopMeta, category: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                      placeholder="Stickers"
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block text-sm font-medium text-white/80">
                    CTA label (optional)
                    <input
                      value={shopMeta.ctaLabel}
                      onChange={(event) => setShopMeta({ ...shopMeta, ctaLabel: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                      placeholder="Download"
                    />
                  </label>
                  <label className="block text-sm font-medium text-white/80">
                    Delivery method
                    <select
                      value={shopMeta.delivery}
                      onChange={(event) => setShopMeta({ ...shopMeta, delivery: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                    >
                      <option value="download" className="bg-black">
                        Direct download (uses uploaded file)
                      </option>
                      <option value="external" className="bg-black">
                        External checkout link
                      </option>
                    </select>
                  </label>
                </div>
                {shopMeta.delivery === "external" && (
                  <label className="block text-sm font-medium text-white/80">
                    External checkout URL
                    <input
                      value={shopMeta.externalUrl}
                      onChange={(event) => setShopMeta({ ...shopMeta, externalUrl: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                      placeholder="https://yourstore.com/product"
                    />
                  </label>
                )}
                <label className="block text-sm font-medium text-white/80">
                  Upload template file or preview
                  <input
                    type="file"
                    onChange={(event) => setShopFile(event.target.files?.[0] || null)}
                    className="mt-1 block w-full text-sm text-white/80"
                  />
                </label>
                <button
                  type="submit"
                  disabled={shopBusy || !shopMeta.name || !shopFile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" /> {shopBusy ? "Uploading…" : "Add to shop"}
                </button>
                {shopStatus && (
                  <p
                    className={classNames(
                      "text-sm",
                      shopStatus.tone === "error"
                        ? "text-rose-300"
                        : shopStatus.tone === "warning"
                        ? "text-amber-300"
                        : "text-emerald-300"
                    )}
                  >
                    {shopStatus.message}
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   App
------------------------------------------------------- */
export default function App() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [remoteDrops, setRemoteDrops] = useState([]);
  const [view, setView] = useState("home");
  const [session, setSession] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [shopItems, setShopItems] = useState(SHOP_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!supa) return;
    let alive = true;
    supa.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data?.session ?? null);
    });
    const { data: listener } = supa.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });
    return () => {
      alive = false;
      listener.subscription?.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (!supa) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supa
        .from("shop_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (!cancelled && !error && Array.isArray(data)) {
        const mapped = data.map(normalizeShopItem).filter(Boolean);
        if (mapped.length) setShopItems(mapped);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDropCreated = useCallback((rec) => {
    setRemoteDrops((prev) => (prev && prev.length ? [rec, ...prev] : [rec]));
  }, []);

  const handleShopCreated = useCallback((item) => {
    setShopItems((prev) => {
      const next = prev ? [...prev] : [];
      const existingIndex = next.findIndex((entry) => entry.id === item.id);
      if (existingIndex >= 0) next.splice(existingIndex, 1);
      next.unshift(item);
      return next;
    });
  }, []);

  const handleAddToCart = useCallback((product) => {
    if (!product) return;
    setCart((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const index = next.findIndex((entry) => entry.product?.id === product.id);
      if (index >= 0) {
        const existing = next[index];
        next[index] = { ...existing, quantity: (existing.quantity || 0) + 1 };
      } else {
        next.push({ product, quantity: 1 });
      }
      return next;
    });
    setCheckoutOpen(true);
  }, []);

  const handleUpdateCartQuantity = useCallback((id, quantity) => {
    setCart((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((entry) =>
        entry.product?.id === id ? { ...entry, quantity: Math.max(1, quantity || 1) } : entry
      );
    });
  }, []);

  const handleRemoveCartItem = useCallback((id) => {
    setCart((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.filter((entry) => entry.product?.id !== id);
    });
  }, []);

  const handleCheckoutComplete = useCallback(() => {
    setCart([]);
  }, []);

  const signOutUser = async () => {
    if (!supa) throw new Error("Authentication is disabled. Add Supabase credentials first.");
    const { error } = await supa.auth.signOut();
    if (error) throw error;
    setAccountOpen(false);
  };

  const handleHeaderSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      alert(err.message || "Unable to sign out right now.");
    }
  };

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
    if (sort === "new") list.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [remoteDrops, query, group, sort]);

  useEffect(() => {
    if (view !== "home") {
      setOpen(false);
      setCurrent(null);
    }
    if (view !== "shop") {
      setCheckoutOpen(false);
    }
  }, [view]);

  const goHome = () => setView("home");
  const goShop = () => setView("shop");
  const cartCount = useMemo(
    () => (Array.isArray(cart) ? cart.reduce((sum, entry) => sum + (entry.quantity || 0), 0) : 0),
    [cart]
  );

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
        onOpenAccount={() => setAccountOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onSignOut={handleHeaderSignOut}
        activeView={view}
        user={user}
        isAdmin={isAdmin}
      />

      <AuthModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        user={user}
        onSignOut={signOutUser}
      />

      <AdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        user={user}
        onSignOut={signOutUser}
        onDropCreated={handleDropCreated}
        onShopCreated={handleShopCreated}
      />

      <CheckoutModal
        open={checkoutOpen}
        cart={cart}
        onClose={() => setCheckoutOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckoutComplete={handleCheckoutComplete}
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
        </>
      ) : (
        <>
          <ShopPage
            onBackToHome={goHome}
            products={shopItems}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setCheckoutOpen(true)}
            cartCount={cartCount}
          />
          <Footer />
        </>
      )}
    </main>
  );
}
