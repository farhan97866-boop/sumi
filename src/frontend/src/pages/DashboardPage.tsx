import { TOOLS, TOOL_GROUPS } from "@/lib/tools";
import type { Tool } from "@/types";
import { Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.path}
      data-ocid={`dashboard.card.${index + 1}`}
      style={{ animationDelay: `${index * 40}ms` }}
      className="group flex animate-fade-in flex-col border border-border border-t-2 border-t-border bg-card p-4 shadow-subtle transition-smooth hover:border-ring/40 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="seal size-9 text-base" aria-hidden="true">
          {tool.seal}
        </span>
        <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold tracking-tight">
        {tool.name}
      </h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground text-pretty">
        {tool.description}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          {tool.group}
        </span>
        {tool.requiresAuth ? (
          <span className="inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            <LockKeyhole className="size-3" />
            Account
          </span>
        ) : (
          <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        )}
      </div>
    </Link>
  );
}

export function DashboardPage() {
  return (
    <div className="rule-grid min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <section className="animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Sumi Tools
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground text-pretty sm:text-base">
            One workbench for arithmetic, currency, board games, and Japanese
            and Chinese study. Pick a tray to begin.
          </p>
        </section>

        {TOOL_GROUPS.map((group) => {
          const tools = TOOLS.filter((tool) => tool.group === group.id);
          if (tools.length === 0) return null;
          return (
            <section key={group.id} className="mt-10">
              <div className="flex items-center gap-3 border-b border-border pb-2">
                <span
                  className="font-display text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  {group.mark}
                </span>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {group.label}
                </h2>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {tools.length.toString().padStart(2, "0")}
                </span>
              </div>
              <div
                data-ocid={`dashboard.grid.${group.id.toLowerCase()}`}
                className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {tools.map((tool, index) => (
                  <ToolCard key={tool.path} tool={tool} index={index} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
