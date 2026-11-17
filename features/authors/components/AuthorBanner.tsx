import type { SVGProps } from "react";

/**
 * Bannière illustrée du profil auteur : formes géométriques rétro (hommage Susan Kare),
 * entièrement décorative et accessible (aria-hidden), sans image distante.
 */
export function AuthorBanner({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 420 120"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <rect width="420" height="120" fill="#F5B921" />
      {/* vagues teal */}
      <path d="M0 30 Q26 6 52 30 T104 30 T156 30 T208 30 T260 30 T312 30 T364 30 T416 30" fill="none" stroke="#117C5B" strokeWidth="7" />
      {/* soleil corail */}
      <circle cx="56" cy="76" r="25" fill="#FFB3A0" stroke="#282524" strokeWidth="3" />
      {/* fenêtre bleue à pois */}
      <rect x="100" y="56" width="62" height="46" rx="8" fill="#BDE0FE" stroke="#282524" strokeWidth="3" />
      <circle cx="116" cy="70" r="4" fill="#282524" />
      <circle cx="136" cy="70" r="4" fill="#282524" />
      <circle cx="116" cy="88" r="4" fill="#282524" />
      <circle cx="136" cy="88" r="4" fill="#282524" />
      {/* bande rayée verte */}
      <rect x="180" y="58" width="88" height="44" rx="6" fill="#CFFB7F" stroke="#282524" strokeWidth="3" />
      <path d="M188 78h72" stroke="#282524" strokeWidth="6" />
      {/* œil */}
      <ellipse cx="312" cy="76" rx="30" ry="18" fill="#FDF9EE" stroke="#282524" strokeWidth="3" />
      <circle cx="312" cy="76" r="9" fill="#282524" />
      {/* note de musique */}
      <path d="M384 92V58l20-6v34" fill="none" stroke="#282524" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="379" cy="94" r="9" fill="#FF8A6B" stroke="#282524" strokeWidth="3" />
      <circle cx="399" cy="88" r="9" fill="#FF8A6B" stroke="#282524" strokeWidth="3" />
      {/* petite étoile */}
      <path d="M232 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#FDF9EE" stroke="#282524" strokeWidth="2" />
    </svg>
  );
}
