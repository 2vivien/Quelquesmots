import type { TiptapDoc, TiptapMark, TiptapNode } from "@/types";

const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "blockquote",
  "hardBreak",
]);
const ALLOWED_MARKS = new Set(["bold", "italic"]);

function sanitizeMark(mark: TiptapMark | unknown): TiptapMark | null {
  if (!mark || typeof mark !== "object") return null;
  const raw = mark as TiptapMark;
  if (!ALLOWED_MARKS.has(raw.type)) return null;
  return { type: raw.type };
}

function sanitizeNode(node: TiptapNode | unknown): TiptapNode | null {
  if (!node || typeof node !== "object") return null;
  const raw = node as TiptapNode;
  if (typeof raw.type !== "string" || !ALLOWED_NODES.has(raw.type)) return null;
  const clean: TiptapNode = { type: raw.type };
  if (typeof raw.text === "string") clean.text = raw.text.slice(0, 10_000);
  if (Array.isArray(raw.marks)) {
    clean.marks = raw.marks
      .map(sanitizeMark)
      .filter((m): m is TiptapMark => m !== null);
  }
  if (Array.isArray(raw.content)) {
    clean.content = raw.content
      .map(sanitizeNode)
      .filter((n): n is TiptapNode => n !== null);
  }
  return clean;
}

function countNodes(node: TiptapNode): number {
  const children = node.content?.reduce((acc, child) => acc + countNodes(child), 0) ?? 0;
  return 1 + children;
}

const MAX_DOC_NODES = 2000;

/**
 * Nettoie un document Tiptap selon la liste blanche autorisée.
 * @param doc Document Tiptap brut.
 * @returns Document Tiptap assaini.
 */
export function sanitizeTiptapDoc(doc: TiptapDoc): TiptapDoc {
  const rawContent = Array.isArray(doc?.content) ? doc.content : [];
  const sanitized = rawContent
    .map(sanitizeNode)
    .filter((n): n is TiptapNode => n !== null);
  const kept: TiptapNode[] = [];
  let budget = MAX_DOC_NODES;
  for (const node of sanitized) {
    const size = countNodes(node);
    if (size > budget) continue;
    budget -= size;
    kept.push(node);
  }
  return { type: "doc", content: kept };
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
