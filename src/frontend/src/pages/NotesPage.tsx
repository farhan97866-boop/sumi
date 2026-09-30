import type { NoteView } from "@/backend";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIdentity } from "@/hooks/use-identity";
import {
  formatRelativeTime,
  isBodyEmpty,
  plainTextPreview,
  sortNotes,
  useCreateNote,
  useDeleteNote,
  useNotes,
  useSetNotePinned,
} from "@/lib/notes";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  NotebookPen,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function NoteCard({
  note,
  index,
  onTogglePin,
  onDelete,
  pinPending,
  deletePending,
}: {
  note: NoteView;
  index: number;
  onTogglePin: (note: NoteView) => void;
  onDelete: (note: NoteView) => void;
  pinPending: boolean;
  deletePending: boolean;
}) {
  const preview = plainTextPreview(note.body);
  return (
    <article
      data-ocid={`notes.item.${index + 1}`}
      className="group flex flex-col border border-border border-t-2 border-t-border bg-card shadow-subtle transition-smooth hover:border-ring/40 hover:shadow-elevated"
    >
      <Link
        to="/notes/$noteId"
        params={{ noteId: note.id.toString() }}
        data-ocid={`notes.open_link.${index + 1}`}
        className="flex flex-1 flex-col p-4"
      >
        <div className="flex items-start gap-2">
          {note.pinned ? (
            <Pin
              className="mt-0.5 size-3.5 shrink-0 text-primary"
              aria-label="Pinned"
            />
          ) : null}
          <h3 className="min-w-0 flex-1 truncate font-display text-base font-semibold tracking-tight">
            {note.title.trim().length > 0 ? note.title : "Untitled note"}
          </h3>
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground text-pretty">
          {preview.length > 0 ? preview : "No content yet."}
        </p>
        <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          {formatRelativeTime(note.updatedAt)}
        </p>
      </Link>
      <div className="flex items-center justify-end gap-1 border-t border-border px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          data-ocid={`notes.pin_button.${index + 1}`}
          disabled={pinPending}
          onClick={() => onTogglePin(note)}
          className="size-8 rounded-sm text-muted-foreground hover:text-foreground"
        >
          {note.pinned ? (
            <PinOff className="size-4" />
          ) : (
            <Pin className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete note"
          data-ocid={`notes.delete_button.${index + 1}`}
          disabled={deletePending}
          onClick={() => onDelete(note)}
          className="size-8 rounded-sm text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </article>
  );
}

function NoteSkeleton() {
  return (
    <div className="border border-border bg-card p-4 shadow-subtle">
      <Skeleton className="h-5 w-3/4 rounded-sm" />
      <Skeleton className="mt-3 h-3.5 w-full rounded-sm" />
      <Skeleton className="mt-2 h-3.5 w-5/6 rounded-sm" />
      <Skeleton className="mt-4 h-3 w-16 rounded-sm" />
    </div>
  );
}

export function NotesPage() {
  const { isAuthenticated, isInitializing } = useIdentity();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  const notesQuery = useNotes(search);
  const createNote = useCreateNote();
  const setPinned = useSetNotePinned();
  const deleteNote = useDeleteNote();

  const notes = useMemo(
    () => sortNotes(notesQuery.data ?? []),
    [notesQuery.data],
  );

  const pinnedCount = notes.filter((note) => note.pinned).length;

  function handleCreate() {
    const title = draftTitle.trim();
    if (title.length === 0) return;
    setDraftTitle("");
    createNote.mutate(
      { title, body: "" },
      {
        onSuccess: (note) => {
          void navigate({
            to: "/notes/$noteId",
            params: { noteId: note.id.toString() },
          });
        },
        onError: () => {
          setDraftTitle((current) => (current === "" ? title : current));
          toast.error("Could not create the note. Try again.");
        },
      },
    );
  }

  function handleTogglePin(note: NoteView) {
    setPinned.mutate(
      { id: note.id, pinned: !note.pinned },
      {
        onError: () => toast.error("Could not update the pin. Try again."),
      },
    );
  }

  function handleDelete(note: NoteView) {
    deleteNote.mutate(note.id, {
      onSuccess: () => toast.success("Note deleted."),
      onError: () => toast.error("Could not delete the note. Try again."),
    });
  }

  if (isInitializing) {
    return (
      <div className="rule-grid min-h-full">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
          <div
            data-ocid="notes.loading_state"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, i) => `note-skeleton-${i}`).map(
              (id) => (
                <NoteSkeleton key={id} />
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rule-grid min-h-full">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
          <header className="border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Notes
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Notes
            </h1>
          </header>
          <div className="mt-6">
            <SignInPrompt action="write and save notes" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rule-grid min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Notes
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Notes
            </h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {notes.length.toString().padStart(2, "0")} notes ·{" "}
            {pinnedCount.toString().padStart(2, "0")} pinned
          </p>
        </header>

        {/* ---- Toolbar: create + search ---- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreate();
            }}
          >
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="New note title…"
              aria-label="New note title"
              data-ocid="notes.input"
              className="h-11 rounded-sm border-input bg-ink-wash"
            />
            <Button
              type="submit"
              disabled={createNote.isPending || draftTitle.trim().length === 0}
              data-ocid="notes.add_button"
              className="h-11 shrink-0 rounded-sm shadow-stamp"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">New note</span>
            </Button>
          </form>

          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
              data-ocid="notes.search_input"
              className="h-11 rounded-sm border-input bg-ink-wash pl-9 pr-9"
            />
            {search.length > 0 ? (
              <button
                type="button"
                aria-label="Clear search"
                data-ocid="notes.clear_search_button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* ---- List ---- */}
        {notesQuery.isPending ? (
          <div
            data-ocid="notes.loading_state"
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, i) => `note-skeleton-${i}`).map(
              (id) => (
                <NoteSkeleton key={id} />
              ),
            )}
          </div>
        ) : notesQuery.isError ? (
          <div
            data-ocid="notes.error_state"
            className="mt-6 flex flex-col items-center gap-3 border border-border bg-card px-6 py-12 text-center shadow-subtle"
          >
            <FileText className="size-6 text-destructive" />
            <p className="text-sm text-muted-foreground text-pretty">
              We could not load your notes.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void notesQuery.refetch()}
              data-ocid="notes.retry_button"
              className="rounded-sm"
            >
              Try again
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <div
            data-ocid="notes.empty_state"
            className="mt-6 flex flex-col items-center gap-4 border border-border bg-card px-6 py-16 text-center shadow-subtle"
          >
            <span className="seal size-12 text-xl" aria-hidden="true">
              筆
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {search.trim().length > 0
                  ? "No notes match your search"
                  : "No notes yet"}
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                {search.trim().length > 0
                  ? "Try a different word, or clear the search to see everything."
                  : "Start a note above — give it a title and write the body on its own page."}
              </p>
            </div>
            {search.trim().length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearch("")}
                data-ocid="notes.clear_search_button"
                className="rounded-sm"
              >
                Clear search
              </Button>
            ) : null}
          </div>
        ) : (
          <div
            data-ocid="notes.list"
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {notes.map((note, index) => (
              <NoteCard
                key={note.id.toString()}
                note={note}
                index={index}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                pinPending={setPinned.isPending}
                deletePending={deleteNote.isPending}
              />
            ))}
          </div>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <NotebookPen className="size-3.5" />
          Pinned notes stay at the top; the rest sort by most recently edited.
        </p>
      </div>
    </div>
  );
}
