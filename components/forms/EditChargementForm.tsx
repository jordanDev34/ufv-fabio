"use client";

import { useState } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Opt = { id: string; nom: string };
type Prod = { id: string; nom: string; poids?: number | null };

// Type guard : Permet d'identifier une erreur Supabase
function asPgError(e: unknown): PostgrestError | null {
  return e && typeof e === "object" && "code" in e && "message" in e
    ? (e as PostgrestError)
    : null;
}

// Schéma de validation avec zod
const LigneSchema = z.object({
  produit_id: z.string().min(1, "Sélectionner un produit"),
  quantite: z.number().int().positive("Quantité > 0"),
});
const FormSchema = z.object({
    client_id: z.string().min(1, "Sélectionner un client"),
    transport_id: z.string().min(1, "Sélectionner un transporteur"),
    date_chargement: z.string().min(1, "Sélectionner une date"),
    lignes: z.array(LigneSchema).min(1, "Ajouter au moins un produit"),
  })
  .superRefine((data, ctx) => {
    const firstIndexByProd = new Map<string, number>();
    data.lignes.forEach((l, i) => {
      const pid = l.produit_id;
      if (!pid) return;
      if (firstIndexByProd.has(pid)) {
        ctx.addIssue({
          code: "custom",
          path: ["lignes", i, "produit_id"],
          message: "Produit déjà sélectionné dans une autre ligne",
        });
        const firstIdx = firstIndexByProd.get(pid)!;
        ctx.addIssue({
          code: "custom",
          path: ["lignes", firstIdx, "produit_id"],
          message: "Produit déjà sélectionné dans une autre ligne",
        });
      } else {
        firstIndexByProd.set(pid, i);
      }
    });
  });

type FormValues = z.infer<typeof FormSchema>;

// Formulaire d'édition (pré-rempli)
export default function EditChargementForm({
  chargementId,
  initialValues,
  clients,
  transports,
  produits,
}: {
  chargementId: string;
  initialValues: FormValues;
  clients: Opt[];
  transports: Opt[];
  produits: Prod[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Formulaire pré-rempli + validation zod
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray<FormValues, "lignes">({
    control: form.control,
    name: "lignes",
  });

  // Soumission : UPDATE
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (saving || deleting) return;
    try {
      setSaving(true);
      setMessage(null);

      //Je mets à jour le chargement
      const { error: e1 } = await supabase
        .from("chargements")
        .update({
          client_id: values.client_id,
          transport_id: values.transport_id,
          date_chargement: values.date_chargement,
        })
        .eq("id", chargementId);
      if (e1) throw e1;

      // Je prépare les lignes
      const payload = values.lignes.map((l) => ({
        chargement_id: chargementId,
        produit_id: l.produit_id,
        quantite: l.quantite,
      }));

      // Je remplace toutes les lignes (delete all => upsert)
      const { error: delErr } = await supabase
        .from("chargement_produits")
        .delete()
        .eq("chargement_id", chargementId);
      if (delErr) throw delErr;

      // Je réinsère **avec upsert** + clé de conflit (pas de doublons)
      const { error: upsertErr } = await supabase
        .from("chargement_produits")
        .upsert(payload, {
          onConflict: "chargement_id,produit_id",
        });
      if (upsertErr) throw upsertErr;

      setMessage("Chargement mis à jour");
      router.refresh();
      router.push("/chargements");
    } catch (err: unknown) {
      const pg = asPgError(err);
      const rawMsg =
        pg?.message ?? (err instanceof Error ? err.message : String(err));

      if (
        pg?.code === "21000" ||
        pg?.code === "23505" ||
        /cannot affect row a second time/i.test(rawMsg) ||
        /duplicate key value/i.test(rawMsg)
      ) {
        setMessage(
          "Ce produit est déjà présent dans ce chargement. Modifie la quantité plutôt que d'ajouter une ligne identique."
        );
      } else {
        setMessage("Une erreur est survenue. Merci de réessayer.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Permet la suppression du chargement quand je suis en mode 'edit' d'un chargement
  const onDelete = async () => {
    if (saving || deleting) return;

    try {
      setDeleting(true);
      setMessage(null);

      // Je supprime le chargement (les lignes partent en cascade)
      const { error: delErr } = await supabase
        .from("chargements")
        .delete()
        .eq("id", chargementId);
      if (delErr) throw delErr;

      setMessage("Chargement supprimé");
      router.refresh();
      router.push("/chargements");
    } catch (err: unknown) {
      const pg = asPgError(err);
      const rawMsg =
        pg?.message ?? (err instanceof Error ? err.message : String(err));
      setMessage(`${rawMsg}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client */}
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Transporteur */}
        <FormField
          control={form.control}
          name="transport_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transporteur</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un transporteur" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {transports.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date */}
        <FormField
          control={form.control}
          name="date_chargement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de chargement</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Lignes produits (dynamiques) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Produits</h3>
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ produit_id: "", quantite: 1 })}
            >
              + Ajouter une ligne
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-8 items-end">
              {/* Produit */}
              <div className="sm:col-span-5">
                <FormField
                  control={form.control}
                  name={`lignes.${index}.produit_id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un produit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {produits.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quantité */}
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name={`lignes.${index}.quantite`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? 1}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? "" : Number(v));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Retirer la ligne */}
              <div className="sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  Retirer
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving || deleting}>
              {saving ? "Mise à jour…" : "Mettre à jour"}
            </Button>
            {message && <span className="text-sm">{message}</span>}
          </div>

          {/* Bouton Supprimer (avec fenêtre de confirmation) */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={saving || deleting}
              >
                {deleting ? "Suppression…" : "Supprimer le chargement"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce chargement ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Les produits associés seront
                  également supprimés (suppression en cascade).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Confirmer la suppression
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </Form>
  );
}
