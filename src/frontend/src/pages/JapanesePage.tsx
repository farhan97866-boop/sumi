import { createActor } from "@/backend";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useIdentity } from "@/hooks/use-identity";
import {
  type KanaEntry,
  SCRIPT_SETS,
  type ScriptId,
  type ScriptSet,
  getScriptSet,
} from "@/lib/japanese-data";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Backend hooks — per-character learned progress for the signed-in user */
/* ------------------------------------------------------------------ */

function useJapaneseLearned(setId: ScriptId) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["japanese", "learned", setId],
    queryFn: async () => {
      if (!actor) return [] as string[];
      return actor.getJapaneseLearned(setId);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Learned counts for every script, so the summary reflects real progress. */
function useJapaneseLearnedCounts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["japanese", "learned", "counts"],
    queryFn: async () => {
      const counts: Record<ScriptId, number> = {
        hiragana: 0,
        katakana: 0,
        kanji: 0,
      };
      if (!actor) return counts;
      const results = await Promise.all(
        SCRIPT_SETS.map(async (set) => {
          const learned = await actor.getJapaneseLearned(set.id);
          return [set.id, learned.length] as const;
        }),
      );
      for (const [id, count] of results) {
        counts[id] = count;
      }
      return counts;
    },
    enabled: !!actor && !isFetching,
  });
}

function useMarkJapaneseLearned(setId: ScriptId) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      character,
      learned,
    }: {
      character: string;
      learned: boolean;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.markJapaneseLearned(setId, character, learned);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["japanese", "learned", setId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["japanese", "learned", "counts"],
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Reference chart                                                     */
/* ------------------------------------------------------------------ */

function ReferenceChart({
  set,
  learned,
  onToggle,
  canPersist,
}: {
  set: ScriptSet;
  learned: Set<string>;
  onToggle: (entry: KanaEntry) => void;
  canPersist: boolean;
}) {
  return (
    <div
      data-ocid={`japanese.chart.${set.id}`}
      className="grid grid-cols-3 gap-px border border-border bg-border sm:grid-cols-5 lg:grid-cols-8"
    >
      {set.entries.map((entry) => {
        const isLearned = learned.has(entry.character);
        return (
          <button
            key={entry.character}
            type="button"
            onClick={() => onToggle(entry)}
            disabled={!canPersist}
            aria-pressed={isLearned}
            aria-label={`${entry.character} — ${entry.romaji}, ${entry.meaning}. ${
              isLearned ? "Marked learned" : "Not yet learned"
            }`}
            data-ocid={`japanese.chart_cell.${set.id}.${entry.character}`}
            className={cn(
              "group relative flex flex-col items-center gap-1 bg-card px-2 py-3 text-center transition-smooth",
              canPersist ? "hover:bg-secondary" : "cursor-default opacity-90",
              isLearned && "bg-primary/10",
            )}
          >
            {isLearned ? (
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : null}
            <span className="glyph-face text-3xl text-foreground">
              {entry.character}
            </span>
            <span className="font-mono text-[0.7rem] text-muted-foreground">
              {entry.romaji}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Flashcard practice                                                  */
/* ------------------------------------------------------------------ */

function Flashcard({
  entry,
  flipped,
  onFlip,
}: {
  entry: KanaEntry;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="flip-scene mx-auto w-full max-w-sm">
      <button
        type="button"
        onClick={onFlip}
        aria-label={
          flipped
            ? `Answer: ${entry.romaji}, ${entry.meaning}. Tap to hide.`
            : "Flashcard. Tap to reveal the answer."
        }
        data-ocid="japanese.flashcard"
        className="relative block h-64 w-full text-left"
      >
        <span
          className={cn("flip-inner absolute inset-0", flipped && "is-flipped")}
        >
          {/* front — the character */}
          <span className="flip-face flex h-64 flex-col items-center justify-center gap-3 border border-border bg-cardface shadow-subtle">
            <span className="glyph-face text-8xl text-cardface-foreground">
              {entry.character}
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              Tap to reveal
            </span>
          </span>
          {/* back — the answer */}
          <span className="flip-face flip-back flex h-64 flex-col items-center justify-center gap-2 border border-border bg-card shadow-subtle">
            <span className="font-display text-4xl font-semibold tracking-tight">
              {entry.romaji}
            </span>
            <span className="text-sm text-muted-foreground">
              {entry.meaning}
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress summary                                                    */
/* ------------------------------------------------------------------ */

function ProgressSummary({
  set,
  learnedCount,
  loading,
}: {
  set: ScriptSet;
  learnedCount: number;
  loading: boolean;
}) {
  const total = set.entries.length;
  const percent = total === 0 ? 0 : Math.round((learnedCount / total) * 100);
  return (
    <div
      data-ocid={`japanese.progress.${set.id}`}
      className="border border-border bg-card p-4 shadow-subtle"
    >
      <div className="flex items-center gap-2">
        <span className="seal size-7 text-sm" aria-hidden="true">
          {set.seal}
        </span>
        <h3 className="font-display text-sm font-semibold tracking-tight">
          {set.name}
        </h3>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {loading ? "—" : `${learnedCount}/${total}`}
        </span>
      </div>
      <Progress
        value={loading ? 0 : percent}
        className="mt-3 h-1.5 rounded-sm"
        aria-label={`${set.name} progress`}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {loading
          ? "Loading progress…"
          : `${percent}% learned · ${total - learnedCount} remaining`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type Mode = "chart" | "practice";

export function JapanesePage() {
  const { isAuthenticated, isInitializing } = useIdentity();
  const [activeId, setActiveId] = useState<ScriptId>("hiragana");
  const [mode, setMode] = useState<Mode>("chart");

  const activeSet = useMemo(() => getScriptSet(activeId), [activeId]);

  const learnedQuery = useJapaneseLearned(activeId);
  const learnedCountsQuery = useJapaneseLearnedCounts();
  const markLearned = useMarkJapaneseLearned(activeId);

  const learned = useMemo(
    () => new Set(learnedQuery.data ?? []),
    [learnedQuery.data],
  );

  const toggleLearned = useCallback(
    (entry: KanaEntry) => {
      if (!isAuthenticated) return;
      markLearned.mutate({
        character: entry.character,
        learned: !learned.has(entry.character),
      });
    },
    [isAuthenticated, learned, markLearned],
  );

  /* ---- practice deck ---- */
  const [deck, setDeck] = useState<KanaEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [session, setSession] = useState({ correct: 0, incorrect: 0 });

  const buildDeck = useCallback((set: ScriptSet, shuffle: boolean) => {
    const entries = [...set.entries];
    if (shuffle) {
      for (let i = entries.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [entries[i], entries[j]] = [entries[j], entries[i]];
      }
    }
    setDeck(entries);
    setIndex(0);
    setFlipped(false);
    setSession({ correct: 0, incorrect: 0 });
  }, []);

  // Rebuild the deck whenever the active script changes.
  useEffect(() => {
    buildDeck(activeSet, false);
  }, [activeSet, buildDeck]);

  const current = deck[index];
  const isLast = index >= deck.length - 1;

  const grade = useCallback(
    (correct: boolean) => {
      if (!current) return;
      setSession((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
      if (isAuthenticated) {
        markLearned.mutate({ character: current.character, learned: correct });
      }
      setFlipped(false);
      setIndex((prev) => Math.min(prev + 1, deck.length));
    },
    [current, deck.length, isAuthenticated, markLearned],
  );

  const restart = useCallback(
    () => buildDeck(activeSet, true),
    [activeSet, buildDeck],
  );

  const finished = deck.length > 0 && index >= deck.length;

  return (
    <div className="rule-grid-fine min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        {/* ---- header ---- */}
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Study
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Japanese Letters
            </h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Hiragana · Katakana · Kanji
          </p>
        </header>

        {/* ---- script selector + mode toggle ---- */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Script"
            className="flex flex-wrap gap-1 border border-border bg-card p-1"
          >
            {SCRIPT_SETS.map((set) => (
              <button
                key={set.id}
                type="button"
                role="tab"
                aria-selected={activeId === set.id}
                data-ocid={`japanese.script_tab.${set.id}`}
                onClick={() => setActiveId(set.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm transition-smooth",
                  activeId === set.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span className="font-display" aria-hidden="true">
                  {set.seal}
                </span>
                {set.name}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1 border border-border bg-card p-1">
            <button
              type="button"
              aria-pressed={mode === "chart"}
              data-ocid="japanese.mode.chart"
              onClick={() => setMode("chart")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-smooth",
                mode === "chart"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BookOpen className="size-3.5" />
              Chart
            </button>
            <button
              type="button"
              aria-pressed={mode === "practice"}
              data-ocid="japanese.mode.practice"
              onClick={() => setMode("practice")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-smooth",
                mode === "practice"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Shuffle className="size-3.5" />
              Practice
            </button>
          </div>
        </div>

        {/* ---- sign-in notice ---- */}
        {!isInitializing && !isAuthenticated ? (
          <div className="mt-4">
            <SignInPrompt action="save your learned characters" compact />
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {/* ---- main work surface ---- */}
          <section
            data-ocid="japanese.panel"
            className="border border-border bg-card p-4 shadow-subtle sm:p-5"
          >
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="font-display text-lg" aria-hidden="true">
                {activeSet.japaneseName}
              </span>
              <h2 className="font-display text-base font-semibold tracking-tight">
                {activeSet.name}
              </h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {activeSet.entries.length} characters
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground text-pretty">
              {activeSet.description}
            </p>

            {mode === "chart" ? (
              <div className="mt-4">
                {learnedQuery.isLoading ? (
                  <div
                    data-ocid="japanese.chart.loading_state"
                    className="grid grid-cols-3 gap-px border border-border bg-border sm:grid-cols-5 lg:grid-cols-8"
                  >
                    {Array.from(
                      { length: 24 },
                      (_, i) => `chart-skeleton-${i}`,
                    ).map((id) => (
                      <Skeleton key={id} className="h-20 rounded-none" />
                    ))}
                  </div>
                ) : (
                  <ReferenceChart
                    set={activeSet}
                    learned={learned}
                    onToggle={toggleLearned}
                    canPersist={isAuthenticated}
                  />
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {isAuthenticated
                    ? "Tap any character to mark it learned or not learned."
                    : "Sign in to mark characters as learned and track progress."}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                {finished ? (
                  <div
                    data-ocid="japanese.practice.success_state"
                    className="flex flex-col items-center gap-4 border border-border bg-cardface px-6 py-12 text-center"
                  >
                    <span className="seal size-12 text-xl" aria-hidden="true">
                      了
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-xl font-semibold tracking-tight">
                        Deck complete
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {session.correct} correct · {session.incorrect}{" "}
                        incorrect out of {deck.length}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={restart}
                      data-ocid="japanese.practice.restart_button"
                      className="rounded-sm shadow-stamp"
                    >
                      <RotateCcw className="size-4" />
                      Shuffle &amp; restart
                    </Button>
                  </div>
                ) : current ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                      <span>
                        Card {(index + 1).toString().padStart(2, "0")} /{" "}
                        {deck.length.toString().padStart(2, "0")}
                      </span>
                      <span>
                        <span className="text-success">{session.correct}</span>
                        {" · "}
                        <span className="text-destructive">
                          {session.incorrect}
                        </span>
                      </span>
                    </div>

                    <Flashcard
                      entry={current}
                      flipped={flipped}
                      onFlip={() => setFlipped((prev) => !prev)}
                    />

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFlipped(false);
                          setIndex((prev) => Math.max(prev - 1, 0));
                        }}
                        disabled={index === 0}
                        data-ocid="japanese.practice.prev_button"
                        className="rounded-sm"
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => grade(false)}
                        data-ocid="japanese.practice.incorrect_button"
                        className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-4" />
                        Incorrect
                      </Button>
                      <Button
                        type="button"
                        onClick={() => grade(true)}
                        data-ocid="japanese.practice.correct_button"
                        className="rounded-sm shadow-stamp"
                      >
                        <Check className="size-4" />
                        Correct
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setFlipped(false);
                          setIndex((prev) => Math.min(prev + 1, deck.length));
                        }}
                        disabled={isLast}
                        data-ocid="japanese.practice.next_button"
                        className="rounded-sm"
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                      {isAuthenticated
                        ? "Grading a card also updates your learned progress."
                        : "Sign in to save your answers as learned progress."}
                    </p>
                  </div>
                ) : (
                  <div
                    data-ocid="japanese.practice.empty_state"
                    className="flex flex-col items-center gap-3 border border-border bg-cardface px-6 py-12 text-center"
                  >
                    <Shuffle className="size-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No cards in this deck yet.
                    </p>
                    <Button
                      type="button"
                      onClick={restart}
                      data-ocid="japanese.practice.start_button"
                      className="rounded-sm shadow-stamp"
                    >
                      Start practice
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ---- progress summary ---- */}
          <aside
            data-ocid="japanese.progress_panel"
            className="flex flex-col gap-4"
          >
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Progress
            </h2>
            {SCRIPT_SETS.map((set) => {
              const isActive = set.id === activeId;
              const count = isActive
                ? learned.size
                : (learnedCountsQuery.data?.[set.id] ?? 0);
              const loading = isActive
                ? learnedQuery.isLoading
                : learnedCountsQuery.isLoading;
              return (
                <ProgressSummary
                  key={set.id}
                  set={set}
                  learnedCount={count}
                  loading={loading}
                />
              );
            })}
            <p className="text-xs text-muted-foreground text-pretty">
              Progress is saved to your account per character. Switch scripts to
              review each set.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
