/** Catégorie d'une notification. */
export type NotificationKind =
  | "LIKE"
  | "COMMENT"
  | "REPLY"
  | "SHARE"
  | "MENTION"
  | "MODERATION"
  | "COMMENT_LIKE"
  | "FOLLOW";

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
  commentId: string | null;
  postTitle: string;
  read: boolean;
  createdAt: string;
}

/** Contrat du service de notifications. */
export interface NotificationsService {
  list(userId: string): Promise<NotificationItem[]>;
  unreadCount(): Promise<number>;
  markRead(ids: string[]): Promise<void>;
}
