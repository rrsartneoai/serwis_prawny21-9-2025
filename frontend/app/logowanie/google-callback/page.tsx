"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleGoogleCallback } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setErrorMessage("Anulowano logowanie przez Google");
        setTimeout(() => router.push("/logowanie"), 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("Brak kodu autoryzacji");
        setTimeout(() => router.push("/logowanie"), 3000);
        return;
      }

      try {
        const result = await handleGoogleCallback(code);
        if (result.user) {
          setStatus("success");
          setTimeout(() => router.push("/panel-klienta"), 1500);
        } else {
          setStatus("error");
          setErrorMessage(result.error || "Wystąpił błąd podczas logowania");
          setTimeout(() => router.push("/logowanie"), 3000);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("Wystąpił błąd podczas przetwarzania logowania");
        setTimeout(() => router.push("/logowanie"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, handleGoogleCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Logowanie w toku..."}
            {status === "success" && "Logowanie pomyślne!"}
            {status === "error" && "Błąd logowania"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-gray-600">Przetwarzanie logowania przez Google...</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-gray-600">Zostaniesz przekierowany do panelu klienta...</p>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <div className="h-4 w-4 bg-red-500 rounded-full"></div>
              </div>
              <p className="text-red-600">{errorMessage}</p>
              <p className="text-gray-600 text-sm">Przekierowanie do strony logowania...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}