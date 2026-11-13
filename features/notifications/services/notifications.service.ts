import { env } from "@/lib/env";
import type { NotificationsService } from "../types/notifications.types";
import { notificationsMock } from "./notifications.mock";
import { notificationsReal } from "./notifications.real";

/** Sélectionne le service notifications selon `NEXT_PUBLIC_USE_MOCK`. */
export const notificationsService: NotificationsService = env.USE_MOCK
  ? notificationsMock
  : notificationsReal;
