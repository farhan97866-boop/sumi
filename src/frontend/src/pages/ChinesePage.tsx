import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIdentity } from "@/hooks/use-identity";
import {
  useChineseLearned,
  useChineseProgress,
  useMarkChineseLearned,
} from "@/hooks/useQueries";
import {
  CHINESE_CHARACTERS,
  CHINESE_TOTAL,
  type ChineseCharacter,
} from "@/lib/chinese-data";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  RotateCcw,
  Search,
  Table2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Mode = "reference" | "practice";

/** A single row in the reference table. */
function ReferenceRow({
  entry,
  index,
  learned,
  canSave,
  onToggle,
  pending,
}: {
  entry: ChineseCharacter;
  index: number;
  learned: boolean;
  canSave: boolean;
  onToggle: (character: string, learned: boolean) => void;
  pending: boolean;
}) {
  return (
    <tr
      data-ocid={`chinese.row.${index + 1}`}
      className={cn(
        "border-b border-border transition-colors",
        learned ? "bg-success/5" : "hover:bg-secondary/50",
      )}
    >
      <td className="px-3 py-2">
        <span className="glyph-face text-2xl">{entry.character}</span>
      </td>
      <td className="px-3 py-2 font-mono text-sm text-accent">
        {entry.pinyin}
      </td>
      <td className="px-3 py-2 text-sm text-foreground">{entry.meaning}</td>
      <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
        {entry.strokes}
      </td>
      <td className="px-3 py-2 text-right">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canSave || pending}
          aria-pressed={learned}
          aria-label={
            learned
              ? `Mark ${entry.character} as not learned`
              : `Mark ${entry.character} as learned`
          }
          data-ocid={`chinese.toggle_button.${index + 1}`}
          onClick={() => onToggle(entry.character, !learned)}
          className={cn(
            "rounded-sm",
            learned
              ? "text-success hover:text-success"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {learned ? (
            <>
              <Check className="size-3.5" />
              Learned
            </>
          ) : (
            "Mark"
          )}
        </Button>
      </td>
    </tr>
  );
}

export function ChinesePage() {
  const { isAuthenticated, isInitializing } = useIdentity();
  const learnedQuery = useChineseLearned();
  const progressQuery = useChineseProgress();
  const markLearned = useMarkChineseLearned();

  const [mode, setMode] = useState<Mode>("reference");
  const [query, setQuery] = useState("");
  const [deckIndex, setDeckIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const learnedSet = useMemo(
    () => new Set(learnedQuery.data ?? []),
    [learnedQuery.data],
  );

  const learnedCount = Number(progressQuery.data ?? 0n);
  const percent =
    CHINESE_TOTAL > 0 ? Math.round((learnedCount / CHINESE_TOTAL) * 100) : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return CHINESE_CHARACTERS;
    return CHINESE_CHARACTERS.filter(
      (entry) =>
        entry.character.includes(q) ||
        entry.pinyin.toLowerCase().includes(q) ||
        entry.meaning.toLowerCase().includes(q),
    );
  }, [query]);

  const deck = CHINESE_CHARACTERS;
  const current = deck[deckIndex % deck.length];

  function toggleLearned(character: string, learned: boolean) {
    if (!isAuthenticated) return;
    markLearned.mutate({ character, learned });
  }

  function grade(learned: boolean) {
    if (isAuthenticated) {
      markLearned.mutate({ character: current.character, learned });
    }
    setFlipped(false);
    setDeckIndex((index) => (index + 1) % deck.length);
  }

  function step(delta: number) {
    setFlipped(false);
    setDeckIndex((index) => (index + delta + deck.length) % deck.length);
  }

  const canSave = isAuthenticated && !isInitializing;

  return (
    <div className="rule-grid-fine min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Study
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Chinese Letters
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground text-pretty">
              Browse common Hanzi with pinyin and meaning, then drill them as
              flashcards. Progress saves to your account.
            </p>
          </div>
          <div
            data-ocid="chinese.progress_summary"
            className="flex items-center gap-3 border border-border bg-card px-4 py-2 shadow-subtle"
          >
            <span className="seal size-8 text-sm" aria-hidden="true">
              漢
            </span>
            <div>
              <p className="font-mono text-lg font-semibold tabular-nums leading-none">
                {learnedCount}
                <span className="text-muted-foreground">/{CHINESE_TOTAL}</span>
              </p>
              <p className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                Learned · {percent}%
              </p>
            </div>
          </div>
        </header>

        {/* ---- Progress bar ---- */}
        <Progress
          value={percent}
          aria-label="Chinese characters learned"
          data-ocid="chinese.progress_bar"
          className="mt-4 h-1.5 rounded-none bg-muted"
        />

        {!canSave ? (
          <div className="mt-4">
            <SignInPrompt action="save your Chinese study progress" compact />
          </div>
        ) : null}

        {/* ---- Mode switch ---- */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-border bg-card p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={mode === "reference"}
              data-ocid="chinese.reference.tab"
              onClick={() => setMode("reference")}
              className={cn(
                "rounded-sm",
                mode === "reference"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Table2 className="size-4" />
              Reference
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={mode === "practice"}
              data-ocid="chinese.practice.tab"
              onClick={() => setMode("practice")}
              className={cn(
                "rounded-sm",
                mode === "practice"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Layers className="size-4" />
              Flashcards
            </Button>
          </div>

          {mode === "reference" ? (
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search character, pinyin, or meaning"
                aria-label="Search Chinese characters"
                data-ocid="chinese.search_input"
                className="h-9 w-full border border-input bg-card pl-9 pr-3 text-sm outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-ring"
              />
            </div>
          ) : null}
        </div>

        {mode === "reference" ? (
          <section
            data-ocid="chinese.reference.panel"
            className="mt-4 border border-border bg-card shadow-subtle"
          >
            {filtered.length === 0 ? (
              <div
                data-ocid="chinese.empty_state"
                className="flex flex-col items-center gap-2 px-6 py-16 text-center"
              >
                <Search className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-pretty">
                  No characters match “{query}”. Try a different pinyin or
                  meaning.
                </p>
              </div>
            ) : (
              <div className="max-h-[36rem] overflow-y-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-border text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="px-3 py-2 font-semibold">
                        Character
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        Pinyin
                      </th>
                      <th scope="col" className="px-3 py-2 font-semibold">
                        Meaning
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-semibold"
                      >
                        Strokes
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-semibold"
                      >
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, index) => (
                      <ReferenceRow
                        key={entry.character}
                        entry={entry}
                        index={index}
                        learned={learnedSet.has(entry.character)}
                        canSave={canSave}
                        onToggle={toggleLearned}
                        pending={markLearned.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section
            data-ocid="chinese.practice.panel"
            className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
          >
            {/* ---- Flashcard ---- */}
            <div className="flex flex-col items-center">
              <div className="flip-scene w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setFlipped((value) => !value)}
                  aria-label={
                    flipped
                      ? `Hide answer for ${current.character}`
                      : `Reveal answer for ${current.character}`
                  }
                  data-ocid="chinese.flashcard"
                  className="relative block h-72 w-full cursor-pointer text-left"
                >
                  <div
                    className={cn(
                      "flip-inner h-full w-full",
                      flipped && "is-flipped",
                    )}
                  >
                    {/* Front — the glyph */}
                    <div className="flip-face flex h-full w-full flex-col items-center justify-center border border-border bg-cardface shadow-elevated">
                      <span className="glyph-face text-8xl">
                        {current.character}
                      </span>
                      <span className="mt-4 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        Tap to reveal
                      </span>
                    </div>
                    {/* Back — pinyin + meaning */}
                    <div className="flip-face flip-back flex h-full w-full flex-col items-center justify-center border border-border bg-card px-6 text-center shadow-elevated">
                      <span className="font-mono text-3xl font-semibold text-accent">
                        {current.pinyin}
                      </span>
                      <span className="mt-3 text-lg text-foreground">
                        {current.meaning}
                      </span>
                      <span className="mt-4 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        {current.strokes} strokes
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              {/* ---- Self-grade controls ---- */}
              <div className="mt-5 flex w-full max-w-md items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Previous card"
                  data-ocid="chinese.pagination_prev"
                  onClick={() => step(-1)}
                  className="rounded-sm border border-border"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSave || markLearned.isPending}
                  data-ocid="chinese.incorrect_button"
                  onClick={() => grade(false)}
                  className="flex-1 rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                  Still learning
                </Button>
                <Button
                  type="button"
                  disabled={!canSave || markLearned.isPending}
                  data-ocid="chinese.correct_button"
                  onClick={() => grade(true)}
                  className="flex-1 rounded-sm shadow-stamp"
                >
                  <Check className="size-4" />I know it
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Next card"
                  data-ocid="chinese.pagination_next"
                  onClick={() => step(1)}
                  className="rounded-sm border border-border"
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <p className="mt-3 font-mono text-xs text-muted-foreground">
                Card {(deckIndex + 1).toString().padStart(2, "0")} /{" "}
                {deck.length.toString().padStart(2, "0")}
              </p>
            </div>

            {/* ---- Deck sidebar ---- */}
            <aside className="border border-border bg-card shadow-subtle">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Layers className="size-4 text-muted-foreground" />
                <h2 className="font-display text-sm font-semibold tracking-tight">
                  Deck
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Restart deck"
                  data-ocid="chinese.restart_button"
                  onClick={() => {
                    setDeckIndex(0);
                    setFlipped(false);
                  }}
                  className="ml-auto rounded-sm text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  Restart
                </Button>
              </div>
              <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto">
                {deck.map((entry, index) => {
                  const isLearned = learnedSet.has(entry.character);
                  const isCurrent = index === deckIndex;
                  return (
                    <li key={entry.character}>
                      <button
                        type="button"
                        data-ocid={`chinese.deck_item.${index + 1}`}
                        onClick={() => {
                          setDeckIndex(index);
                          setFlipped(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                          isCurrent ? "bg-secondary" : "hover:bg-secondary/50",
                        )}
                      >
                        <span className="glyph-face text-xl">
                          {entry.character}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                          {entry.pinyin}
                        </span>
                        {isLearned ? (
                          <Check className="size-3.5 shrink-0 text-success" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
