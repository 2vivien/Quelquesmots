import type { AdminService } from "../types/admin.types";
import { adminReal } from "./admin.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const adminService: AdminService = adminReal;
