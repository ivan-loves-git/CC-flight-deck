import { Target } from 'lucide-react';
import { Skill } from '@/lib/types';
import { ItemCard } from './ItemCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SkillListProps {
  skills: Skill[];
}

export function SkillList({ skills }: SkillListProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          SKILLS
          <span className="text-sm text-muted-foreground">({skills.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complex multi-step capabilities
        </p>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          {skills.map((skill) => (
            <ItemCard
              key={skill.path}
              icon={<Target className="h-4 w-4" />}
              name={skill.name}
              description={skill.description}
              lastModified={skill.lastModified}
              path={skill.path}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
