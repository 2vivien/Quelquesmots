import { apiUrl } from "@/lib/env";
import type { AdminService, AuditEntry, SiteSettings } from "../types/admin.types";

/** Implémentation réelle du service d'administration via API. */
export const adminReal: AdminService = {
  async listAudit(): Promise<AuditEntry[]> {
    const res = await fetch(apiUrl("/api/admin/audit"));
    if (!res.ok) return [];
    const data = (await res.json()) as { entries: AuditEntry[] };
    return data.entries;
  },
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch(apiUrl("/api/admin/settings"));
    return (await res.json()) as SiteSettings;
  },
  async updateSettings(next: SiteSettings): Promise<SiteSettings> {
    const res = await fetch(apiUrl("/api/admin/settings"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    return (await res.json()) as SiteSettings;
  },
  async moderateTarget(input): Promise<void> {
    await fetch(apiUrl("/api/admin/moderate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },
};
