"use client";

import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { moderationService } from "../services/moderation.service";
import type { ReportReason, ReportTargetType } from "../types/moderation.types";

/** Hook d'envoi d'un signalement vers le service de modération. */
export function useReport() {
  const { user } = useAuth();
  const submitReport = async (input: {
    targetType: ReportTargetType;
    targetId: string;
    targetLabel: string;
    reason: ReportReason;
    details: string;
  }): Promise<boolean> => {
    if (!user) {
      toast.error("Connectez-vous pour signaler.");
      return false;
    }
    try {
      await moderationService.createReport({ reporterId: user.id, ...input });
      toast.success("Signalement transmis à la modération.");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de signalement.");
      return false;
    }
  };
  return { submitReport };
}
