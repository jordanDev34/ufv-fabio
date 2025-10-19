import { Suspense } from "react";
import { LoginFormClient } from "./LoginFormClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground">
              Chargement…
            </div>
          }
        >
          <LoginFormClient />
        </Suspense>
      </div>
    </main>
  );
}
