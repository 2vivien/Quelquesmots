"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Fenêtre de confirmation brutaliste réutilisable (déconnexion, suppression de compte, suppression de texte).
 * Fermeture par Échap ou clic sur le fond. Issue positive = bouton à droite.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Annuler",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" aria-label="Fermer" onClick={onCancel} className="absolute inset-0 bg-encre/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-[20px] border-[1.5px] border-bord bg-carte p-6 shadow-[5px_5px_0_0_var(--color-encre)]">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fermer"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-pilule hover:text-encre"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <h2 className="font-display text-xl uppercase leading-tight tracking-tight text-encre">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2.5">
          <button type="button" onClick={onCancel} disabled={loading} className="btn-fantome !min-h-[40px] !px-4 !text-sm disabled:opacity-60">
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={destructive ? "btn-noir !min-h-[40px] !px-4 !text-sm disabled:opacity-60" : "btn-jaune !min-h-[40px] !px-4 !text-sm disabled:opacity-60"}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
