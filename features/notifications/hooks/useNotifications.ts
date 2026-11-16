"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { notificationKeys } from "../keys";
import { notificationsService } from "../services/notifications.service";
import type { NotificationItem } from "../types/notifications.types";

/**
 * Liste des notifications de la page dédiée : polling 10 s tant que la page est montée.
 * `markRead` met à jour immédiatement les deux caches puis les invalide sans toucher
 * aux autres queries de l'application.
 */
export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "guest";
  const listKey = notificationKeys.list(userId);
  const countKey = notificationKeys.unreadCount(userId);

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => (user ? notificationsService.list(user.id) : Promise.resolve([])),
    enabled: Boolean(user),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const markRead = useMutation({
    mutationFn: (ids: string[]) => notificationsService.markRead(ids),
    onMutate: async (ids) => {
      await Promise.all([qc.cancelQueries({ queryKey: listKey }), qc.cancelQueries({ queryKey: countKey })]);
      const previousList = qc.getQueryData<NotificationItem[]>(listKey);
      const previousCount = qc.getQueryData<number>(countKey);
      qc.setQueryData<NotificationItem[]>(listKey, (old) =>
        old?.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)),
      );
      const newlyRead = previousList?.filter((item) => ids.includes(item.id) && !item.read).length ?? 0;
      if (previousCount !== undefined && newlyRead > 0) {
        qc.setQueryData<number>(countKey, Math.max(0, previousCount - newlyRead));
      }
      return { previousList, previousCount };
    },
    onError: (_error, _ids, context) => {
      if (context?.previousList) qc.setQueryData(listKey, context.previousList);
      if (context?.previousCount !== undefined) qc.setQueryData(countKey, context.previousCount);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: listKey });
      void qc.invalidateQueries({ queryKey: countKey });
    },
  });

  const items = query.data ?? [];
  const unreadCount = items.filter((n) => !n.read).length;
  return { items, unreadCount, isLoading: query.isLoading, markRead };
}
