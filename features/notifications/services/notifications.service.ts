import type { NotificationsService } from "../types/notifications.types";
import { notificationsReal } from "./notifications.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const notificationsService: NotificationsService = notificationsReal;
