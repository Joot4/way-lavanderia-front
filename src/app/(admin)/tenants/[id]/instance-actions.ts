"use server";

import { revalidatePath } from "next/cache";
import {
  createInstance,
  deleteInstance,
  logoutInstance,
} from "@/lib/instances";

export async function createInstanceAction(
  tenantId: string,
  instanceName: string,
) {
  await createInstance({ instanceName });
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/instances");
}

export async function logoutInstanceAction(
  tenantId: string,
  instanceName: string,
) {
  await logoutInstance(instanceName);
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/instances");
}

export async function deleteInstanceAction(
  tenantId: string,
  instanceName: string,
) {
  await deleteInstance(instanceName);
  revalidatePath(`/tenants/${tenantId}`);
  revalidatePath("/instances");
}
