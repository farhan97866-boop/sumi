import { Button } from "@/components/ui/button";
import {
  KARUTA_CARDS,
  type KarutaCard,
  ROUND_SIZE,
  buildRound,
  shuffle,
} from "@/lib/karuta";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  ScrollText,
  Target,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Mode = "practice" | "browse";

interface Round {
  reading: KarutaCard;
  choices: KarutaCard[];
}

interface Feedback {
  cardId: string;
  correct: boolean;
}

function makeRound(): Round {
  return buildRound(KARUTA_CARDS, ROUND_SIZE);
}

/** A single poem card face — the torifuda the player grabs. */
function MatchCard({
  card,
  index,
  feedback,
  disabled,
  onPick,
}: {
  card: KarutaCard;
  index: number;
  feedback: Feedback | null;
  disabled: boolean;
  onPick: (card: KarutaCard) => void;
}) {
  const isPicked = feedback?.cardId === card.id;
  const isCorrect = isPicked && feedback?.correct === true;
  const isWrong = isPicked && feedback?.correct === false;

  return (
    <button
      type="button"
      onClick={() => onPick(card)}
      disabled={disabled}
      data-ocid={`karuta.choice.${index + 1}`}
      aria-label={`Card ${card.number}: ${card.match}`}
      className={cn(
        "group relative flex min-h-[7.5rem] flex-col justify-between border bg-cardface p-3 text-left transition-smooth",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCorrect && "border-success ring-2 ring-success",
        isWrong && "border-destructive ring-2 ring-destructive",
        !isPicked &&
          !disabled &&
          "border-border hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-elevated",
        disabled && !isPicked && "opacity-55",
      )}
    >
      <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
        {card.number.toString().padStart(3, "0")}
      </span>
      <span className="writing-vertical mx-auto my-1 font-display text-lg leading-relaxed text-cardface-foreground">
        {card.match}
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[0.6rem] text-muted-foreground">
          {card.romaji}
        </span>
        {isCorrect ? (
          <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
        ) : null}
        {isWrong ? (
          <X className="size-4 shrink-0 text-destructive" aria-hidden="true" />
        ) : null}
      </span>
    </button>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Target;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border border-border bg-card px-3 py-2 shadow-subtle">
      <Icon
        className={cn(
          "size-4 shrink-0",
          accent ? "text-primary" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-lg font-semibold leading-tight tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function PracticeMode() {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const nextRound = useCallback(() => {
    setRound(makeRound());
    setFeedback(null);
  }, []);

  const handlePick = useCallback(
    (card: KarutaCard) => {
      if (feedback) return;
      const correct = card.id === round.reading.id;
      setFeedback({ cardId: card.id, correct });
      setAttempts((n) => n + 1);
      if (correct) {
        setScore((n) => n + 1);
        setStreak((n) => {
          const next = n + 1;
          setBestStreak((best) => Math.max(best, next));
          return next;
        });
      } else {
        setStreak(0);
      }
    },
    [feedback, round.reading.id],
  );

  const resetSession = useCallback(() => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAttempts(0);
    setRound(makeRound());
    setFeedback(null);
  }, []);

  const accuracy =
    attempts === 0 ? "—" : `${Math.round((score / attempts) * 100)}%`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Score" value={String(score)} icon={Target} accent />
        <StatTile
          label="Streak"
          value={String(streak)}
          icon={Flame}
          accent={streak > 0}
        />
        <StatTile label="Best" value={String(bestStreak)} icon={ScrollText} />
        <StatTile label="Accuracy" value={accuracy} icon={Check} />
      </div>

      <section
        data-ocid="karuta.reading_panel"
        className="border border-border bg-card shadow-subtle"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            Reading card · 読み札
          </span>
          <span className="font-mono text-[0.65rem] text-muted-foreground">
            #{round.reading.number.toString().padStart(3, "0")}
          </span>
        </div>
        <div className="bg-ink-wash px-4 py-6 sm:px-8 sm:py-8">
          <p className="text-center font-display text-xl leading-relaxed tracking-wide text-foreground sm:text-2xl">
            {round.reading.reading}
          </p>
          <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
            {round.reading.poet}
          </p>
        </div>
      </section>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Grab the matching card
          </h2>
          <span className="font-mono text-[0.65rem] text-muted-foreground">
            {ROUND_SIZE} cards
          </span>
        </div>
        <div
          data-ocid="karuta.choice_grid"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {round.choices.map((card, index) => (
            <MatchCard
              key={card.id}
              card={card}
              index={index}
              feedback={feedback}
              disabled={feedback !== null}
              onPick={handlePick}
            />
          ))}
        </div>
      </div>

      <div
        className="flex min-h-[3.25rem] flex-wrap items-center gap-3 border border-border bg-card px-4 py-3 shadow-subtle"
        aria-live="polite"
      >
        {feedback === null ? (
          <p className="text-sm text-muted-foreground">
            Read the poem, then choose the card that carries its lower verse.
          </p>
        ) : feedback.correct ? (
          <>
            <span
              className="seal size-7 animate-stamp-in text-sm"
              aria-hidden="true"
            >
              正
            </span>
            <p
              data-ocid="karuta.success_state"
              className="text-sm font-medium text-success"
            >
              Correct — {round.reading.meaning}
            </p>
            <Button
              type="button"
              size="sm"
              onClick={nextRound}
              data-ocid="karuta.next_button"
              className="ml-auto rounded-sm shadow-stamp"
            >
              Next card
              <ChevronRight className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <span
              className="seal size-7 bg-destructive text-sm"
              aria-hidden="true"
            >
              誤
            </span>
            <p
              data-ocid="karuta.error_state"
              className="text-sm font-medium text-destructive"
            >
              Not quite — the card was{" "}
              <span className="font-display">{round.reading.match}</span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={nextRound}
              data-ocid="karuta.next_button"
              className="ml-auto rounded-sm"
            >
              Next card
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetSession}
          data-ocid="karuta.reset_button"
          className="rounded-sm text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-4" />
          Reset session
        </Button>
      </div>
    </div>
  );
}

function BrowseMode() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KARUTA_CARDS;
    return KARUTA_CARDS.filter(
      (card) =>
        card.match.includes(q) ||
        card.reading.includes(q) ||
        card.romaji.toLowerCase().includes(q) ||
        card.poet.toLowerCase().includes(q) ||
        card.meaning.toLowerCase().includes(q),
    );
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="karuta-search" className="sr-only">
          Search the deck
        </label>
        <input
          id="karuta-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search verse, poet, or romaji…"
          data-ocid="karuta.search_input"
          className="h-9 w-full max-w-sm rounded-sm border border-input bg-ink-wash px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="font-mono text-xs text-muted-foreground">
          {filtered.length} / {KARUTA_CARDS.length} cards
        </span>
      </div>

      {visible.length === 0 ? (
        <div
          data-ocid="karuta.empty_state"
          className="flex flex-col items-center gap-2 border border-dashed border-border bg-card px-6 py-12 text-center"
        >
          <ScrollText
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="font-display text-base font-semibold">
            No cards match “{query}”
          </p>
          <p className="text-sm text-muted-foreground">
            Try a poet name, a romaji fragment, or clear the search.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setPage(0);
            }}
            data-ocid="karuta.clear_search_button"
            className="mt-1 rounded-sm"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div
          data-ocid="karuta.deck_list"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {visible.map((card, index) => (
            <article
              key={card.id}
              data-ocid={`karuta.deck_item.${index + 1}`}
              className="flex flex-col border border-border bg-card shadow-subtle transition-smooth hover:shadow-elevated"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  #{card.number.toString().padStart(3, "0")}
                </span>
                <span className="truncate font-mono text-[0.65rem] text-muted-foreground">
                  {card.poet}
                </span>
              </div>
              <div className="flex flex-1 gap-3 p-3">
                <div className="flex-1">
                  <p className="font-display text-sm leading-relaxed text-foreground">
                    {card.reading}
                  </p>
                  <p className="mt-2 border-t border-border pt-2 font-display text-sm text-primary">
                    {card.match}
                  </p>
                </div>
              </div>
              <div className="border-t border-border px-3 py-2">
                <p className="font-mono text-[0.65rem] text-muted-foreground">
                  {card.romaji}
                </p>
                <p className="mt-1 text-xs text-muted-foreground text-pretty">
                  {card.meaning}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            data-ocid="karuta.pagination_prev"
            className="rounded-sm"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            Page {safePage + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            data-ocid="karuta.pagination_next"
            className="rounded-sm"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function KarutaPage() {
  const [mode, setMode] = useState<Mode>("practice");

  useEffect(() => {
    document.title = "Karuta · Sumi";
  }, []);

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Games · 遊
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Karuta
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
              A reading card shows a Hyakunin Isshu poem — grab the card that
              carries its lower verse before the deck runs out.
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Karuta mode"
            className="flex border border-border bg-card p-0.5 shadow-subtle"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "practice"}
              onClick={() => setMode("practice")}
              data-ocid="karuta.mode.tab"
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm transition-smooth",
                mode === "practice"
                  ? "bg-primary text-primary-foreground shadow-stamp"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Practice
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "browse"}
              onClick={() => setMode("browse")}
              data-ocid="karuta.browse.tab"
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm transition-smooth",
                mode === "browse"
                  ? "bg-primary text-primary-foreground shadow-stamp"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Browse deck
            </button>
          </div>
        </header>

        <div className="mt-6">
          {mode === "practice" ? <PracticeMode /> : <BrowseMode />}
        </div>
      </div>
    </div>
  );
}
