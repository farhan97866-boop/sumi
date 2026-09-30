import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="rule-grid flex min-h-full items-center justify-center px-4 py-16">
      <div
        data-ocid="notfound.page"
        className="flex max-w-md flex-col items-center gap-5 border border-border bg-card px-8 py-12 text-center shadow-subtle"
      >
        <span className="seal size-14 text-2xl" aria-hidden="true">
          無
        </span>
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Error 404
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            This page is blank paper
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            The tool you were looking for does not exist or has moved. Head back
            to the workbench to pick another.
          </p>
        </div>
        <Button
          asChild
          data-ocid="notfound.home_button"
          className="rounded-sm shadow-stamp"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
