import { AuthorsDirectoryView, authorsService } from "@/features/authors";

/** Annuaire des auteurs (écran 7). */
export default async function AuthorsPage() {
  const authors = await authorsService.listDirectory();

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-3xl text-encre sm:text-4xl">Nos auteurs</h1>
        <p className="text-[15px] text-muted">Découvrez les plumes qui écrivent ici.</p>
      </header>
      <AuthorsDirectoryView initialAuthors={authors} />
    </div>
  );
}
