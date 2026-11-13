import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/ratelimit";
import type { ModerationService, ReportItem } from "../types/moderation.types";

const runtimeReports: ReportItem[] = [
  {
    id: "rep-1",
    reporterId: "user-une",
    targetType: "POST",
    targetId: "post-6",
    targetLabel: "Les rues où l'on se croise.",
    reason: "OTHER",
    details: "Vérification éditoriale demandée.",
    priority: 0,
    status: "OPEN",
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

/** Implémentation mock du service de signalement. */
export const moderationMock: ModerationService = {
  async listReports(): Promise<ReportItem[]> {
    return [...runtimeReports].sort((a, b) => b.priority - a.priority);
  },
  async createReport(input): Promise<ReportItem> {
    if (!checkRateLimit(`report:${input.reporterId}`, 20, 86_400_000)) {
      throw new AppError("RATE_LIMITED", "Limite quotidienne de signalements atteinte.");
    }
    const exists = runtimeReports.some(
      (r) =>
        r.reporterId === input.reporterId &&
        r.targetType === input.targetType &&
        r.targetId === input.targetId,
    );
    if (exists) {
      throw new AppError("VALIDATION", "Vous avez déjà signalé ce contenu.");
    }
    const created: ReportItem = {
      id: `rep-${Date.now()}`,
      ...input,
      priority: input.reason === "DANGER" ? 2 : 0,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    runtimeReports.unshift(created);
    return created;
  },
  async setReportStatus(id, status): Promise<void> {
    const idx = runtimeReports.findIndex((r) => r.id === id);
    if (idx >= 0 && runtimeReports[idx]) {
      runtimeReports[idx] = { ...runtimeReports[idx], status };
    }
  },
};
