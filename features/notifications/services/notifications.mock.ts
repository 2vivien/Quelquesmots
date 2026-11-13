import type { NotificationItem, NotificationsService } from "../types/notifications.types";

const ago = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const runtimeNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    userId: "user-emma",
    type: "LIKE",
    actorUsername: "plume.libre",
    actorAvatarUrl: "/images/editorial/avatar-plume.jpg",
    postTitle: "Les rues où l'on se croise.",
    postSlug: "les-rues-ou-l-on-se-croise",
    read: false,
    createdAt: ago(2),
  },
  {
    id: "notif-2",
    userId: "user-emma",
    type: "COMMENT",
    actorUsername: "une.plume",
    actorAvatarUrl: "/images/editorial/avatar-une.jpg",
    postTitle: "Les rues où l'on se croise.",
    postSlug: "les-rues-ou-l-on-se-croise",
    read: false,
    createdAt: ago(12),
  },
  {
    id: "notif-3",
    userId: "user-emma",
    type: "SHARE",
    actorUsername: "lise.mots",
    actorAvatarUrl: "/images/editorial/avatar-emma.jpg",
    postTitle: "Les rues où l'on se croise.",
    postSlug: "les-rues-ou-l-on-se-croise",
    read: true,
    createdAt: ago(60),
  },
];

/** Implémentation mock du service de notifications. */
export const notificationsMock: NotificationsService = {
  async list(userId: string): Promise<NotificationItem[]> {
    return runtimeNotifications.filter((n) => n.userId === userId);
  },
  async markRead(ids: string[]): Promise<void> {
    const target = new Set(ids);
    for (let i = 0; i < runtimeNotifications.length; i++) {
      const item = runtimeNotifications[i];
      if (item && target.has(item.id)) {
        runtimeNotifications[i] = { ...item, read: true };
      }
    }
  },
};
