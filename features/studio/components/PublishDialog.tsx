"use client";

interface PublishDialogProps {
  open: boolean;
  title: string;
  publishing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Fenêtre de confirmation avant publication définitive d'un texte.
 * @param props État d'ouverture, titre et actions de confirmation/annulation.
 */
export function PublishDialog({ open, title, publishing, onCancel, onConfirm }: PublishDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-encre/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md space-y-4 rounded-[20px] border-[1.5px] border-bord bg-carte p-6 shadow-[4px_4px_0_0_var(--color-encre)]">
        <h2 className="font-serif text-2xl text-encre">Publier ce texte ?</h2>
        <p className="text-sm leading-relaxed text-muted">
          « {title.trim() || "Sans titre"} » recevra une adresse stable et sera visible selon votre choix de confidentialité.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-fantome !min-h-[40px] !px-4 !text-sm">
            Annuler
          </button>
          <button type="button" disabled={publishing} onClick={onConfirm} className="btn-noir !min-h-[40px] !px-5 !text-sm disabled:opacity-60">
            {publishing ? "Publication…" : "Confirmer la publication"}
          </button>
        </div>
      </div>
    </div>
  );
}
