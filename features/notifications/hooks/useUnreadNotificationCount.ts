"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { notificationKeys } from "../keys";
import { notificationsService } from "../services/notifications.service";

/**
 * Compteur non lu de la cloche : route COUNT dédiée, polling 15 s.
 * Les options sont propres aux notifications (QueryClient global inchangé).
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: notificationKeys.unreadCount(user?.id ?? "guest"),
    queryFn: () => notificationsService.unreadCount(),
    enabled: Boolean(user),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  return { unreadCount: query.data ?? 0, isLoading: query.isLoading };
}
