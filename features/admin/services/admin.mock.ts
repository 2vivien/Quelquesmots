import { moderationService } from "@/features/moderation";
import { postsService } from "@/features/posts";
import type { AdminService, AuditEntry, SiteSettings } from "../types/admin.types";

const runtimeAudit: AuditEntry[] = [];
let runtimeSettings: SiteSettings = {
  maxChars: 1500,
  minChars: 20,
  maxTags: 5,
  dailyPublishLimit: 10,
};

/** Implémentation mock du service d'administration et d'audit. */
export const adminMock: AdminService = {
  async listAudit(): Promise<AuditEntry[]> {
    return [...runtimeAudit];
  },
  async getSettings(): Promise<SiteSettings> {
    return { ...runtimeSettings };
  },
  async updateSettings(next: SiteSettings): Promise<SiteSettings> {
    runtimeSettings = { ...next };
    return runtimeSettings;
  },
  async moderateTarget(input): Promise<void> {
    if (input.action === "HIDE") {
      await postsService.setModerationStatus(input.targetId, "HIDDEN", true);
      await moderationService.setReportStatus(input.reportId, "RESOLVED");
    } else if (input.action === "RESTORE") {
      await postsService.setModerationStatus(input.targetId, "PUBLISHED", false);
      await moderationService.setReportStatus(input.reportId, "RESOLVED");
    } else {
      await moderationService.setReportStatus(input.reportId, "DISMISSED");
    }
    runtimeAudit.unshift({
      id: `audit-${Date.now()}`,
      actorUsername: input.actorUsername,
      action: input.action,
      targetLabel: input.targetLabel,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    });
  },
};
