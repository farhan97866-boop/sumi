import { Layout } from "@/components/Layout";
import { CalculatorPage } from "@/pages/CalculatorPage";
import { CarromPage } from "@/pages/CarromPage";
import { ChessPage } from "@/pages/ChessPage";
import { ChinesePage } from "@/pages/ChinesePage";
import { CurrencyPage } from "@/pages/CurrencyPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { JapanesePage } from "@/pages/JapanesePage";
import { KarutaPage } from "@/pages/KarutaPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { NoteDetailPage } from "@/pages/NoteDetailPage";
import { NotesPage } from "@/pages/NotesPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  notFoundComponent: NotFoundPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const calculatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calculator",
  component: CalculatorPage,
});

const currencyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/currency",
  component: CurrencyPage,
});

const carromRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/carrom",
  component: CarromPage,
});

const chessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chess",
  component: ChessPage,
});

const chineseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chinese",
  component: ChinesePage,
});

const karutaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/karuta",
  component: KarutaPage,
});

const japaneseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/japanese",
  component: JapanesePage,
});

const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notes",
  component: NotesPage,
});

const noteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notes/$noteId",
  component: NoteDetailRoute,
});

function NoteDetailRoute() {
  const { noteId } = noteDetailRoute.useParams();
  return <NoteDetailPage noteId={BigInt(noteId)} />;
}

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  calculatorRoute,
  currencyRoute,
  carromRoute,
  chessRoute,
  chineseRoute,
  karutaRoute,
  japaneseRoute,
  notesRoute,
  noteDetailRoute,
]);

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
