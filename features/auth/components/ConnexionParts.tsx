/** Logotype Google officiel (bouton « Continuer avec Google »). */
export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09" />
      <path fill="#EA4335" d="M12 5.04c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 5.04 12 5.04z" />
    </svg>
  );
}

/** Pastille décorative (sans lien) accrochée sous la barre supérieure. */
export function DecorativePill({ bg, length, children }: { bg: string; length: number; children: string }) {
  return (
    <span className="flex flex-col items-center">
      <span aria-hidden="true" className="block w-0 border-l-[2px] border-dotted border-encre" style={{ height: length }} />
      <span
        style={{ background: bg }}
        className="swing rounded-full border-[2px] border-encre px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-encre shadow-[2px_2px_0_0_var(--color-ink-jar)]"
      >
        {children}
      </span>
    </span>
  );
}
