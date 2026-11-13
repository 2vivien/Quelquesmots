/** Type de cible d'un signalement. */
export type ReportTargetType = "POST" | "COMMENT" | "USER";

/** Motif de signalement disponible. */
export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE"
  | "DANGER"
  | "OTHER";

/** Signalement enregistré en file de modération. */
export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  details: string;
  priority: number;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: string;
}

/** Contrat du service de modération utilisateur. */
export interface ModerationService {
  listReports(): Promise<ReportItem[]>;
  createReport(input: {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    targetLabel: string;
    reason: ReportReason;
    details: string;
  }): Promise<ReportItem>;
  setReportStatus(id: string, status: "RESOLVED" | "DISMISSED"): Promise<void>;
}
