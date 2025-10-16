import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl">
        Test shadcn/ui via création component button : OK{" "}
      </h1>
      <Button>Test bouton Shadcn</Button>
      <h3 className="text-2xl text-blue-600 mt-4">Test Tailwind CSS en bleu</h3>
      <h3 className="text-2xl text-red-600">Test Tailwind CSS en rouge</h3>
    </main>
  );
}
