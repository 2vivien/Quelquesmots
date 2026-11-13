"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { notificationsService } from "../services/notifications.service";

/**
 * Hook de lecture et marquage comme lu des notifications.
 * @returns Notifications, compteur non lu et mutation `markRead`.
 */
export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", user?.id ?? "guest"],
    queryFn: () => (user ? notificationsService.list(user.id) : Promise.resolve([])),
  });

  const markRead = useMutation({
    mutationFn: (ids: string[]) => notificationsService.markRead(ids),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = query.data ?? [];
  const unreadCount = items.filter((n) => !n.read).length;
  return { items, unreadCount, isLoading: query.isLoading, markRead };
}
