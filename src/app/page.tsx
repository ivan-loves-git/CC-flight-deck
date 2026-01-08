import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Claude Code Flight Deck</h1>
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Your Claude Code customizations dashboard is initializing...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
