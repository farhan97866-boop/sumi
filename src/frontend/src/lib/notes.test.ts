import type { NoteView } from "@/backend";
import {
  formatRelativeTime,
  isBodyEmpty,
  plainTextPreview,
  sortNotes,
  timestampToDate,
} from "@/lib/notes";
import { describe, expect, it } from "vitest";

function note(overrides: Partial<NoteView>): NoteView {
  return {
    id: 1n,
    title: "Note",
    body: "",
    createdAt: 0n,
    updatedAt: 0n,
    pinned: false,
    ...overrides,
  };
}

describe("notes helpers", () => {
  it("strips HTML to a plain-text preview", () => {
    expect(plainTextPreview("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world",
    );
    expect(plainTextPreview("<p>a &amp; b</p>")).toBe("a & b");
  });

  it("treats markup-only bodies as empty", () => {
    expect(isBodyEmpty("<p><br></p>")).toBe(true);
    expect(isBodyEmpty("<p>text</p>")).toBe(false);
  });

  it("sorts pinned notes first, then by most recently updated", () => {
    const older = note({ id: 1n, updatedAt: 100n });
    const newer = note({ id: 2n, updatedAt: 200n });
    const pinned = note({ id: 3n, updatedAt: 50n, pinned: true });
    const sorted = sortNotes([older, newer, pinned]);
    expect(sorted.map((n) => n.id)).toEqual([3n, 2n, 1n]);
  });

  it("converts nanosecond timestamps to dates", () => {
    const date = timestampToDate(1_700_000_000_000_000_000n);
    expect(date?.getTime()).toBe(1_700_000_000_000);
  });

  it("formats a recent timestamp as relative time", () => {
    const now = BigInt(Date.now()) * 1_000_000n;
    expect(formatRelativeTime(now)).toBe("just now");
  });
});
