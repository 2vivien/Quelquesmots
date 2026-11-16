/**
 * Clés de cache TanStack Query des notifications.
 * La cloche et la page partagent le même préfixe mais des queries distinctes :
 * la cloche ne télécharge jamais la liste complète.
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  unreadCount: (userId: string) => ["notifications", "unread-count", userId] as const,
  list: (userId: string) => ["notifications", "list", userId] as const,
};
