import { apiUrl } from "@/lib/env";
import type { ModerationService, ReportItem } from "../types/moderation.types";

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
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { report: ReportItem };
    return data.report;
  },
  async setReportStatus(id, status): Promise<void> {
    await fetch(apiUrl(`/api/admin/reports/${encodeURIComponent(id)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },
};
