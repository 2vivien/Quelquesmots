import { SearchView } from "@/features/search";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

/** Page de recherche globale (écran 2). */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  return <SearchView initialQuery={q ?? ""} />;
}
