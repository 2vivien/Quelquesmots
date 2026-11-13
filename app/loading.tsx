/** Squelette de chargement fluide entre routes. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[720px] space-y-6 py-4 animate-pulse">
      <div className="h-11 w-full rounded-full bg-pilule" />
      <div className="h-32 w-full rounded-[16px] bg-pilule" />
      <div className="h-32 w-full rounded-[16px] bg-pilule" />
    </div>
  );
}
