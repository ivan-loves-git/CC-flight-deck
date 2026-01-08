import { Input } from "@/components/ui/input";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="mb-8 space-y-4">
      <h1 className="text-4xl font-bold">Claude Code Flight Deck</h1>
      <Input
        type="search"
        placeholder="Search commands, agents, plugins, hooks, and skills..."
        className="max-w-xl"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </header>
  );
}
