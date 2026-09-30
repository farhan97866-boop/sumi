import { Button } from "@/components/ui/button";
import { useIdentity } from "@/hooks/use-identity";
import { LockKeyhole } from "lucide-react";

interface SignInPromptProps {
  /** What the user gains by signing in, e.g. "save notes". */
  action: string;
  /** Compact inline variant for tool toolbars. */
  compact?: boolean;
}

/**
 * Shown when a signed-out user reaches a tool that persists data.
 * Browsing stays open; only saving requires an account.
 */
export function SignInPrompt({ action, compact = false }: SignInPromptProps) {
  const { login, isLoggingIn } = useIdentity();

  if (compact) {
    return (
      <div
        data-ocid="signin.prompt"
        className="flex items-center gap-3 border border-border bg-muted/40 px-3 py-2"
      >
        <LockKeyhole className="size-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          Sign in to {action}.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="signin.button"
          className="rounded-sm shadow-stamp"
        >
          {isLoggingIn ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    );
  }

  return (
    <div
      data-ocid="signin.prompt"
      className="flex flex-col items-center gap-4 border border-border bg-card px-6 py-12 text-center shadow-subtle"
    >
      <span className="seal size-12 text-xl" aria-hidden="true">
        印
      </span>
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Sign in to {action}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          Your work is saved to your account and stays private to you. You can
          keep browsing every tool without signing in.
        </p>
      </div>
      <Button
        type="button"
        onClick={login}
        disabled={isLoggingIn}
        data-ocid="signin.button"
        className="rounded-sm shadow-stamp"
      >
        {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
      </Button>
    </div>
  );
}
