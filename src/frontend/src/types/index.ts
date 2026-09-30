import type { LucideIcon } from "lucide-react";

/** A single tool in the Sumi suite. */
export interface Tool {
  /** Route path, e.g. "/calculator". */
  path: string;
  /** Display name shown on cards and in navigation. */
  name: string;
  /** One-line description of what the tool does. */
  description: string;
  /** Short uppercase label used for the hanko seal chip. */
  seal: string;
  /** Lucide icon component. */
  icon: LucideIcon;
  /** Grouping used to organise the sidebar and dashboard. */
  group: ToolGroup;
  /** Whether the tool persists data to the backend and needs sign-in. */
  requiresAuth: boolean;
}

export type ToolGroup = "Compute" | "Games" | "Study" | "Notes";

export interface ToolGroupMeta {
  id: ToolGroup;
  label: string;
  /** Japanese kanji mark for the group. */
  mark: string;
}
