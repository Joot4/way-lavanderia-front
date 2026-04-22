import "server-only";
import { backendJson } from "./backend";

export type ConversationStatus =
  | "AI_ACTIVE"
  | "AWAITING_HUMAN"
  | "HUMAN_ACTIVE"
  | "RESOLVED";

export type MessageSender = "CUSTOMER" | "AI" | "HUMAN";
export type MessageDirection = "INBOUND" | "OUTBOUND";

export type ConversationListItem = {
  id: string;
  status: ConversationStatus;
  aiPausedUntil: string | null;
  lastMessageAt: string;
  customer: { id: string; name: string | null; whatsappPhone: string };
  tenant: { id: string; name: string };
  lastMessage: {
    id: string;
    content: string;
    sender: MessageSender;
    direction: MessageDirection;
    createdAt: string;
  } | null;
};

export type ConversationListResponse = {
  items: ConversationListItem[];
  nextCursor: string | null;
};

export type ConversationDetail = {
  id: string;
  status: ConversationStatus;
  aiPausedUntil: string | null;
  assignedUserId: string | null;
  lastMessageAt: string;
  createdAt: string;
  customer: { id: string; name: string | null; whatsappPhone: string };
  tenant: { id: string; name: string; whatsappNumber: string };
  messages: {
    id: string;
    content: string;
    sender: MessageSender;
    direction: MessageDirection;
    createdAt: string;
  }[];
};

export async function listConversations(params: {
  status?: ConversationStatus | ConversationStatus[];
  tenantId?: string;
  limit?: number;
  cursor?: string;
}): Promise<ConversationListResponse> {
  const qs = new URLSearchParams();
  if (params.status) {
    const arr = Array.isArray(params.status) ? params.status : [params.status];
    for (const s of arr) qs.append("status", s);
  }
  if (params.tenantId) qs.set("tenantId", params.tenantId);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.cursor) qs.set("cursor", params.cursor);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return backendJson<ConversationListResponse>(`/admin/conversations${suffix}`);
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return backendJson<ConversationDetail>(
    `/admin/conversations/${encodeURIComponent(id)}`,
  );
}

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  AI_ACTIVE: "IA ativa",
  AWAITING_HUMAN: "Aguardando humano",
  HUMAN_ACTIVE: "Humano atendendo",
  RESOLVED: "Resolvida",
};

export const STATUS_TONE: Record<ConversationStatus, string> = {
  AI_ACTIVE:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  AWAITING_HUMAN:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
  HUMAN_ACTIVE:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  RESOLVED:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};
