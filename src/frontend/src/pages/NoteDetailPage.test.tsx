import { NoteDetailPage } from "@/pages/NoteDetailPage";
import { createMockActor, makeNote, renderPage } from "@/test/test-utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actor = createMockActor();
const navigate = vi.fn();

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor, isFetching: false }),
  useInternetIdentity: () => ({
    identity: undefined,
    login: vi.fn(),
    clear: vi.fn(),
    loginStatus: "idle",
    isInitializing: false,
    isLoginIdle: true,
    isLoggingIn: false,
    isLoginSuccess: false,
    isLoginError: false,
    isAuthenticated: true,
    loginError: undefined,
  }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

// The rich-text editor is replaced with a plain textarea so the autosave
// contract can be exercised without a full Quill DOM.
vi.mock("react-quill-new", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label="Note body"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

describe("NoteDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("loads an existing note into the editor", async () => {
    actor.getNote.mockResolvedValue(
      makeNote({ id: 5n, title: "Trip plan", body: "<p>Kyoto</p>" }),
    );
    renderPage(() => <NoteDetailPage noteId={5n} />);

    expect(await screen.findByDisplayValue("Trip plan")).toBeInTheDocument();
    expect(screen.getByLabelText("Note body")).toHaveValue("<p>Kyoto</p>");
    expect(actor.getNote).toHaveBeenCalledWith(5n);
  });

  it("autosaves a title edit after the debounce and shows Saved", async () => {
    actor.getNote.mockResolvedValue(makeNote({ id: 6n, title: "Old title" }));
    actor.updateNote.mockResolvedValue(
      makeNote({ id: 6n, title: "New title" }),
    );
    const user = userEvent.setup();
    renderPage(() => <NoteDetailPage noteId={6n} />);

    const title = await screen.findByDisplayValue("Old title");
    await user.clear(title);
    await user.type(title, "New title");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await waitFor(
      () => expect(actor.updateNote).toHaveBeenCalledWith(6n, "New title", ""),
      { timeout: 3000 },
    );
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("shows a save failure when the update rejects", async () => {
    actor.getNote.mockResolvedValue(makeNote({ id: 8n, title: "Fragile" }));
    actor.updateNote.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    renderPage(() => <NoteDetailPage noteId={8n} />);

    const title = await screen.findByDisplayValue("Fragile");
    await user.type(title, "!");

    expect(await screen.findByText("Save failed")).toBeInTheDocument();
  });

  it("requires confirmation before deleting and returns to the list", async () => {
    actor.getNote.mockResolvedValue(makeNote({ id: 9n, title: "Bye" }));
    actor.deleteNote.mockResolvedValue(true);
    const user = userEvent.setup();
    renderPage(() => <NoteDetailPage noteId={9n} />);

    await user.click(await screen.findByRole("button", { name: /Delete/ }));
    expect(actor.deleteNote).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Confirm delete/ }));
    await waitFor(() => expect(actor.deleteNote).toHaveBeenCalledWith(9n));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/notes" }),
    );
  });

  it("shows a not-found state when the note is missing", async () => {
    actor.getNote.mockResolvedValue(null);
    renderPage(() => <NoteDetailPage noteId={404n} />);
    expect(await screen.findByText("Note not found")).toBeInTheDocument();
  });
});
