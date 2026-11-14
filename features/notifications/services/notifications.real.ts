import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { NotificationItem, NotificationsService } from "../types/notifications.types";

/** Implémentation réelle du service de notifications via API. */
export const notificationsReal: NotificationsService = {
  async list(): Promise<NotificationItem[]> {
    const res = await fetch(apiUrl("/api/notifications"));
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de charger les notifications."));
    const data = (await res.json()) as { items: NotificationItem[] };
    return data.items;
  },
  async markRead(ids: string[]): Promise<void> {
    const res = await fetch(apiUrl("/api/notifications/read"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de mettre à jour les notifications."));
  },
};
