export { AuthorAvatar } from "./components/AuthorAvatar";
export { AuthorHeader } from "./components/AuthorHeader";
export { AuthorRow } from "./components/AuthorRow";
export { AuthorsDirectoryView } from "./components/AuthorsDirectoryView";
export { useAuthorProfile, useAuthors } from "./hooks/useAuthors";
export { upsertMockAuthor } from "./services/authors.mock";
export { authorsService } from "./services/authors.service";
export type {
  AuthorProfile,
  AuthorsService,
  DisplayAuthorInput,
} from "./types/authors.types";
export { displayAuthor } from "./utils/display-author";
