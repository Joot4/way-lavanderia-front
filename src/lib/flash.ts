"use server";

import { cookies } from "next/headers";

export type FlashKind = "success" | "error" | "info";

export async function setFlash(kind: FlashKind, message: string): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: "flash",
    value: JSON.stringify({ kind, message }),
    path: "/",
    maxAge: 10,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
