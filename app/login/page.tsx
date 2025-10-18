"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const frAuthMessage = (msg?: string) =>
  msg === "Invalid login credentials" ? "Identifiants incorrects." : msg || "Une erreur est survenue.";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/chargements";

  // Connexion avec email + mot de passe (que j'enregistre au préalable dans Supabase)
  const loginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    });
    if (error) setMsg(`${frAuthMessage(error.message)}`);
    else window.location.href = nextUrl;
  };

  // Connexion par lien magique
  const loginWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${
          window.location.origin
        }/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });
    if (error) setMsg(`${frAuthMessage(error.message)}`);
    else setMsg("Un lien de connexion a été envoyé. Vérifie ta boîte mail.");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Connexion</h1>

        <form className="space-y-3" onSubmit={loginWithPassword}>
          <Input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            required
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">— ou —</div>
        <h1 className="text-2xl font-bold text-center">Connexion via un lien</h1>

        <form className="space-y-3" onSubmit={loginWithMagicLink}>
          <Input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="outline" className="w-full">
            Recevoir un lien
          </Button>
        </form>

        {msg && <p className="text-sm text-center">{msg}</p>}
      </div>
    </main>
  );
}
