// composant serveur: Je récupère les données avant d'afficher le formulaire
import { createServerSupabase } from "@/lib/supabase/server";
import NouveauChargementForm from "@/components/forms/NouveauChargementForm";

export default async function NouveauChargementPage() {
  // Connexion côté serveur à Supabase (fichier lib/supabase/server.ts)
  const supabase = await createServerSupabase();

  // Je récupère les clients, transporteurs et produits depuis Supabase
  const [{ data: clients }, { data: transports }, { data: produits }] =
    await Promise.all([
      supabase.from("clients").select("id, nom").order("nom"),
      supabase.from("transports").select("id, nom").order("nom"),
      supabase.from("produits").select("id, nom, poids").order("nom"),
    ]);

  // Je passe les données au composant client (formulaire de création 'NouveauChargementForm')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nouveau chargement</h1>

      {/* Formulaire côté client avec listes déroulantes (clients, transporteurs, produits) */}
      <NouveauChargementForm
        clients={clients ?? []}
        transports={transports ?? []}
        produits={produits ?? []}
      />
    </div>
  );
}
