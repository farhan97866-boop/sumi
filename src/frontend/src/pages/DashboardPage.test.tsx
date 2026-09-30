import { TOOLS } from "@/lib/tools";
import { DashboardPage } from "@/pages/DashboardPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: DashboardPage,
  });
  const toolRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/$tool",
    component: () => <div data-testid="tool-page">Tool page</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([dashboardRoute, toolRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  it("renders a card for every tool with its name and description", async () => {
    renderDashboard();
    expect(
      await screen.findByRole("heading", { name: "Sumi Tools" }),
    ).toBeInTheDocument();
    for (const tool of TOOLS) {
      const card = screen.getByRole("link", {
        name: new RegExp(tool.name),
      });
      expect(
        within(card).getByRole("heading", { name: tool.name }),
      ).toBeInTheDocument();
      expect(within(card).getByText(tool.description)).toBeInTheDocument();
    }
  });

  it("groups cards under their group headings", async () => {
    renderDashboard();
    await screen.findByRole("heading", { name: "Sumi Tools" });
    for (const label of ["Compute", "Games", "Study", "Notes"]) {
      expect(
        screen.getByRole("heading", { name: label, level: 2 }),
      ).toBeInTheDocument();
    }
  });

  it("navigates to a tool when its card is clicked", async () => {
    const user = userEvent.setup();
    renderDashboard();
    const card = await screen.findByRole("link", { name: /Calculator/ });
    await user.click(card);
    expect(await screen.findByTestId("tool-page")).toBeInTheDocument();
  });

  it("marks account-only tools with an Account badge", async () => {
    renderDashboard();
    const notesCard = (
      await screen.findByRole("link", {
        name: /Notes/,
      })
    ).closest("a") as HTMLElement;
    expect(within(notesCard).getByText("Account")).toBeInTheDocument();
  });
});
