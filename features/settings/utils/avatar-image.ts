/**
 * Redimensionne une image choisie par l'utilisateur en JPEG carré 512×512.
 * Cadrage centré sur le plus petit côté ; aucune donnée n'est envoyée avant compression.
 */

/** Produit un Blob JPEG carré depuis un fichier image, ou `null` si le décodage échoue. */
export async function downscaleAvatar(file: File, size = 512): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85),
    );
  } finally {
    bitmap.close();
  }
}
