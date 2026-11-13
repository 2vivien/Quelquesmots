import Image from "next/image";

interface AuthorAvatarProps {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
}

/**
 * Avatar circulaire d'un auteur avec liseré accent optionnel et secours initiales.
 * @param props Source de l'image, texte alternatif et taille en pixels.
 */
export function AuthorAvatar({
  src,
  alt,
  size = 40,
  ring = false,
}: AuthorAvatarProps) {
  const ringCls = ring ? "ring-2 ring-encre" : "";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-pilule text-xs font-medium text-encre ${ringCls}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{alt.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}
