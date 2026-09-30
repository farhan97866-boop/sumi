import { NotesPage } from "@/pages/NotesPage";
import { createMockActor, makeNote, renderPage } from "@/test/test-utils";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actor = createMockActor();
const navigate = vi.fn();
const login = vi.fn();
const authState = { isAuthenticated: true };

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor, isFetching: false }),
  useInternetIdentity: () => ({
    identity: undefined,
    login,
    clear: vi.fn(),
    loginStatus: "idle",
    isInitializing: false,
    isLoginIdle: true,
    isLoggingIn: false,
    isLoginSuccess: false,
    isLoginError: false,
    isAuthenticated: authState.isAuthenticated,
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

describe("NotesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = true;
    actor.listNotes.mockResolvedValue([]);
  });

  it("gates note creation behind sign-in when signed out", async () => {
    authState.isAuthenticated = false;
    const user = userEvent.setup();
    renderPage(() => <NotesPage />);

    expect(
      await screen.findByText("Sign in to write and save notes"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("New note title")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sign in/ }));
    expect(login).toHaveBeenCalled();
  });

  it("shows the empty state when the user has no notes", async () => {
    renderPage(() => <NotesPage />);
    expect(await screen.findByText("No notes yet")).toBeInTheDocument();
  });

  it("lists notes with pinned notes first", async () => {
    actor.listNotes.mockResolvedValue([
      makeNote({ id: 1n, title: "Older", updatedAt: 100n }),
      makeNote({ id: 2n, title: "Pinned", updatedAt: 50n, pinned: true }),
    ]);
    renderPage(() => <NotesPage />);

    const items = await screen.findAllByRole("article");
    expect(items[0]).toHaveTextContent("Pinned");
    expect(items[1]).toHaveTextContent("Older");
  });

  it("creates a note and navigates to its detail page", async () => {
    const created = makeNote({ id: 7n, title: "Groceries" });
    actor.createNote.mockResolvedValue(created);
    const user = userEvent.setup();
    renderPage(() => <NotesPage />);

    await user.type(
      await screen.findByLabelText("New note title"),
      "Groceries",
    );
    await user.click(screen.getByRole("button", { name: /New note/ }));

    await waitFor(() =>
      expect(actor.createNote).toHaveBeenCalledWith("Groceries", ""),
    );
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/notes/$noteId",
        params: { noteId: "7" },
      }),
    );
  });

  it("toggles a note's pinned state", async () => {
    actor.listNotes.mockResolvedValue([
      makeNote({ id: 3n, title: "Pin me", pinned: false }),
    ]);
    actor.setNotePinned.mockResolvedValue(
      makeNote({ id: 3n, title: "Pin me", pinned: true }),
    );
    const user = userEvent.setup();
    renderPage(() => <NotesPage />);

    await user.click(await screen.findByRole("button", { name: "Pin note" }));
    await waitFor(() =>
      expect(actor.setNotePinned).toHaveBeenCalledWith(3n, true),
    );
  });

  it("deletes a note", async () => {
    actor.listNotes.mockResolvedValue([
      makeNote({ id: 4n, title: "Delete me" }),
    ]);
    actor.deleteNote.mockResolvedValue(true);
    const user = userEvent.setup();
    renderPage(() => <NotesPage />);

    await user.click(
      await screen.findByRole("button", { name: "Delete note" }),
    );
    await waitFor(() => expect(actor.deleteNote).toHaveBeenCalledWith(4n));
  });

  it("sends the trimmed search term to the backend", async () => {
    const user = userEvent.setup();
    renderPage(() => <NotesPage />);

    await user.type(await screen.findByLabelText("Search notes"), "  kyoto  ");

    await waitFor(() => expect(actor.listNotes).toHaveBeenCalledWith("kyoto"));
  });

  it("shows a search-specific empty state and clears it", async () => {
    actor.listNotes.mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage(() => <NotesPage />);

    await user.type(await screen.findByLabelText("Search notes"), "zzz");

    const emptyState = await screen.findByText("No notes match your search");
    expect(emptyState).toBeInTheDocument();

    // Both the toolbar and the empty state offer a clear control; use the
    // empty-state one, which is scoped to the empty-state container.
    const emptyContainer = emptyState.closest(
      "[data-ocid='notes.empty_state']",
    );
    expect(emptyContainer).not.toBeNull();
    await user.click(
      within(emptyContainer as HTMLElement).getByRole("button", {
        name: "Clear search",
      }),
    );
    expect(await screen.findByText("No notes yet")).toBeInTheDocument();
  });
});
