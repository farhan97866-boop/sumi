import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIdentity } from "@/hooks/use-identity";
import { getToolByPath } from "@/lib/tools";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, UserRound } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { isAuthenticated, isInitializing, isLoggingIn, login, logout } =
    useIdentity();

  const activeTool = getToolByPath(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-subtle">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open tool menu"
                data-ocid="nav.menu_button"
                className="rounded-sm lg:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-r border-sidebar-border bg-sidebar p-0"
            >
              <SheetHeader className="border-b border-sidebar-border px-4 py-3">
                <SheetTitle className="font-display text-base tracking-tight">
                  Sumi Tools
                </SheetTitle>
              </SheetHeader>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link
            to="/"
            data-ocid="nav.home_link"
            className="flex items-center gap-2.5"
          >
            <span className="seal size-7 text-sm" aria-hidden="true">
              墨
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Sumi
            </span>
          </Link>

          {activeTool ? (
            <>
              <span
                className="hidden text-muted-foreground sm:inline"
                aria-hidden="true"
              >
                /
              </span>
              <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                {activeTool.name}
              </span>
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={logout}
                data-ocid="auth.logout_button"
                className="rounded-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={login}
                disabled={isInitializing || isLoggingIn}
                data-ocid="auth.login_button"
                className="rounded-sm shadow-stamp"
              >
                <UserRound className="size-4" />
                <span className="hidden sm:inline">
                  {isLoggingIn ? "Signing in…" : "Sign in"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-sidebar-border lg:block">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{TOOL_COUNT} tools · Sumi ink &amp; paper workspace</p>
          <p>
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

const TOOL_COUNT = 8;
