// Page listant tous les chargements existants depuis Supabase (server component)
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export default async function ChargementsPage() {
  // Connexion à Supabase via le client serveur (fichier lib/supabase/server.ts)
  const supabase = await createServerSupabase();

  // Requête : Je récupère les chargements avec leurs relations (client + transporteur)
  const { data: chargements, error } = await supabase
    .from("chargements")
    .select(
      `
      id,
      date_chargement,
      created_at,
      clients ( nom, prenom ),
      transports ( nom )
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Chargements</h1>
        <Link href="/nouveau-chargement" className="self-start sm:self-auto">
          <Button>Nouveau chargement</Button>
        </Link>
      </div>

      {/* Gestion des erreurs Supabase */}
      {error && <p className="text-red-600">Erreur: {error.message}</p>}

      {/* Message si aucun chargement n’est encore enregistré */}
      {!error && (!chargements || chargements.length === 0) && (
        <p className="text-gray-500">Aucun chargement pour le moment.</p>
      )}

      {/* Liste des chargements récupérés */}
      {!error && chargements && (
        <ul className="space-y-3">
          {chargements.map((c) => {
            // Formatage des dates
            const date = new Date(c.date_chargement).toLocaleDateString();
            const created = new Date(c.created_at).toLocaleDateString();

            // Je renvoie les relations Supabase sous forme de tableau
            const clientObj = Array.isArray(c.clients)
              ? c.clients[0]
              : c.clients;
            const transportObj = Array.isArray(c.transports)
              ? c.transports[0]
              : c.transports;

            // Enfin, je construis les libellés affichés
            const client = clientObj
              ? [clientObj.prenom, clientObj.nom].filter(Boolean).join(" ")
              : "—";
            const transporteur = transportObj?.nom ?? "—";

            return (
              <li
                key={c.id}
                className="p-4 border rounded-lg bg-white flex items-center justify-between gap-4"
              >
                {/* Bloc gauche : date + infos client/transporteur */}
                <div className="flex items-center gap-3 min-w-0">                  
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">{date}</span>
                    <span className="text-sm text-gray-600 truncate">
                      Client : {client} - Transporteur : {transporteur}
                    </span>
                  </div>
                </div>

                {/* Bloc droit : date de création + bouton d’édition */}
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-gray-500 text-sm">
                    Créé le {created}
                  </span>
                  <Link href={`/chargements/${c.id}/edit`}>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Modifier"
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
