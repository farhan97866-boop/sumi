import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(actor.listNotes([])).resolves.toEqual([]);
  await expect(actor.getJapaneseLearned("hiragana")).resolves.toEqual([]);
  await expect(actor.getJapaneseProgress("hiragana")).resolves.toBe(0n);
  await expect(actor.getChineseLearned()).resolves.toEqual([]);
  await expect(actor.getChineseProgress()).resolves.toBe(0n);
});

it("round-trips a note through the real canister", async () => {
  const created = await actor.createNote("Groceries", "<p>milk</p>");
  expect(created).toMatchObject({
    title: "Groceries",
    body: "<p>milk</p>",
    pinned: false,
  });

  const listed = await actor.listNotes([]);
  expect(listed).toContainEqual(expect.objectContaining({ id: created.id }));

  const fetched = await actor.getNote(created.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0]).toMatchObject({ id: created.id, title: "Groceries" });

  const updated = await actor.updateNote(created.id, "Groceries", "<p>bread</p>");
  expect(updated).toHaveLength(1);
  expect(updated[0]).toMatchObject({ body: "<p>bread</p>" });

  const pinned = await actor.setNotePinned(created.id, true);
  expect(pinned).toHaveLength(1);
  expect(pinned[0]).toMatchObject({ pinned: true });

  await expect(actor.deleteNote(created.id)).resolves.toBe(true);
  await expect(actor.getNote(created.id)).resolves.toEqual([]);
});

it("records Japanese and Chinese study progress through the real canister", async () => {
  await actor.markJapaneseLearned("hiragana", "あ", true);
  await expect(actor.getJapaneseLearned("hiragana")).resolves.toContain("あ");
  await expect(actor.getJapaneseProgress("hiragana")).resolves.toBe(1n);

  await actor.markChineseLearned("日", true);
  await expect(actor.getChineseLearned()).resolves.toContain("日");
  await expect(actor.getChineseProgress()).resolves.toBe(1n);
});

it("does not show one caller's notes to another", async () => {
  const alice = createIdentity("alice");
  const bob = createIdentity("bob");

  actor.setIdentity(alice);
  const created = await actor.createNote("Alice private", "secret");

  actor.setIdentity(bob);
  await expect(actor.listNotes([])).resolves.toEqual([]);
  await expect(actor.getNote(created.id)).resolves.toEqual([]);
  await expect(actor.deleteNote(created.id)).resolves.toBe(false);

  actor.setIdentity(alice);
  await expect(actor.getNote(created.id)).resolves.toHaveLength(1);
});

it("keeps Japanese and Chinese progress separate per caller", async () => {
  const alice = createIdentity("alice");
  const bob = createIdentity("bob");

  actor.setIdentity(alice);
  await actor.markJapaneseLearned("katakana", "ア", true);
  await actor.markChineseLearned("水", true);

  actor.setIdentity(bob);
  await expect(actor.getJapaneseLearned("katakana")).resolves.toEqual([]);
  await expect(actor.getJapaneseProgress("katakana")).resolves.toBe(0n);
  await expect(actor.getChineseLearned()).resolves.toEqual([]);
  await expect(actor.getChineseProgress()).resolves.toBe(0n);
});
