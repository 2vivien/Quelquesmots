interface AboutHeroProps {
  pills: ReadonlyArray<{ label: string; bg: string }>;
}

/** Bandeau crème pointillée, wordmark affiché, slogan d'introduction, pastilles de valeurs. */
export function AboutHero({ pills }: AboutHeroProps) {
  return (
    <section className="relative border-[3px] border-encre bg-[#F5EDDC] bg-[radial-gradient(#C8B88F_0.9px,transparent_0.9px)] bg-[size:18px_18px] px-5 py-12 text-center sm:py-16">
      <div className="mx-auto -mb-2 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-encre bg-[#F5B921]">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-encre" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </div>
      <h1 className="mt-4 max-w-[320px] font-display text-[48px] leading-[0.9] tracking-[-0.04em] sm:max-w-none sm:text-[110px] sm:tracking-tighter md:text-[140px]">
        QUELQUES<br />MOTS
      </h1>
      <p className="mt-4 font-serif text-base italic text-encre/85 sm:text-lg">Un mur de mots ouvert, sans bruit.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
        {pills.map((t) => (
          <span key={t.label} style={{ background: t.bg }} className="inline-flex min-h-[32px] items-center rounded-full border-[2px] border-encre px-3 text-[10px] font-black uppercase tracking-[0.18em] text-encre shadow-[2px_2px_0_0_#1F1B12]">
            {t.label}
          </span>
        ))}
      </div>
    </section>
  );
}
