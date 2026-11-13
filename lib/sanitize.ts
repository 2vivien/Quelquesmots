import type { TiptapDoc, TiptapMark, TiptapNode } from "@/types";

const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "blockquote",
  "hardBreak",
]);
const ALLOWED_MARKS = new Set(["bold", "italic"]);

function sanitizeMark(mark: TiptapMark): TiptapMark | null {
  if (!ALLOWED_MARKS.has(mark.type)) return null;
  return { type: mark.type };
}

function sanitizeNode(node: TiptapNode): TiptapNode | null {
  if (!ALLOWED_NODES.has(node.type)) return null;
  const clean: TiptapNode = { type: node.type };
  if (typeof node.text === "string") clean.text = node.text;
  if (Array.isArray(node.marks)) {
    clean.marks = node.marks
      .map(sanitizeMark)
      .filter((m): m is TiptapMark => m !== null);
  }
  if (Array.isArray(node.content)) {
    clean.content = node.content
      .map(sanitizeNode)
      .filter((n): n is TiptapNode => n !== null);
  }
  return clean;
}

/**
 * Nettoie un document Tiptap selon la liste blanche autorisée.
 * @param doc Document Tiptap brut.
 * @returns Document Tiptap assaini.
 */
export function sanitizeTiptapDoc(doc: TiptapDoc): TiptapDoc {
  const sanitized = doc.content
    .map(sanitizeNode)
    .filter((n): n is TiptapNode => n !== null);
  return { type: "doc", content: sanitized };
}

function collectNodeText(node: TiptapNode): string {
  if (node.type === "hardBreak") return "\n";
  if (typeof node.text === "string") return node.text;
  if (!Array.isArray(node.content)) return "";
  const inner = node.content.map(collectNodeText).join("");
  return node.type === "paragraph" || node.type === "blockquote"
    ? `${inner}\n`
    : inner;
}

/**
 * Extrait le texte brut d'un document Tiptap pour la recherche et le compteur.
 * @param doc Document Tiptap.
 * @returns Texte brut sans balisage.
 */
export function extractPlainText(doc: TiptapDoc): string {
  return doc.content.map(collectNodeText).join("\n").trim();
}
