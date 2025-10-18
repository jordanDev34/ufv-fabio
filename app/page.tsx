import { redirect } from "next/navigation";

// Redirection vers la page des chargements
export default function Home() {
  redirect("/chargements");
}
