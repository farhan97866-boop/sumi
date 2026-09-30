mixin () {
  public query func getApiDoc() : async Text {
    "# Study & Notes Backend API\n" #
    "\n" #
    "This canister backs a single productivity app that bundles three tools: a\n" #
    "personal notes workspace, Japanese (hiragana / katakana / kanji) character\n" #
    "study, and Chinese character study. All persisted data is scoped to the\n" #
    "signed-in user.\n" #
    "\n" #
    "## Authentication and identity\n" #
    "\n" #
    "Every method that reads or writes user data takes the caller principal from the\n" #
    "message (`{ caller }`). There is no separate login token: the caller is whoever\n" #
    "signed the request.\n" #
    "\n" #
    "- **Anonymous callers** are identified by the anonymous principal. They are\n" #
    "  treated as `#guest` by the authorization layer and own no data, so notes and\n" #
    "  progress calls return empty results for them.\n" #
    "- **Signed-in callers** are Internet Identity principals. The app's frontend\n" #
    "  pins an Internet Identity derivation origin, published at\n" #
    "  `/.well-known/ii-derivation-origin` when available. An agent that already\n" #
    "  holds the user's Internet Identity authorization derives the correct per-app\n" #
    "  principal against that origin (for example\n" #
    "  `icp identity link web <name> --app <host>`). Such a delegation acts with the\n" #
    "  user's full authority in this app until it expires.\n" #
    "- **Registration prerequisite.** A principal is only known to the app after it\n" #
    "  registers through the app's own frontend. Registration happens when a caller\n" #
    "  invokes `_initialize_access_control` (or completes\n" #
    "  `_internet_identity_sign_in_finish`) as a signed-in caller. The **first**\n" #
    "  principal to register becomes `#admin`; every subsequent principal becomes\n" #
    "  `#user`. A principal that never registered is unregistered even if it belongs\n" #
    "  to the app's owner, and a signed-in principal derived against a different\n" #
    "  origin is a different principal than the one the frontend registered.\n" #
    "- **Unregistered callers.** `getCallerUserRole()` traps with\n" #
    "  `User is not registered` for a signed-in but unregistered caller, and returns\n" #
    "  `#guest` for an anonymous caller. `isCallerAdmin()` traps the same way for an\n" #
    "  unregistered signed-in caller. `assignCallerUserRole(user, role)` traps with\n" #
    "  `Unauthorized: Only admins can assign user roles` unless the caller is an\n" #
    "  admin.\n" #
    "\n" #
    "The notes and study methods below do **not** require registration: they key\n" #
    "data by the caller principal directly, so any signed-in caller can use them.\n" #
    "An anonymous caller simply sees and writes nothing.\n" #
    "\n" #
    "## Units and encodings\n" #
    "\n" #
    "- **Timestamps** (`createdAt`, `updatedAt`) are `Int` nanoseconds since the\n" #
    "  Unix epoch, as returned by the IC system time. They are not seconds or\n" #
    "  milliseconds.\n" #
    "- **Principals** are the caller identity; the `owner` field is never returned\n" #
    "  in note views.\n" #
    "- **`NoteView`** is the owner-stripped projection of a note: `{ id, title,\n" #
    "  body, pinned, createdAt, updatedAt }`. The `owner` field exists only in\n" #
    "  storage.\n" #
    "- **`setId`** is an opaque text identifier for a Japanese study set (for\n" #
    "  example a hiragana, katakana, or kanji group). It is chosen by the frontend;\n" #
    "  the backend stores it verbatim.\n" #
    "- **`character`** is a single study character as text (a kana or kanji glyph).\n" #
    "- **`key`** on progress rows is an internal composite of\n" #
    "  `owner | setId | character` (Japanese) or `owner | character` (Chinese). It\n" #
    "  is the storage primary key and is not meaningful to clients.\n" #
    "\n" #
    "## Notes\n" #
    "\n" #
    "- `createNote(title, body)` — creates a note owned by the caller, unpinned,\n" #
    "  with `createdAt` and `updatedAt` set to the current time. Returns the new\n" #
    "  `NoteView`. `title` and `body` are plain text; rich-text formatting is a\n" #
    "  frontend concern and is stored as-is in `body`.\n" #
    "- `updateNote(id, title, body)` — replaces the title and body of the caller's\n" #
    "  note. Returns the updated `NoteView`, or `null` if the note does not exist or\n" #
    "  is not owned by the caller. `pinned` and `createdAt` are preserved;\n" #
    "  `updatedAt` is refreshed.\n" #
    "- `deleteNote(id)` — deletes the caller's note. Returns `true` if a note was\n" #
    "  deleted, `false` if it did not exist or was not owned by the caller.\n" #
    "- `setNotePinned(id, pinned)` — sets the pinned flag on the caller's note.\n" #
    "  Returns the updated `NoteView`, or `null` if the note does not exist or is\n" #
    "  not owned by the caller. Pinning does **not** change `updatedAt`.\n" #
    "- `getNote(id)` — returns the caller's note as a `NoteView`, or `null` if it\n" #
    "  does not exist or is not owned by the caller. Read-only (`query`).\n" #
    "- `listNotes(search)` — returns the caller's notes as `[NoteView]`, sorted\n" #
    "  pinned-first and then by `updatedAt` descending (most recently updated\n" #
    "  first). When `search` is a non-null text, matching is case-insensitive\n" #
    "  substring matching against `title` or `body`; pass `null` to list all.\n" #
    "  Read-only (`query`).\n" #
    "\n" #
    "Notes are strictly per-user: a caller can never read, update, delete, or pin\n" #
    "another user's note, and ownership failures are reported as `null` / `false`\n" #
    "rather than as errors.\n" #
    "\n" #
    "## Japanese study\n" #
    "\n" #
    "- `markJapaneseLearned(setId, character, learned)` — records whether the caller\n" #
    "  has learned `character` within `setId`. Idempotent per\n" #
    "  `(caller, setId, character)`: calling it again overwrites the stored flag and\n" #
    "  refreshes `updatedAt`. Passing `learned = false` un-marks the character.\n" #
    "  Returns nothing.\n" #
    "- `getJapaneseProgress(setId)` — returns the number of characters the caller\n" #
    "  has marked learned in `setId`. Read-only (`query`).\n" #
    "- `getJapaneseLearned(setId)` — returns the characters the caller has marked\n" #
    "  learned in `setId`, as `[Text]`. Read-only (`query`).\n" #
    "\n" #
    "## Chinese study\n" #
    "\n" #
    "- `markChineseLearned(character, learned)` — records whether the caller has\n" #
    "  learned `character`. Idempotent per `(caller, character)`: calling it again\n" #
    "  overwrites the stored flag and refreshes `updatedAt`. Passing\n" #
    "  `learned = false` un-marks the character. Returns nothing.\n" #
    "- `getChineseProgress()` — returns the number of characters the caller has\n" #
    "  marked learned. Read-only (`query`).\n" #
    "- `getChineseLearned()` — returns the characters the caller has marked learned,\n" #
    "  as `[Text]`. Read-only (`query`).\n" #
    "\n" #
    "## Lifecycle and polling\n" #
    "\n" #
    "All methods are single-message and complete synchronously; there is no job to\n" #
    "poll. `getJapaneseProgress` / `getChineseProgress` and the `get*Learned`\n" #
    "methods are `query` calls and can be polled freely after a `mark*` update to\n" #
    "reflect the new state. Because a `mark*` call is an update, a subsequent query\n" #
    "issued before the update is committed may still observe the previous state.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "- `createNote` is **not** idempotent: each call allocates a new id and creates\n" #
    "  a new note, so retrying a call that actually succeeded creates a duplicate.\n" #
    "- `updateNote`, `setNotePinned`, `markJapaneseLearned`, and\n" #
    "  `markChineseLearned` are idempotent: repeating the same call with the same\n" #
    "  arguments leaves the same final state (only `updatedAt` advances on the\n" #
    "  study marks and on `updateNote`).\n" #
    "- `deleteNote` is idempotent in effect: a retry after a successful delete\n" #
    "  returns `false` because the note no longer exists.\n" #
    "\n" #
    "## Errors, traps, and limits\n" #
    "\n" #
    "- Notes and study methods do not trap on missing or foreign data; they return\n" #
    "  `null`, `false`, or empty results.\n" #
    "- `getCallerUserRole()` and `isCallerAdmin()` trap with\n" #
    "  `User is not registered` for a signed-in caller that never registered.\n" #
    "- `assignCallerUserRole(user, role)` traps with\n" #
    "  `Unauthorized: Only admins can assign user roles` for a non-admin caller.\n" #
    "- `title`, `body`, `setId`, and `character` are unbounded text; very large\n" #
    "  values are limited only by the canister's message and storage limits.\n" #
    "- The OQL query surface (`schema()` / `execute()`) is separate from these\n" #
    "  methods and is authorized per entity; it is not part of the app's user-facing\n" #
    "  API.\n";
  };
};
