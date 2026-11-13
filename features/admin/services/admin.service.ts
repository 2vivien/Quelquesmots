import { env } from "@/lib/env";
import type { AdminService } from "../types/admin.types";
import { adminMock } from "./admin.mock";
import { adminReal } from "./admin.real";

/** Sélectionne le service d'administration selon `NEXT_PUBLIC_USE_MOCK`. */
export const adminService: AdminService = env.USE_MOCK ? adminMock : adminReal;
