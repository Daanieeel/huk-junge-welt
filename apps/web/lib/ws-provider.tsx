"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { treaty } from "@elysiajs/eden";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { App } from "@app/websocket";
import { queryKeys } from "@/lib/queries";
import { useProposalsStore } from "@/lib/proposals-store";

// ============================================================================
// Eden Treaty WebSocket client (type-only reference, no server code included)
// ============================================================================

function createWsClient(baseUrl: string) {
  return treaty<App>(baseUrl);
}

// ============================================================================
// Typed WebSocket message shape coming from the server
// ============================================================================

interface WsNotificationMessage {
  channel: string;
  message: {
    type: "notification";
    userId: string;
    notificationId: string;
    notificationType: "JOB_STARTED" | "JOB_PROGRESS" | "JOB_COMPLETED" | "JOB_FAILED" | "SYSTEM";
    title: string;
    message: string;
    data?: {
      subtype?: string;
      proposalCount?: number;
      proposalTypes?: string[];
      [key: string]: unknown;
    };
    id: string;
    timestamp: number;
  };
}

// ============================================================================
// Context (intentionally minimal – the provider is the behaviour)
// ============================================================================

const WsContext = createContext<null>(null);

// ============================================================================
// Provider
// ============================================================================

export function WsProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const setRegenerating = useProposalsStore((s) => s.setRegenerating);

  // Resolve session token once on mount (and whenever auth state changes)
  useEffect(() => {
    authClient.getSession().then((res) => {
      const token = (res?.data?.session as { token?: string } | undefined)?.token ?? null;
      setSessionToken(token);
    });
  }, []);

  // Store the unsubscribe / close handle across renders
  const wsRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    const token = sessionToken;
    if (!token) return;

    const wsUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "ws://localhost:3002";

    // Eden Treaty normalises ws:// → http:// internally
    const normalizedUrl = wsUrl.replace(/^ws(s?):\/\//, "http$1://");
    const client = createWsClient(normalizedUrl);

    const channel = client.ws.subscribe({ query: { token } });

    channel.subscribe(({ data }: { data: unknown }) => {
      if (!data || typeof data !== "object") return;

      const msg = data as WsNotificationMessage;
      if (!msg.message || msg.message.type !== "notification") return;

      const { notificationType, title, message: body, data: extra } = msg.message;

      // --- Proposal updates: invalidate cache and show toast ---
      if (
        notificationType === "SYSTEM" &&
        extra?.subtype === "PROPOSALS_UPDATED"
      ) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
        queryClient.invalidateQueries({ queryKey: queryKeys.home });
        setRegenerating(false);

        const count = extra.proposalCount ?? 0;
        const toastMsg =
          count === 1
            ? "1 Versicherungsempfehlung aktualisiert"
            : `${count} Versicherungsempfehlungen aktualisiert`;

        toast(title, {
          description: toastMsg,
          action: {
            label: "Empfehlungen ansehen",
            onClick: () => router.push("/vertragsempfehlungen"),
          },
          duration: 8000,
        });
        return;
      }

      // --- Generic job notifications (completed / failed) ---
      if (notificationType === "JOB_COMPLETED" || notificationType === "JOB_FAILED") {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        toast(title, { description: body });
      }
    });

    channel.on("error", (err: unknown) => {
      console.error("[WS] error", err);
    });

    wsRef.current = { close: () => channel.close() };

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  // Re-connect only when the session token changes
  }, [sessionToken, queryClient, router, setRegenerating]);

  return <WsContext.Provider value={null}>{children}</WsContext.Provider>;
}

// Hook kept for potential future use
export const useWs = () => useContext(WsContext);
