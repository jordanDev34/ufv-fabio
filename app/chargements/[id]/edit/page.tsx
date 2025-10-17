import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditChargementForm from "@/components/forms/EditChargementForm";

export default async function EditChargementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Je récupère l'ID du chargement à modifier depuis l'URL
  const { id } = await params;
  // Connexion Supabase côté serveur (Server Component)
  const supabase = await createServerSupabase();

  // Je récupère le chargement à modifier et ses lignes
  const { data: ch, error } = await supabase
    .from("chargements")
    .select("id, date_chargement, client_id, transport_id")
    .eq("id", id)
    .single();

  if (error || !ch) notFound();

  // Je récupère les produits associés au chargement
  const { data: lignes } = await supabase
    .from("chargement_produits")
    .select("produit_id, quantite")
    .eq("chargement_id", id)
    .order("id");

  // Je récupère les clients, transporteurs et produits
  const [{ data: clients }, { data: transports }, { data: produits }] =
    await Promise.all([
      supabase.from("clients").select("id, nom").order("nom"),
      supabase.from("transports").select("id, nom").order("nom"),
      supabase.from("produits").select("id, nom, poids").order("nom"),
    ]);

  // Valeurs par défaut (pour pré remplir le formulaire)
  const initialValues = {
    client_id: ch.client_id,
    transport_id: ch.transport_id,
    date_chargement: ch.date_chargement,
    lignes: (lignes ?? []).map((l) => ({
      produit_id: l.produit_id,
      quantite: l.quantite,
    })),
  };

  // Affichage du formulaire d’édition avec les données existantes
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Modifier le chargement</h1>
      <EditChargementForm
        chargementId={id}
        initialValues={initialValues}
        clients={clients ?? []}
        transports={transports ?? []}
        produits={produits ?? []}
      />
    </div>
  );
}
