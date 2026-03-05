"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Arinova } from "@/lib/arinova";
import { useGameStore } from "@/stores/game";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const setAuth = useGameStore((s) => s.setAuth);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Missing authorization code");
      return;
    }

    Arinova.handleCallback({
      code,
      clientId: process.env.NEXT_PUBLIC_ARINOVA_CLIENT_ID || "who-is-killer",
      clientSecret: process.env.ARINOVA_CLIENT_SECRET || "",
      redirectUri: window.location.origin + "/callback",
    })
      .then(({ user, accessToken }) => {
        setAuth(user, accessToken, []);
        router.replace("/");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Login failed");
      });
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => router.replace("/")}
              className="text-[#999] hover:text-white"
            >
              返回首頁
            </button>
          </>
        ) : (
          <p className="text-[#999]">登入中...</p>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-[#999]">載入中...</p></div>}>
      <CallbackContent />
    </Suspense>
  );
}
