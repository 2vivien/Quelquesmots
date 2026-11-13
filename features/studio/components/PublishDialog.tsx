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
      <div className="w-full max-w-md space-y-4 rounded-[16px] border border-bord bg-carte p-6">
        <h2 className="font-serif text-2xl text-encre">Publier ce texte ?</h2>
        <p className="text-sm leading-relaxed text-muted">
          « {title.trim() || "Sans titre"} » recevra une adresse stable et sera visible selon votre choix de confidentialité.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="min-h-[40px] rounded-full border border-bord px-4 text-sm text-encre hover:bg-pilule">
            Annuler
          </button>
          <button type="button" disabled={publishing} onClick={onConfirm} className="min-h-[40px] rounded-full bg-encre-fort px-5 text-sm font-medium text-ivoire disabled:opacity-60">
            {publishing ? "Publication…" : "Confirmer la publication"}
          </button>
        </div>
      </div>
    </div>
  );
}
