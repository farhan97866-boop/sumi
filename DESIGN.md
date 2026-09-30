# Design Brief

## Direction

Sumi (墨) — a Japanese ink-and-paper study desk where every tool (calculator, converter, chess, carrom, karuta, kana/kanji, Chinese characters, notes) sits as a labeled tray on one warm-paper workbench.

## Tone

Editorial print workshop: warm rice-paper light theme, sumi-ink typography, hairline rules, and a single vermillion seal accent — restrained but unmistakably crafted.

## Differentiation

A woodblock "seal" motif: the vermillion hanko square marks the active tool, the app wordmark, and every confirmation state, so the whole suite feels stamped by one hand.

## Color Palette

| Token      | OKLCH          | Role                                     |
| ---------- | -------------- | ---------------------------------------- |
| background | 0.965 0.016 82 | warm rice-paper page ground              |
| foreground | 0.185 0.02 50  | sumi ink text                            |
| card       | 0.995 0.006 82 | raised paper tray surface                |
| primary    | 0.575 0.216 32 | vermillion seal — CTAs, active nav       |
| accent     | 0.36 0.09 265  | ai-indigo — links, secondary highlights  |
| muted      | 0.935 0.02 82  | recessed panels, inert fills            |
| board      | 0.86 0.052 74  | goban / carrom kaya-wood bed             |
| cardface   | 0.985 0.012 84 | karuta & flashcard paper face            |
| ink-wash   | 0.92 0.018 80  | wells: calc display, note editor, inputs |

## Typography

- Display: Fraunces — wordmark, page titles, section headings, card titles, kana/kanji glyph faces
- Body: General Sans — UI labels, body copy, tables, navigation
- Mono: JetBrains Mono — calculator display, currency figures, move notation, scores, timers
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-[0.18em] uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Flat paper with hairline borders; depth comes from `shadow-subtle` on trays and `shadow-elevated` on hover/overlays, never from heavy blur.

## Structural Zones

| Zone    | Background    | Border   | Notes                                                       |
| ------- | ------------- | -------- | ----------------------------------------------------------- |
| Header  | bg-card       | border-b | wordmark + seal, tool search, theme toggle, mobile menu     |
| Sidebar | bg-sidebar    | border-r | tool index; active row = primary left-rule + hanko seal     |
| Content | bg-background | —        | `bg-muted/30` on alternate sections, `rule-grid` on dashboard |
| Footer  | bg-muted/40   | border-t | tool count, keyboard hints, build stamp                     |

## Spacing & Rhythm

Dense productivity rhythm: 4/8/12px micro gaps inside tools, 16–24px card padding, 32–48px between page sections; content max-width 1400px centered.

## Dashboard & Tool Layouts

- Dashboard: `rule-grid` ground; tool-card grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, each card = hairline top rule, seal chip icon, Fraunces title, one-line description, mono shortcut hint.
- Tool shell: two-zone — a sticky tool toolbar (title + primary actions) over a `bg-card` work surface; panels use `bg-ink-wash` wells.
- Calculator: mono display well on `bg-ink-wash`, 4-col keypad, operator keys `secondary`, `=` uses `bg-gradient-primary` + `shadow-stamp`, history rail `bg-muted/40`.
- Currency: amount input mono `text-3xl`, from/to selectors with a square swap control, live rate line with `animate-seal-pulse` dot, `success`/`destructive` inline validation.
- Chess / Carrom: board centered on `bg-board` with `board-lines` lattice; captured pieces and move list in a right rail (`font-mono` notation); status line uses `success`/`warning`/`destructive` chips.
- Karuta / Kana / Kanji / Chinese: study grid of `bg-cardface` tiles, large `glyph-face` character, romaji/pinyin in mono; flashcard uses `flip-scene`/`flip-inner` 3D flip; progress bars per script.
- Notes: list rail (`bg-sidebar`) + editor surface with `bg-ink-wash` body, pinned notes marked with a small seal; autosave status in `muted-foreground`.

## Component Patterns

- Buttons: 2px radius, primary = solid vermillion with `shadow-stamp`, secondary = bordered paper, ghost for toolbars; hover shifts one lightness step + 150ms
- Cards: 2px radius, `bg-card`, 1px `border-border`, `shadow-subtle` → `shadow-elevated` on hover, hairline top rule on tool cards
- Badges: pill-free — small square seal chips with uppercase tracked labels; success/warning/destructive tokens for state
- Inputs: 2px radius, `bg-ink-wash` well, `border-input`, focus ring = `ring`

## Motion

- Entrance: `animate-fade-in` staggered 40ms per grid card on tool switch
- Hover: border darkens to `ring/40`, shadow lifts, 150ms ease-out
- Decorative: `animate-stamp-in` on confirmations and game-over banners, `animate-seal-pulse` on the live rate indicator, card flip 500ms cubic-bezier

## Constraints

- Token-only styling — no hex, rgb(), or arbitrary Tailwind color classes
- Light theme primary; `.dark` is a tuned ink-night variant, not an inversion
- Sharp 2px radii and hairline rules everywhere; no rounded-lg default look
- Density over decoration — this is a productivity suite, not a landing page

## Signature Detail

The hanko seal square — a 2px-radius vermillion block with the tool's initial in Fraunces — stamps the active nav row, the wordmark, and every success state, giving the suite a single handmade identity.
