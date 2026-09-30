import type { NoteView } from "@/backend";
import type { backendInterface } from "@/backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

/**
 * A typed local stand-in for the generated backend actor. Every method the
 * frontend calls is present, so a component that reaches for one it does not
 * implement fails loudly instead of silently passing.
 */
export type MockActor = {
  [K in keyof backendInterface]: ReturnType<typeof vi.fn>;
};

export function createMockActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
): MockActor {
  const base: Record<string, ReturnType<typeof vi.fn>> = {
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    setNotePinned: vi.fn(),
    getNote: vi.fn(),
    listNotes: vi.fn().mockResolvedValue([]),
    markJapaneseLearned: vi.fn().mockResolvedValue(undefined),
    getJapaneseProgress: vi.fn().mockResolvedValue(0n),
    getJapaneseLearned: vi.fn().mockResolvedValue([]),
    markChineseLearned: vi.fn().mockResolvedValue(undefined),
    getChineseProgress: vi.fn().mockResolvedValue(0n),
    getChineseLearned: vi.fn().mockResolvedValue([]),
    assignCallerUserRole: vi.fn(),
    getCallerUserRole: vi.fn(),
    isCallerAdmin: vi.fn().mockResolvedValue(false),
    getApiDoc: vi.fn().mockResolvedValue(""),
  };
  for (const [key, value] of Object.entries(overrides)) {
    base[key] = vi.fn().mockResolvedValue(value);
  }
  return base as unknown as MockActor;
}

export function makeNote(overrides: Partial<NoteView> = {}): NoteView {
  return {
    id: 1n,
    title: "Note",
    body: "",
    createdAt: 0n,
    updatedAt: 0n,
    pinned: false,
    ...overrides,
  };
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Render a single page component inside the providers it expects: a fresh
 * QueryClient and a memory router whose root route renders the component.
 */
export function renderPage(
  component: () => ReactNode,
  options: { initialPath?: string } = {},
): RenderResult {
  const queryClient = createTestQueryClient();
  const rootRoute = createRootRoute({ component });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({
      initialEntries: [options.initialPath ?? "/"],
    }),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
