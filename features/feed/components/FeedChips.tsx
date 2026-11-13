"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ThemeItem } from "@/features/themes";

/** Liste horizontale défilante des thèmes (un seul défilement, chevrons < >). */
export function FeedChips({ activeTheme, themes, onSelectTheme }: { activeTheme: string; themes: ThemeItem[]; onSelectTheme: (slug: string) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateChevrons = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateChevrons();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateChevrons, { passive: true });
    window.addEventListener("resize", updateChevrons);
    return () => {
      el.removeEventListener("scroll", updateChevrons);
      window.removeEventListener("resize", updateChevrons);
    };
  }, [themes.length]);

  const nudge = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => nudge(-1)} aria-label="Thèmes précédents" disabled={!canLeft} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bord bg-carte text-encre transition-colors hover:bg-pilule disabled:pointer-events-none disabled:opacity-30">
        <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <div ref={scrollerRef} className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto py-0.5" role="tablist" aria-label="Thèmes">
        <button type="button" role="tab" aria-selected={activeTheme === ""} onClick={() => onSelectTheme("")} className={activeTheme === "" ? "puce-active" : "puce"}>
          Tout
        </button>
        {themes.map((t) => (
          <button key={t.slug} type="button" role="tab" aria-selected={activeTheme === t.slug} onClick={() => onSelectTheme(t.slug)} className={activeTheme === t.slug ? "puce-active" : "puce"}>
            {t.name}
          </button>
        ))}
        <Link href="/themes" className="ml-1 whitespace-nowrap text-[13px] text-muted underline-offset-2 hover:text-encre hover:underline">
          Voir tout ({themes.length}) →
        </Link>
      </div>
      <button type="button" onClick={() => nudge(1)} aria-label="Thèmes suivants" disabled={!canRight} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bord bg-carte text-encre transition-colors hover:bg-pilule disabled:pointer-events-none disabled:opacity-30">
        <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
