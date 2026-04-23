import "server-only";
import { backendJson } from "./backend";
import type { SubscriptionStatus } from "./tenants";

export type DashboardActionRow = {
  tenantId: string;
  tenantName: string;
  reason: "OVERDUE" | "TRIAL_EXPIRING";
  status: SubscriptionStatus;
  monthlyPriceCents: number;
  nextDueAt: string | null;
  trialEndsAt: string | null;
  overdueDays: number;
};

export type DashboardSummary = {
  mrrCents: number;
  activeCount: number;
  overdueCount: number;
  overdueAmountCents: number;
  trialCount: number;
  trialExpiringSoonCount: number;
  receivedThisMonthCents: number;
  actionRequired: DashboardActionRow[];
};

export function getDashboardSummary(): Promise<DashboardSummary> {
  return backendJson<DashboardSummary>("/admin/dashboard/summary");
}
