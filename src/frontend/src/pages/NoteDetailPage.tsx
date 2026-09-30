import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIdentity } from "@/hooks/use-identity";
import {
  formatFullTimestamp,
  isBodyEmpty,
  useDeleteNote,
  useNote,
  useSetNotePinned,
  useUpdateNote,
} from "@/lib/notes";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  FileText,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "sonner";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 900;

const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ header: [1, 2, 3, false] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "header",
  "list",
  "blockquote",
  "code-block",
  "link",
];

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span
        data-ocid="note.saving_state"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
      >
        <CloudUpload className="size-3.5 animate-pulse" />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span
        data-ocid="note.saved_state"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-success"
      >
        <Check className="size-3.5" />
        Saved
      </span>
    );
  }
  if (state === "error") {
    return (
      <span
        data-ocid="note.error_state"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-destructive"
      >
        <FileText className="size-3.5" />
        Save failed
      </span>
    );
  }
  if (state === "dirty") {
    return (
      <span
        data-ocid="note.dirty_state"
        className="font-mono text-xs text-muted-foreground"
      >
        Unsaved changes
      </span>
    );
  }
  return (
    <span className="font-mono text-xs text-muted-foreground">
      All changes saved
    </span>
  );
}

export function NoteDetailPage({ noteId }: { noteId: bigint }) {
  const { isAuthenticated, isInitializing } = useIdentity();
  const navigate = useNavigate();

  const noteQuery = useNote(noteId);
  const updateNote = useUpdateNote();
  const setPinned = useSetNotePinned();
  const deleteNote = useDeleteNote();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // One-time initialization of the draft from the loaded note. After this the
  // draft is owned by the user and never overwritten by a refetch.
  const initialized = useRef(false);
  const latest = useRef({ title: "", body: "" });
  const savedSnapshot = useRef({ title: "", body: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const note = noteQuery.data;
    if (!note || initialized.current) return;
    initialized.current = true;
    setTitle(note.title);
    setBody(note.body);
    latest.current = { title: note.title, body: note.body };
    savedSnapshot.current = { title: note.title, body: note.body };
  }, [noteQuery.data]);

  // Debounced autosave. Reads only refs so it never re-arms on every keystroke.
  useEffect(() => {
    if (saveState !== "dirty") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const { title: nextTitle, body: nextBody } = latest.current;
      if (
        nextTitle === savedSnapshot.current.title &&
        nextBody === savedSnapshot.current.body
      ) {
        setSaveState("saved");
        return;
      }
      setSaveState("saving");
      updateNote.mutate(
        { id: noteId, title: nextTitle, body: nextBody },
        {
          onSuccess: () => {
            savedSnapshot.current = { title: nextTitle, body: nextBody };
            setSaveState(
              latest.current.title === nextTitle &&
                latest.current.body === nextBody
                ? "saved"
                : "dirty",
            );
          },
          onError: () => setSaveState("error"),
        },
      );
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [saveState, noteId, updateNote]);

  function markDirty(nextTitle: string, nextBody: string) {
    latest.current = { title: nextTitle, body: nextBody };
    setSaveState("dirty");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    markDirty(value, latest.current.body);
  }

  function handleBodyChange(value: string) {
    setBody(value);
    markDirty(latest.current.title, value);
  }

  function handleTogglePin() {
    const note = noteQuery.data;
    if (!note) return;
    setPinned.mutate(
      { id: note.id, pinned: !note.pinned },
      {
        onError: () => toast.error("Could not update the pin. Try again."),
      },
    );
  }

  function handleDelete() {
    deleteNote.mutate(noteId, {
      onSuccess: () => {
        toast.success("Note deleted.");
        void navigate({ to: "/notes" });
      },
      onError: () => toast.error("Could not delete the note. Try again."),
    });
  }

  if (isInitializing) {
    return (
      <div className="rule-grid min-h-full">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div data-ocid="note.loading_state" className="space-y-4">
            <Skeleton className="h-9 w-2/3 rounded-sm" />
            <Skeleton className="h-64 w-full rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rule-grid min-h-full">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <SignInPrompt action="open and edit notes" />
        </div>
      </div>
    );
  }

  if (noteQuery.isPending) {
    return (
      <div className="rule-grid min-h-full">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div data-ocid="note.loading_state" className="space-y-4">
            <Skeleton className="h-9 w-2/3 rounded-sm" />
            <Skeleton className="h-64 w-full rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (noteQuery.isError || !noteQuery.data) {
    return (
      <div className="rule-grid min-h-full">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div
            data-ocid="note.error_state"
            className="flex flex-col items-center gap-4 border border-border bg-card px-6 py-16 text-center shadow-subtle"
          >
            <FileText className="size-6 text-destructive" />
            <div className="space-y-1">
              <h1 className="font-display text-xl font-semibold tracking-tight">
                Note not found
              </h1>
              <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                This note may have been deleted, or it belongs to another
                account.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-sm">
              <Link to="/notes" data-ocid="note.back_link">
                <ArrowLeft className="size-4" />
                Back to notes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const note = noteQuery.data;

  return (
    <div className="rule-grid min-h-full">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-sm text-muted-foreground hover:text-foreground"
          >
            <Link to="/notes" data-ocid="note.back_link">
              <ArrowLeft className="size-4" />
              All notes
            </Link>
          </Button>
          <SaveIndicator state={saveState} />
        </div>

        <header className="mt-4 border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span
              className="seal mt-1 size-9 shrink-0 text-base"
              aria-hidden="true"
            >
              筆
            </span>
            <div className="min-w-0 flex-1">
              <Input
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Untitled note"
                aria-label="Note title"
                data-ocid="note.title_input"
                className="h-auto rounded-sm border-transparent bg-transparent px-0 font-display text-2xl font-bold tracking-tight shadow-none focus-visible:border-input focus-visible:bg-ink-wash focus-visible:px-2 sm:text-3xl"
              />
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Edited {formatFullTimestamp(note.updatedAt)}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTogglePin}
            disabled={setPinned.isPending}
            data-ocid="note.pin_button"
            className="rounded-sm"
          >
            {note.pinned ? (
              <>
                <PinOff className="size-4" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="size-4" />
                Pin
              </>
            )}
          </Button>

          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteNote.isPending}
                data-ocid="note.confirm_button"
                className="rounded-sm"
              >
                <Trash2 className="size-4" />
                {deleteNote.isPending ? "Deleting…" : "Confirm delete"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                data-ocid="note.cancel_button"
                className="rounded-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              data-ocid="note.delete_button"
              className="rounded-sm text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
        </div>

        <section
          data-ocid="note.editor"
          className="mt-4 border border-border bg-card shadow-subtle"
        >
          <ReactQuill
            theme="snow"
            value={body}
            onChange={handleBodyChange}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Write your note…"
            className="sumi-editor"
          />
        </section>

        <p className="mt-3 text-xs text-muted-foreground">
          {isBodyEmpty(body)
            ? "This note has no body yet — start typing and it saves automatically."
            : "Changes save automatically as you type."}
        </p>
      </div>
    </div>
  );
}
