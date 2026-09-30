import { createActor } from "@/backend";
import type { NoteView } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/** Query key for the notes list, optionally scoped by a search term. */
export function notesQueryKey(search: string) {
  return ["notes", search] as const;
}

/** Query key for a single note by id. */
export function noteQueryKey(id: bigint) {
  return ["note", id.toString()] as const;
}

/**
 * Motoko `Time.now()` values are nanosecond bigints. Convert through this
 * helper before any JavaScript Date operation.
 */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Compact relative time for note metadata, e.g. "3m ago". */
export function formatRelativeTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

/** Full timestamp for the detail view header. */
export function formatFullTimestamp(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Strip HTML tags to produce a plain-text preview of a rich-text body. */
export function plainTextPreview(body: string, maxLength = 160): string {
  const text = body
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** True when a rich-text body has no visible content. */
export function isBodyEmpty(body: string): boolean {
  return plainTextPreview(body, Number.POSITIVE_INFINITY).length === 0;
}

/** Pinned notes first, then most recently updated. */
export function sortNotes(notes: NoteView[]): NoteView[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return Number(b.updatedAt - a.updatedAt);
  });
}

/** Invalidate every notes list plus a single note's detail cache. */
function invalidateNotes(queryClient: QueryClient, id?: bigint) {
  void queryClient.invalidateQueries({ queryKey: ["notes"] });
  if (id !== undefined) {
    void queryClient.invalidateQueries({ queryKey: noteQueryKey(id) });
  }
}

/** List the signed-in user's notes, optionally filtered by a search term. */
export function useNotes(search: string) {
  const { actor, isFetching } = useActor(createActor);
  const trimmed = search.trim();
  return useQuery({
    queryKey: notesQueryKey(trimmed),
    queryFn: async () => {
      if (!actor) return [];
      return actor.listNotes(trimmed.length > 0 ? trimmed : null);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch a single note by id. */
export function useNote(id: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: noteQueryKey(id),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getNote(id);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Create a note and refresh the list. */
export function useCreateNote() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createNote(input.title, input.body);
    },
    onSuccess: (note) => {
      invalidateNotes(queryClient, note.id);
    },
  });
}

/** Update a note's title and body. */
export function useUpdateNote() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; title: string; body: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateNote(input.id, input.title, input.body);
    },
    onSuccess: (note) => {
      invalidateNotes(queryClient, note?.id);
    },
  });
}

/** Pin or unpin a note. */
export function useSetNotePinned() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; pinned: boolean }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setNotePinned(input.id, input.pinned);
    },
    onSuccess: (note) => {
      invalidateNotes(queryClient, note?.id);
    },
  });
}

/** Delete a note. */
export function useDeleteNote() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteNote(id);
    },
    onSuccess: (_deleted, id) => {
      invalidateNotes(queryClient, id);
    },
  });
}
