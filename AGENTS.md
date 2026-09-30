# Project Guidance

## User Preferences

- Single app bundling calculator, currency converter, chess, carrom, karuta, Japanese letters, Chinese letters, and notes
- Productivity-tool information density; clear navigation hierarchy
- Responsive: multi-column grid on desktop, single column with collapsible menu on mobile

## Verified Commands

- **typecheck**: `mops check --fix`
- **build**: `mops build`

## Learnings

- TanStack Router code-based routing: every tool path in lib/tools.ts needs a matching createRoute in App.tsx; a defined page component alone is not enough.
- Castling SAN must branch on the king's destination file (g-file = O-O, c-file = O-O-O); both castling moves set castleRookFrom.
- Per-script progress summaries need a separate all-scripts query; deriving counts only from the active script's learned set silently zeroes the others.
- Motoko has no triple-quoted string literals; multi-line doc strings must be adjacent literals joined with # and explicit \n escapes.
- With migrations check-limit = 1, a build may add at most one pending migration; fold an earlier scaffolded migration into the latest pending file.
- Biome rejects string concatenation in favor of template literals, and noArrayIndexKey flags any key expression containing the map index.
- react-quill-new 3.4.6 works with React 19; import its snow CSS and style via a wrapper class overriding .ql-toolbar/.ql-container/.ql-editor with oklch tokens.
- ExchangeRate-API Open Access (https://open.er-api.com/v6/latest/{BASE}) is a verified no-key rate source returning all currencies in one call.
- Vitest + Testing Library tests need jest-dom matchers registered in a setup file and its types included in tsconfig, or tsc --noEmit fails on toBeInTheDocument/toHaveTextContent.
- tsc --noEmit does not read vitest.setup.ts; register jest-dom matcher types with a src/*.d.ts containing /// <reference types="@testing-library/jest-dom/vitest" /> so vitest's Assertion is augmented.
- The PocketIC backend lane runs the real compiled canister through generated declarations; a transient pocketic_sidecar_unreachable withdraws the run and a retry passes.
- PocketIC tests must assert Candid optionals as 0/1-element arrays: getNote/updateNote/setNotePinned return [] | [NoteView], so toEqual([]) and toHaveLength(1) are correct.
- NotesPage imports isBodyEmpty but never uses it; the body-empty check lives only in NoteDetailPage.
- The app's automated suite (frontend Vitest + PocketIC backend lane) passes green at the current revision; the earlier 'automated tests did not pass' report came from the local-deploy preflight, not the app's own suite.
- Local-deploy preflight runs are capped at two per build; once spent, a pass is recorded for the current tree without re-testing and the deploy proceeds with an unresolved-QA warning.
