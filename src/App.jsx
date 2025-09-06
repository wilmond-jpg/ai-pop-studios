import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Download,
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  ArrowUpRight,
  Phone,
  LogIn,
  LogOut,
  Upload,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// ---- Config ----
const LOGO_SRC_FALLBACK = "AI Pop Studios logo.png"; // local preview fallback
const LOGO_SRC = import.meta.env.VITE_LOGO_SRC || LOGO_SRC_FALLBACK;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || "";
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "drops-public";
const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL || "";

const supa = SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

const GROUPS = ["All", "SB19", "BINI", "PPop", "Other"];
const TAGS = [
  "Ken","Stell","Pablo","Josh","Justin",
  "Aiah","Maloi","Jhoanna","Gwen","Sheena","Mikha","Stacey",
  "Ghibli","Anime","Watercolor","Chibi","Sticker","Keychain","Wallpaper","Portrait",
];

function classNames(...s) { return s.filter(Boolean).join(" "); }

function useQueryParam(key) {
  const [value, setValue] = useState(() => new URLSearchParams(window.location.search).get(key) || "");
  useEffect(() => {
    const onChange = () => setValue(new URLSearchParams(window.location.search).get(key) || "");
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, [key]);
  return value;
}

// --- Helper to force file download ---
async function forceDownload(url, filename = "download") {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    alert(`Download failed: ${err.message}`);
  }
}

function Header() {
  const [logoOk, setLogoOk] = useState(true);
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoOk ? (
            <img src={LOGO_SRC} alt="AI Pop Studios Logo" className="h-12 w-auto" onError={() => setLogoOk(false)} />
          ) : (
            <div className="h-10 px-3 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-pink-400 to-cyan-400 flex items-center text-black font-semibold">
              AI Pop Studios
            </div>
          )}
          <div>
            <h1 className="text-white font-semibold leading-tight">AI Pop Studios Download Hub</h1>
            <p className="text-xs text-white/70 -mt-0.5">AI-generated P-Pop wallpapers, stickers, and more</p>
          </div>
        </div>
        <a href="https://www.tiktok.com/@aipopstudios" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white">
          Visit TikTok <ArrowUpRight className="h-4 w-4" />
        </a>
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
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">Download the AI Pop Studios wallpapers from my TikTok drops</h2>
        <p className="mt-2 text-white/80 max-w-2xl">For Atin & Blooms 💖 Tap an artwork to open, long-press to save to Photos, or use the Download button below each image.</p>
      </div>
    </section>
  );
}

function Filters({ query, setQuery, group, setGroup, activeTags, setActiveTags, sort, setSort }) {
  const toggleTag = (t) => setActiveTags((curr) => (curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]));
  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="grid md:grid-cols-4 gap-3">
        <div className="md:col-span-2 flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
          <Search className="h-4 w-4 text-white/70" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search: Ken, Pablo, Anime, Ghibli…" className="bg-transparent outline-none w-full text-white placeholder:text-white/50" />
        </div>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white">
          {GROUPS.map((g) => (
            <option className="bg-black" key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2 text-white">
          <option className="bg-black" value="new">Newest first</option>
          <option className="bg-black" value="az">A → Z</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TAGS.map((t) => (
          <button key={t} onClick={() => toggleTag(t)} className={classNames("text-xs px-3 py-1.5 rounded-full border", activeTags.includes(t) ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}>{t}</button>
        ))}
      </div>
    </div>
  );
}

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
        {items.map((item) => (
          <article key={item.id} className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <button onClick={() => onOpen(item)} className="block w-full aspect-[9/16] bg-black">
              <img src={item.src} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:opacity-90 transition" />
            </button>
            <div className="p-3 text-white">
              <h3 className="text-sm font-semibold line-clamp-2">{item.title}</h3>
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => forceDownload(item.src, item.filename || `${item.title}.jpg`)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                {item.tiktokUrl && (
                  <a href={item.tiktokUrl} target="_blank" rel="noreferrer" className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1">
                    TikTok <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Modal({ open, onClose, item }) {
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (!open) return; const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => { if (open && closeBtnRef.current) closeBtnRef.current.focus(); }, [open]);
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative max-w-[92vw] w-[720px] rounded-3xl overflow-hidden border border-white/10 bg-neutral-900">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gradient-to-b from-black/70 to-black/20 sticky top-0 z-10">
            <button ref={closeBtnRef} onClick={onClose} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-medium">← Back to gallery</button>
            <button onClick={onClose} aria-label="Close" className="px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20">✕</button>
          </div>
          <div className="aspect-[9/16] bg-black">
            <img src={item.src} alt={item.title} className="w-full h-full object-contain" />
          </div>
          <div className="px-4 py-3 border-t border-white/10 bg-black/30 sticky bottom-0 z-10 flex flex-wrap gap-2 items-center justify-between">
            <div className="text-white/80 text-sm font-medium line-clamp-1 pr-2">{item.title}</div>
            <div className="flex gap-2">
              <button
                onClick={() => forceDownload(item.src, item.filename || `${item.title}.jpg`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black"
              >
                <Download className="h-4 w-4" /> Download
              </button>
              {item.tiktokUrl && (
                <a href={item.tiktokUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20">Open TikTok <ArrowUpRight className="h-4 w-4" /></a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 mt-6">
      <div className="max-w-6xl mx-auto px-4 text-white/70 text-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} AI Pop Studios — AI-generated fan art hub for SB19, BINI & P-pop.</p>
          <p>Art is AI-generated. Personal use only. Not affiliated with SB19 or BINI.</p>
        </div>
      </div>
    </footer>
  );
}

// ... rest of the AdminPanel + App component remain unchanged
// (no need to touch them for downloads)
