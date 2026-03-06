import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { homeApi, questionnaireApi, dashboardApi } from "./api-client";
import { api } from "./eden";
import { useProposalsStore } from "./proposals-store";

const REST_URL = process.env.NEXT_PUBLIC_REST_URL ?? "http://localhost:3001";

export const queryKeys = {
  home: ["home"] as const,
  dashboard: ["dashboard"] as const,
  questionnaire: ["questionnaire"] as const,
  proposals: ["proposals"] as const,
  insurances: ["insurances"] as const,
} as const;

export function useHomeQuery() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: homeApi.get,
  });
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.get,
  });
}

export function useQuestionnaireQuery() {
  return useQuery({
    queryKey: queryKeys.questionnaire,
    queryFn: questionnaireApi.get,
  });
}

// ============================================================================
// Infer the questionnaire body types directly from the Eden treaty client
// so they stay in sync with the Elysia endpoints at compile time.
// ============================================================================

type QuestionnairePostBody = Parameters<typeof api.questionnaire.post>[0];
type QuestionnairePutBody = Parameters<typeof api.questionnaire.put>[0];

function invalidateQuestionnaireQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.questionnaire });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  queryClient.invalidateQueries({ queryKey: queryKeys.home });
}

// ============================================================================
// Proposals
// ============================================================================

export function useProposalsQuery() {
  return useQuery({
    queryKey: queryKeys.proposals,
    queryFn: async () => {
      const { data, error } = await api.proposals.get();
      if (error) throw new Error("Failed to load proposals");
      return data ?? [];
    },
  });
}

// ============================================================================
// Insurances
// ============================================================================

export function useInsurancesQuery() {
  return useQuery({
    queryKey: queryKeys.insurances,
    queryFn: async () => {
      const { data, error } = await api.insurances.get();
      if (error) throw new Error("Failed to load insurances");
      // Eden returns the response body as-is: { data: [...] }
      return (data as unknown as { data: unknown[] })?.data ?? [];
    },
  });
}

type InsuranceCreateBody = Parameters<typeof api.insurances.post>[0];

export function useAddInsurance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InsuranceCreateBody) => {
      const { data, error } = await api.insurances.post(input);
      if (error) {
        const msg =
          typeof error.value === "object" &&
          error.value !== null &&
          "error" in error.value
            ? String((error.value as { error: unknown }).error)
            : "Fehler beim Hinzufügen";
        throw new Error(msg);
      }
      return data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insurances });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useInsuranceQuery(id: string | null) {
  return useQuery({
    queryKey: ["insurance", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`${REST_URL}/insurances/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load insurance");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useDeleteInsurance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${REST_URL}/insurances/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fehler beim Löschen");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insurances });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ insuranceId, file }: { insuranceId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${REST_URL}/insurances/${insuranceId}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Upload fehlgeschlagen");
      }
      return res.json();
    },
    onSuccess: (_data, { insuranceId }) => {
      queryClient.invalidateQueries({ queryKey: ["insurance", insuranceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.insurances });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ insuranceId, docId }: { insuranceId: string; docId: string }) => {
      const res = await fetch(`${REST_URL}/insurances/${insuranceId}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fehler beim Löschen");
    },
    onSuccess: (_data, { insuranceId }) => {
      queryClient.invalidateQueries({ queryKey: ["insurance", insuranceId] });
    },
  });
}

export function useRegenerateProposals() {
  const setRegenerating = useProposalsStore((s) => s.setRegenerating);
  return useMutation({
    mutationFn: async () => {
      const { error } = await api.proposals.regenerate.post();
      if (error) {
        const msg =
          typeof error.value === "object" &&
          error.value !== null &&
          "error" in error.value
            ? String((error.value as { error: unknown }).error)
            : "Fehler beim Starten der Generierung";
        throw new Error(msg);
      }
    },
    onSuccess: () => setRegenerating(true),
  });
}

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
    onSuccess: () => invalidateQuestionnaireQueries(queryClient),
  });
}

export function usePutQuestionnaire() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: QuestionnairePutBody) => {
      const { data, error } = await api.questionnaire.put(input);
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
    onSuccess: () => invalidateQuestionnaireQueries(queryClient),
  });
}
