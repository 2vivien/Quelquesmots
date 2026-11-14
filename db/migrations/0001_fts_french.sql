-- Recherche plein-texte française (GIN) sur titre, extrait et contenu texte des textes.
CREATE INDEX posts_fts_fr ON posts USING gin (
  to_tsvector(
    'french',
    coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || coalesce("content_text", '')
  )
);
