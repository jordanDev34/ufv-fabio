// Rôle du fichier : recevoir le retour du "lien magique" Supabase, créer la session (cookies HTTPOnly),
// puis je redirige l'utilisateur vers la page demandée.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Route non mise en cache
export const dynamic = "force-dynamic";

// Types d’OTP email acceptés par Supabase pour la vérification via token_hash
type EmailOtpType = "magiclink" | "recovery" | "invite" | "email_change";

function isEmailOtpType(t: string | null): t is EmailOtpType {
  return (
    t === "magiclink" ||
    t === "recovery" ||
    t === "invite" ||
    t === "email_change"
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Je sécurise la destination pour éviter les open-redirects
  const next = url.searchParams.get("next") || "/chargements";
  const safeNext = next.startsWith("/") ? next : "/chargements";

  // Code renvoyé par Supabase dans le lien magique
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

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
          return cookieStore.getAll();
        },
        // Écrit/MAJ les cookies que Supabase veut poser
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (token_hash && isEmailOtpType(type)) {
      await supabase.auth.verifyOtp({ type, token_hash });
    }
  } catch {
    // En cas d’erreur d’échange, je renvoie vers /login
    const fail = new URL("/login", url.origin);
    fail.searchParams.set("next", safeNext);
    return NextResponse.redirect(fail);
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
