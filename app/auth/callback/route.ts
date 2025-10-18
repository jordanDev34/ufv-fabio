// Rôle du fichier : recevoir le retour du "lien magique" Supabase, créer la session (cookies HTTPOnly),
// puis je redirige l'utilisateur vers la page demandée.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Route non mise en cache
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Je sécurise la destination pour éviter les open-redirects
  const next = url.searchParams.get("next") || "/chargements";
  const safeNext = next.startsWith("/") ? next : "/chargements";

  // Code renvoyé par Supabase dans le lien magique
  const code = url.searchParams.get("code");

  // Store cookies côté serveur
  const cookieStore = await cookies();

  // Client Supabase côté serveur
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Lit tous les cookies présents
        getAll() {
          return cookieStore
            .getAll()
            .map((c) => ({ name: c.name, value: c.value }));
        },
        // Écrit/MAJ les cookies que Supabase veut poser
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Je redirige vers la destination (par défaut : /chargements)
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
