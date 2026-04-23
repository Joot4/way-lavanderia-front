"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";

function readFlashCookie(): { kind: string; message: string } | null {
  const match = document.cookie.match(/(?:^|; )flash=([^;]*)/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    if (typeof parsed?.message === "string") return parsed;
  } catch {}
  return null;
}

function clearFlashCookie() {
  document.cookie = "flash=; Max-Age=0; path=/";
}

export function FlashToaster() {
  useEffect(() => {
    function check() {
      const flash = readFlashCookie();
      if (!flash) return;
      clearFlashCookie();
      if (flash.kind === "success") toast.success(flash.message);
      else if (flash.kind === "error") toast.error(flash.message);
      else toast(flash.message);
    }
    check();
    const id = window.setInterval(check, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{ duration: 4000 }}
    />
  );
}
