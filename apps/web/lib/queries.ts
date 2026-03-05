import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { homeApi, questionnaireApi } from "./api-client";
import { api } from "./eden";

export const queryKeys = {
  home: ["home"] as const,
  questionnaire: ["questionnaire"] as const,
} as const;

export function useHomeQuery() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: homeApi.get,
  });
}

export function useQuestionnaireQuery() {
  return useQuery({
    queryKey: queryKeys.questionnaire,
    queryFn: questionnaireApi.get,
  });
}

// ============================================================================
// Infer the questionnaire POST body type directly from the Eden treaty client
// so it stays in sync with the Elysia endpoint at compile time.
// ============================================================================

type QuestionnairePostBody = Parameters<
  typeof api.questionnaire.post
>[0];

export function useSubmitQuestionnaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: QuestionnairePostBody) => {
      const { data, error } = await api.questionnaire.post(input);
      if (error) {
        const msg =
          typeof error.value === "object" &&
          error.value !== null &&
          "error" in error.value
            ? String((error.value as { error: unknown }).error)
            : "Unbekannter Fehler";
        throw new Error(msg);
      }
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaire });
      queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}
