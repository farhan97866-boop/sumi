import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const CHINESE_LEARNED_KEY = ["chinese", "learned"] as const;
const CHINESE_PROGRESS_KEY = ["chinese", "progress"] as const;

/**
 * The set of Chinese characters the signed-in user has marked as learned.
 * Returns an empty array while signed out or before the actor is ready.
 */
export function useChineseLearned() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: CHINESE_LEARNED_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChineseLearned();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Count of learned Chinese characters for the signed-in user. */
export function useChineseProgress() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: CHINESE_PROGRESS_KEY,
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getChineseProgress();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Mark a single character learned or not, refreshing progress on success. */
export function useMarkChineseLearned() {
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
      return actor.markChineseLearned(character, learned);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHINESE_LEARNED_KEY });
      void queryClient.invalidateQueries({ queryKey: CHINESE_PROGRESS_KEY });
    },
  });
}
