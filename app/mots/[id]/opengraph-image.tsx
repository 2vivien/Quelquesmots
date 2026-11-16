import { ImageResponse } from "next/og";
import { displayAuthor } from "@/features/authors";
import { serverPostsService } from "@/features/posts/services/posts.server";
import { getServerSessionUser } from "@/lib/server/auth-server";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Carte typographique Open Graph ivoire générée pour chaque texte public. */
export default async function OpenGraphImage(props: {
  params?: Promise<{ id?: string }>;
}) {
  const resolved = props.params ? await props.params : undefined;
  const id = resolved?.id ?? "";
  const viewer = await getServerSessionUser();
  const post = id ? await serverPostsService.getById(id, viewer?.id ?? null) : null;
  const title = post?.title ?? "Quelques mots";
  const author = post
    ? displayAuthor({
        publishAs: post.publishAs,
        username: post.authorUsername,
        userId: post.authorId,
        firstName: post.authorFirstName,
        lastName: post.authorLastName,
      }).label
    : "Quelques mots";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FAF2EA",
          color: "#282524",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 28, color: "#706C69" }}>Quelques mots</div>
        <div style={{ fontSize: 64, lineHeight: 1.15 }}>{title}</div>
        <div style={{ fontSize: 28, color: "#706C69" }}>Par {author}</div>
      </div>
    ),
    { ...size },
  );
}
