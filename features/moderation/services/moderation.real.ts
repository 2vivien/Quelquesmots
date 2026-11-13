import { apiUrl } from "@/lib/env";
import type { ModerationService, ReportItem } from "../types/moderation.types";

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string } };
    return data?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** Implémentation réelle du service de modération via API. */
export const moderationReal: ModerationService = {
  async listReports(): Promise<ReportItem[]> {
    const res = await fetch(apiUrl("/api/admin/reports"));
    if (!res.ok) return [];
    const data = (await res.json()) as { reports: ReportItem[] };
    return data.reports;
  },
  async createReport(input): Promise<ReportItem> {
    const res = await fetch(apiUrl("/api/reports"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: input.targetType,
        targetId: input.targetId,
        targetLabel: input.targetLabel,
        reason: input.reason,
        details: input.details,
      }),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, "Impossible d'envoyer le signalement."));
    }
    const data = (await res.json()) as { report: ReportItem };
    return data.report;
  },
  async setReportStatus(id, status): Promise<void> {
    const res = await fetch(apiUrl(`/api/admin/reports/${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, "Impossible de traiter le signalement."));
    }
  },
};
