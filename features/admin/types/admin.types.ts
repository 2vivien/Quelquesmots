/** Entrée du journal d'audit administratif. */
export interface AuditEntry {
  id: string;
  actorUsername: string;
  action: string;
  targetLabel: string;
  reason: string;
  createdAt: string;
}

/** Paramètres globaux configurables de la plateforme. */
export interface SiteSettings {
  maxChars: number;
  minChars: number;
  maxTags: number;
  dailyPublishLimit: number;
}

/** Contrat du service d'administration. */
export interface AdminService {
  listAudit(): Promise<AuditEntry[]>;
  getSettings(): Promise<SiteSettings>;
  updateSettings(next: SiteSettings): Promise<SiteSettings>;
  moderateTarget(input: {
    actorUsername: string;
    reportId: string;
    targetId: string;
    targetLabel: string;
    action: "HIDE" | "RESTORE" | "DISMISS";
    reason: string;
  }): Promise<void>;
}
