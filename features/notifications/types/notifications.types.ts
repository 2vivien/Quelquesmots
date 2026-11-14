/** Catégorie d'une notification. */
export type NotificationKind = "LIKE" | "COMMENT" | "REPLY" | "SHARE" | "MENTION" | "MODERATION";

/** Onglet de filtrage de l'écran Notifications. */
export type NotificationTab = "all" | "posts" | "mentions" | "interactions";

/** Élément de notification regroupé sur 1 heure. */
export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationKind;
  actorUsername: string;
  actorAvatarUrl: string;
  postId: string;
  postTitle: string;
  read: boolean;
  createdAt: string;
}

/** Contrat du service de notifications. */
export interface NotificationsService {
  list(userId: string): Promise<NotificationItem[]>;
  markRead(ids: string[]): Promise<void>;
}
