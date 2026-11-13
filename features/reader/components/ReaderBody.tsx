import type { TiptapDoc, TiptapNode } from "@/types";

interface ReaderBodyProps {
  doc: TiptapDoc;
}

function renderInline(nodes: TiptapNode[] | undefined) {
  if (!nodes) return null;
  return nodes.map((node, i) => {
    if (node.type === "hardBreak") return <br key={i} />;
    const bold = node.marks?.some((m) => m.type === "bold");
    const italic = node.marks?.some((m) => m.type === "italic");
    let content: React.ReactNode = node.text ?? "";
    if (bold) content = <strong>{content}</strong>;
    if (italic) content = <em>{content}</em>;
    return <span key={i}>{content}</span>;
  });
}

/**
 * Corps littéraire du texte rendu en Newsreader 19-20 px / interligne 1,7.
 * @param props Document Tiptap assaini.
 */
export function ReaderBody({ doc }: ReaderBodyProps) {
  return (
    <div className="space-y-6 font-serif text-[19px] leading-[1.7] text-encre sm:text-[20px]">
      {doc.content.map((block, idx) =>
        block.type === "blockquote" ? (
          <blockquote key={idx} className="border-y border-bord py-4 italic text-encre/90">
            {renderInline(block.content)}
          </blockquote>
        ) : (
          <p key={idx}>{renderInline(block.content)}</p>
        ),
      )}
    </div>
  );
}
