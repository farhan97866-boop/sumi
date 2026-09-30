import { TOOLS, TOOL_GROUPS } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";

interface SidebarProps {
  /** Called after a navigation click, used to close the mobile sheet. */
  onNavigate?: () => void;
}

/**
 * Tool index. Active row gets a vermillion left rule and a hanko seal chip.
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav
      aria-label="Tools"
      data-ocid="sidebar"
      className="flex h-full flex-col gap-6 overflow-y-auto bg-sidebar px-3 py-5 text-sidebar-foreground"
    >
      {TOOL_GROUPS.map((group) => {
        const tools = TOOLS.filter((tool) => tool.group === group.id);
        if (tools.length === 0) return null;
        return (
          <div key={group.id} className="space-y-1">
            <div className="flex items-center gap-2 px-2 pb-1">
              <span
                className="font-display text-xs text-muted-foreground"
                aria-hidden="true"
              >
                {group.mark}
              </span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {group.label}
              </span>
            </div>
            <ul className="space-y-0.5">
              {tools.map((tool) => {
                const isActive = pathname === tool.path;
                const Icon = tool.icon;
                return (
                  <li key={tool.path}>
                    <Link
                      to={tool.path}
                      onClick={onNavigate}
                      data-ocid={`sidebar.link.${tool.path.replace("/", "")}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 border-l-2 py-2 pl-3 pr-2 text-sm transition-smooth",
                        isActive
                          ? "border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {tool.name}
                      </span>
                      {isActive ? (
                        <span
                          className="seal size-5 text-[0.6rem]"
                          aria-hidden="true"
                        >
                          {tool.seal}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
