import type { Tool, ToolGroupMeta } from "@/types";
import {
  Calculator,
  Coins,
  Crown,
  Disc3,
  Languages,
  NotebookPen,
  ScrollText,
  Sparkles,
} from "lucide-react";

/**
 * The single source of truth for every tool in the Sumi suite.
 * Dashboard cards, sidebar rows, and the command palette all read from here.
 */
export const TOOLS: Tool[] = [
  {
    path: "/calculator",
    name: "Calculator",
    description:
      "Four-function arithmetic with a running tape of past results.",
    seal: "計",
    icon: Calculator,
    group: "Compute",
    requiresAuth: false,
  },
  {
    path: "/currency",
    name: "Currency Converter",
    description: "Convert between world currencies at live exchange rates.",
    seal: "円",
    icon: Coins,
    group: "Compute",
    requiresAuth: false,
  },
  {
    path: "/chess",
    name: "Chess",
    description:
      "Play a full game of chess on a classic board with move history.",
    seal: "王",
    icon: Crown,
    group: "Games",
    requiresAuth: false,
  },
  {
    path: "/carrom",
    name: "Carrom",
    description: "Flick the striker and pocket coins on a wooden carrom board.",
    seal: "玉",
    icon: Disc3,
    group: "Games",
    requiresAuth: false,
  },
  {
    path: "/karuta",
    name: "Karuta",
    description: "Match Hyakunin Isshu poem cards in a fast memory game.",
    seal: "歌",
    icon: ScrollText,
    group: "Games",
    requiresAuth: false,
  },
  {
    path: "/japanese",
    name: "Japanese Letters",
    description: "Study hiragana and katakana with flashcards and progress.",
    seal: "あ",
    icon: Languages,
    group: "Study",
    requiresAuth: true,
  },
  {
    path: "/chinese",
    name: "Chinese Letters",
    description: "Learn Hanzi characters with pinyin, meaning, and progress.",
    seal: "漢",
    icon: Sparkles,
    group: "Study",
    requiresAuth: true,
  },
  {
    path: "/notes",
    name: "Notes",
    description: "Write, pin, and search notes saved to your account.",
    seal: "筆",
    icon: NotebookPen,
    group: "Notes",
    requiresAuth: true,
  },
];

export const TOOL_GROUPS: ToolGroupMeta[] = [
  { id: "Compute", label: "Compute", mark: "算" },
  { id: "Games", label: "Games", mark: "遊" },
  { id: "Study", label: "Study", mark: "学" },
  { id: "Notes", label: "Notes", mark: "記" },
];

export function getToolByPath(path: string): Tool | undefined {
  return TOOLS.find((tool) => tool.path === path);
}

export function toolsInGroup(group: Tool["group"]): Tool[] {
  return TOOLS.filter((tool) => tool.group === group);
}
