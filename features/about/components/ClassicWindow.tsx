/** Fenêtre style Mac classique (1984), title bar + track three « feux ». */
export function ClassicWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[10px] border-[3px] border-encre bg-[#FBF7EB] shadow-[4px_4px_0_0_#1F1B12]">
      <div className="flex items-center gap-2 border-b-[2px] border-encre bg-[#D8D2C0] px-3 py-1.5">
        <span aria-hidden="true" className="h-3 w-3 rounded-full border border-encre bg-[#F5B921]" />
        <span aria-hidden="true" className="h-3 w-3 rounded-full border border-encre bg-[#FFB4CF]" />
        <span aria-hidden="true" className="h-3 w-3 rounded-full border border-encre bg-[#CFFB7F]" />
        <span className="ml-3 font-display text-[10px] uppercase tracking-[0.2em] text-encre">{title}</span>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}
