import { NotFoundPage } from "@/pages/NotFoundPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function renderNotFound() {
  const queryClient = new QueryClient();
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
    notFoundComponent: NotFoundPage,
  });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div data-testid="dashboard">Dashboard</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
    history: createMemoryHistory({ initialEntries: ["/does-not-exist"] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("NotFoundPage", () => {
  it("renders the 404 message for an unknown route", async () => {
    renderNotFound();
    expect(await screen.findByText("Error 404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "This page is blank paper" }),
    ).toBeInTheDocument();
  });

  it("returns to the dashboard from the 404 page", async () => {
    const user = userEvent.setup();
    renderNotFound();
    await user.click(
      await screen.findByRole("link", { name: /Back to dashboard/ }),
    );
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });
});
