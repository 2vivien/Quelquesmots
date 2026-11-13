import { ThemesDirectoryView, themesService } from "@/features/themes";

/** Page de répertoire de tous les thèmes (écran 4). */
export default async function ThemesPage() {
  const themes = await themesService.listActive();

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-3xl text-encre sm:text-4xl">Tous les thèmes</h1>
        <p className="text-[15px] text-muted">
          Explorez les thématiques qui animent notre communauté.
        </p>
      </header>
      <ThemesDirectoryView initialThemes={themes} />
    </div>
  );
}
