"use client";

import Link from "next/link";
import { AuditPanel, ReportTable, SettingsPanel, useAdmin } from "@/features/admin";
import { useAuth } from "@/features/auth";

/** Panneau de modération et d'administration réservé aux rôles autorisés. */
export default function AdminPage() {
  const { user } = useAuth();
  const { reports, audit, settings, moderate, saveSettings } = useAdmin();

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <h1 className="font-serif text-3xl text-encre">Accès réservé</h1>
        <Link href="/" className="inline-flex min-h-[44px] items-center rounded-full bg-encre-fort px-6 text-sm text-ivoire">
          Retour au mur
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[880px] space-y-8">
      <h1 className="font-serif text-3xl text-encre">Modération &amp; Administration</h1>
      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-encre">Signalements</h2>
        <ReportTable reports={reports} onAction={(input) => moderate.mutate(input)} />
      </section>
      {settings ? <SettingsPanel initial={settings} onSave={(next) => saveSettings.mutate(next)} /> : null}
      <AuditPanel entries={audit} />
    </div>
  );
}
