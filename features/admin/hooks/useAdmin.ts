"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { moderationService } from "@/features/moderation";
import { adminService } from "../services/admin.service";
import type { SiteSettings } from "../types/admin.types";

/**
 * Hook d'administration regroupant signalements, audit et paramètres du site.
 * @returns Données et mutations administrateur.
 */
export function useAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const reports = useQuery({ queryKey: ["admin", "reports"], queryFn: () => moderationService.listReports() });
  const audit = useQuery({ queryKey: ["admin", "audit"], queryFn: () => adminService.listAudit() });
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: () => adminService.getSettings() });

  const moderate = useMutation({
    mutationFn: (input: { reportId: string; targetId: string; targetLabel: string; action: "HIDE" | "RESTORE" | "DISMISS" }) =>
      adminService.moderateTarget({
        actorUsername: user?.username ?? "admin",
        ...input,
        reason: input.action === "HIDE" ? "Masqué par la modération" : "Traité",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Décision enregistrée dans l'audit.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Impossible d'appliquer la décision.");
    },
  });

  const saveSettings = useMutation({
    mutationFn: (next: SiteSettings) => adminService.updateSettings(next),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Paramètres enregistrés.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer les paramètres.");
    },
  });

  return {
    reports: reports.data ?? [],
    audit: audit.data ?? [],
    settings: settings.data,
    moderate,
    saveSettings,
  };
}
