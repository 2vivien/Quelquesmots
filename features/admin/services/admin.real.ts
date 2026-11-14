import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { AdminService, AuditEntry, SiteSettings } from "../types/admin.types";

/** Implémentation réelle du service d'administration via API. */
export const adminReal: AdminService = {
  async listAudit(): Promise<AuditEntry[]> {
    const res = await fetch(apiUrl("/api/admin/audit"));
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de charger le journal d'audit."));
    const data = (await res.json()) as { entries: AuditEntry[] };
    return data.entries;
  },
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch(apiUrl("/api/admin/settings"));
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Paramètres indisponibles."));
    return (await res.json()) as SiteSettings;
  },
  async updateSettings(next: SiteSettings): Promise<SiteSettings> {
    const res = await fetch(apiUrl("/api/admin/settings"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible d'enregistrer les paramètres."));
    return (await res.json()) as SiteSettings;
  },
  async moderateTarget(input): Promise<void> {
    const res = await fetch(apiUrl("/api/admin/moderate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible d'appliquer la décision."));
  },
};
