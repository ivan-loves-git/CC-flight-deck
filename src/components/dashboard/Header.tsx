import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="mb-8 space-y-4">
      <h1 className="text-4xl font-bold">Claude Code Flight Deck</h1>
      <Input
        type="search"
        placeholder="Search commands, agents, plugins, hooks, and skills..."
        className="max-w-xl"
      />
    </header>
  );
}
