import "server-only";
import { backendJson } from "./backend";

export type UsageByTenantRow = {
  tenantId: string;
  tenantName: string;
  messageCount: number;
  inboundMessageCount: number;
  outboundMessageCount: number;
  conversationCount: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
  costUsd: number;
};

export type UsageByTenantResponse = {
  month: string;
  totals: {
    messageCount: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  rows: UsageByTenantRow[];
};

export function getUsageByTenant(month?: string): Promise<UsageByTenantResponse> {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return backendJson<UsageByTenantResponse>(`/admin/usage/by-tenant${qs}`);
}

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
}

export function formatTokens(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}
