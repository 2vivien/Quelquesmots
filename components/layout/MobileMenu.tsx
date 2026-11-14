"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { MobileMenuDrawer } from "./MobileMenuDrawer";

/** Menu hamburger mobile avec tiroir accessible. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open} className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-bord bg-carte text-encre shadow-[2px_2px_0_0_var(--color-encre)] transition-colors hover:bg-pilule">
        <Menu size={20} strokeWidth={2} aria-hidden="true" />
      </button>
      {open ? createPortal(<MobileMenuDrawer onClose={close} />, document.body) : null}
    </div>
  );
}
