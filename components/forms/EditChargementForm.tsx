"use client";

import { useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
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

type Opt = { id: string; nom: string };
type Prod = { id: string; nom: string; poids?: number | null };

// Schéma de validation avec zod
const LigneSchema = z.object({
  produit_id: z.string().min(1, "Sélectionner un produit"),
  quantite: z.number().int().positive("Quantité > 0"),
});
const FormSchema = z.object({
  client_id: z.string().min(1, "Sélectionner un client"),
  transport_id: z.string().min(1, "Sélectionner un transporteur"),
  date_chargement: z.string().min(1),
  lignes: z.array(LigneSchema).min(1, "Ajouter au moins un produit"),
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
  const [message, setMessage] = useState<string | null>(null);

  // Formulaire pré-rempli + validation zod
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray<FormValues, "lignes">({
    control: form.control,
    name: "lignes",
  });

  // Soumission : UPDATE
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (saving) return;
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

      // 2) Je remplace les lignes
      const payload = values.lignes.map((l) => ({
        chargement_id: chargementId,
        produit_id: l.produit_id,
        quantite: l.quantite,
      }));

      // Je supprime toutes les lignes existantes pour ce chargement
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
      router.push("/chargements");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : JSON.stringify(err);
      setMessage(`${msg}`);
    } finally {
      setSaving(false);
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

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Mise à jour…" : "Mettre à jour"}
          </Button>
          {message && <span className="text-sm">{message}</span>}
        </div>
      </form>
    </Form>
  );
}
