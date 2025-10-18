"use client";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function LogoutButton() {
  const pathname = usePathname();

  // Je cache le bouton sur la page de login
  if (pathname === "/login") return null;

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }}
    >
      Se déconnecter
    </Button>
  );
}
