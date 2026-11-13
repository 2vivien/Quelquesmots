import { apiUrl } from "@/lib/env";
import type { NotificationItem, NotificationsService } from "../types/notifications.types";

/** Implémentation réelle du service de notifications via API. */
export const notificationsReal: NotificationsService = {
  async list(): Promise<NotificationItem[]> {
    const res = await fetch(apiUrl("/api/notifications"));
    if (!res.ok) return [];
    const data = (await res.json()) as { items: NotificationItem[] };
    return data.items;
  },
  async markRead(ids: string[]): Promise<void> {
    await fetch(apiUrl("/api/notifications/read"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  },
};
