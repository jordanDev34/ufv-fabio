// Middleware s'exécute avant chaque requête sur les routes. - Si user non connecté => Redirection vers /login
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes qui nécessitent d'être authentifié
const PROTECTED = ["/chargements", "/nouveau-chargement"] as const;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Je récupère tous les cookies présents sur la requête entrante
        getAll() {
          return req.cookies
            .getAll()
            .map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Vérifie si un utilisateur est connecté (via les cookies Supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Si la page est protégée et qu'il n'y a pas d'utilisateur connecté => Je redirige vers /login
  if (needsAuth && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Sinon, je laisse passer la requête
  return res;
}

// Le middleware s'applique sur ces routes
export const config = {
  matcher: ["/chargements/:path*", "/nouveau-chargement"],
};
