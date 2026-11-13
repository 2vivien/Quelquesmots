import Image from "next/image";

interface ReaderHeroProps {
  imageUrl: string;
  alt: string;
}

/**
 * Bandeau photo atmosphérique en tête de la page de lecture (écran 6).
 * @param props URL de l'image et texte alternatif.
 */
export function ReaderHero({ imageUrl, alt }: ReaderHeroProps) {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-[16px] bg-pilule sm:h-60">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority
        sizes="(max-width: 720px) 100vw, 720px"
        referrerPolicy="no-referrer"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#3C3026]/20 to-[#3C3026]/35" />
    </div>
  );
}
