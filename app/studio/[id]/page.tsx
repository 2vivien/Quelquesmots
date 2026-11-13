import { StudioLoader } from "@/features/studio";

interface StudioEditPageProps {
  params: Promise<{ id: string }>;
}

/** Page du Studio d'écriture pour reprendre un brouillon existant. */
export default async function StudioEditPage({ params }: StudioEditPageProps) {
  const { id } = await params;
  return <StudioLoader draftId={id} />;
}
