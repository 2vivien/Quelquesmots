interface AboutMastheadProps {
  pills: ReadonlyArray<{ label: string; bg: string }>;
}

/** Masthead façon affiche Susan Kare : fond crème cartographique + wordmark affiché. */
export function AboutMasthead({ pills }: AboutMastheadProps) {
  return (
    <section
      aria-label="Masthead"
      className="relative border-b-[3px] border-encre bg-[#EAE3D5] bg-[radial-gradient(#C8C0B0_1.1px,transparent_1.1px)] bg-[size:22px_22px] px-4 pb-12 pt-16 text-center sm:pb-20 sm:pt-24"
    >
      {/* Carte/carte graphique décorative en fond (cercles, grille) */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <g fill="none" stroke="#111" strokeWidth="1">
          <circle cx="240" cy="220" r="110" />
          <circle cx="240" cy="220" r="80" />
          <circle cx="240" cy="220" r="50" />
          <circle cx="240" cy="220" r="24" />
          <circle cx="1170" cy="650" r="150" />
          <circle cx="1170" cy="650" r="100" />
          <circle cx="1170" cy="650" r="60" />
          <path d="M0 140 L1440 70 M0 280 L1440 210 M0 430 L1440 340 M0 600 L1440 510 M0 780 L1440 690" />
          <path d="M320 0 L380 900 M520 0 L580 900 M720 0 L780 900 M920 0 L980 900 M1120 0 L1180 900" />
        </g>
      </svg>

      {/* Badge centré type « à propos » avec icon soleil */}
      <div className="relative mx-auto flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-encre bg-[#FDF9EE]">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-encre" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <path d="M12 2.5v4 M12 17.5v4 M2.5 12h4 M17.5 12h4 M5 5l2.8 2.8 M16.2 16.2 19 19 M5 19l2.8-2.8 M16.2 7.8 19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <p className="relative mt-4 font-display text-[13px] uppercase leading-none tracking-[0.42em] text-encre">À propos</p>
      {/* Wordmark */}
      <h1 className="relative mx-auto mt-5 max-w-[900px] px-2 font-display text-[68px] leading-[0.85] tracking-[-0.03em] text-encre sm:text-[100px] md:text-[132px]">
        QUELQUES<br />MOTS
      </h1>
      <p className="relative mt-5 font-serif text-lg italic text-encre/90">Un mur de mots ouvert, sans bruit.</p>
      {/* Pills */}
      <div className="relative mt-7 flex flex-wrap justify-center gap-2">
        {pills.map((t) => (
          <span key={t.label} style={{ background: t.bg }} className="inline-flex min-h-[34px] items-center rounded-full border-[2px] border-encre px-3.5 text-[11px] font-black uppercase tracking-[0.18em] text-encre shadow-[2px_2px_0_0_#1F1B12]">
            {t.label}
          </span>
        ))}
      </div>
    </section>
  );
}
