"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const frAuthMessage = (msg?: string) =>
  msg === "Invalid login credentials"
    ? "Identifiants incorrects."
    : msg || "Une erreur est survenue.";

export function LoginFormClient() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/chargements";

  const emailTrimmed = email.trim().toLowerCase();
  const canSubmitPwd =
    !loadingPwd && !loadingLink && emailTrimmed !== "" && pwd !== "";
  const canSubmitLink = !loadingPwd && !loadingLink && emailTrimmed !== "";

  // Si user déjà connecté, je le redirige
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.replace(nextUrl);
    });
  }, [nextUrl]);

  // Connexion avec email + mot de passe (que j'enregistre au préalable dans Supabase)
  const loginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPwd) return;
    setMsg(null);
    setLoadingPwd(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: pwd,
      });
      if (error) {
        setMsg(frAuthMessage(error.message));
        return;
      }
      window.location.assign(nextUrl);
    } finally {
      setLoadingPwd(false);
    }
  };

  // Connexion par lien magique
  const loginWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitLink) return;
    setMsg(null);
    setLoadingLink(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailTrimmed,
        options: {
          emailRedirectTo: `${
            window.location.origin
          }/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      });
      if (error) {
        setMsg(frAuthMessage(error.message));
        return;
      }
      setMsg("Un lien de connexion a été envoyé. Vérifie ta boîte mail.");
    } finally {
      setLoadingLink(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Connexion</h1>

      <form className="space-y-3" onSubmit={loginWithPassword}>
        <Input
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Mot de passe"
          required
          autoComplete="current-password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <Button
          type="submit"
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canSubmitPwd}
        >
          {loadingPwd ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">— ou —</div>
      <h2 className="text-2xl font-bold text-center">Connexion via un lien</h2>

      <form className="space-y-3" onSubmit={loginWithMagicLink}>
        <Input
          type="email"
          placeholder="Email (ex: demo@exemple.com)"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canSubmitLink}
        >
          {loadingLink ? "Envoi du lien..." : "Recevoir un lien"}
        </Button>
      </form>

      {msg && (
        <p className="text-sm text-center text-red-600" aria-live="polite">
          {msg}
        </p>
      )}
    </div>
  );
}
