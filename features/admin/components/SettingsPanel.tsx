"use client";

import { useState } from "react";
import type { SiteSettings } from "../types/admin.types";

interface SettingsPanelProps {
  initial: SiteSettings;
  onSave: (next: SiteSettings) => void;
}

/**
 * Formulaire des seuils éditoriaux globaux dans l'administration.
 * @param props Valeurs actuelles et callback de mise à jour.
 */
export function SettingsPanel({ initial, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState(initial);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-4 rounded-[16px] border border-bord bg-carte p-6"
    >
      <h2 className="font-serif text-2xl text-encre">Paramètres éditoriaux</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-encre"><span>Caractères max</span><input type="number" value={form.maxChars} onChange={(e) => setForm({ ...form, maxChars: Number(e.target.value) })} className="w-full rounded-[12px] border border-bord bg-pilule px-3 py-2 text-sm" /></label>
        <label className="space-y-1 text-sm text-encre"><span>Tags max par texte</span><input type="number" value={form.maxTags} onChange={(e) => setForm({ ...form, maxTags: Number(e.target.value) })} className="w-full rounded-[12px] border border-bord bg-pilule px-3 py-2 text-sm" /></label>
      </div>
      <button type="submit" className="min-h-[40px] rounded-full bg-encre-fort px-5 text-sm text-ivoire">Enregistrer</button>
    </form>
  );
}
