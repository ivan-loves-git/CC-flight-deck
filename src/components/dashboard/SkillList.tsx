import { Target } from 'lucide-react';
import { Skill } from '@/lib/types';
import { ItemCard } from './ItemCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SkillListProps {
  skills: Skill[];
}

export function SkillList({ skills }: SkillListProps) {
  // Count plugin vs global skills
  const pluginCount = skills.filter(s => s.scope === 'plugin').length;
  const globalCount = skills.filter(s => s.scope === 'global').length;

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
          {pluginCount > 0 && globalCount > 0 && (
            <span className="ml-2">
              ({globalCount} global, {pluginCount} from plugins)
            </span>
          )}
        </p>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          {skills.map((skill) => (
            <div key={skill.path} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <ItemCard
                  icon={<Target className="h-4 w-4" />}
                  name={skill.name}
                  description={skill.description}
                  lastModified={skill.lastModified}
                  path={skill.path}
                />
              </div>
              {skill.scope === 'plugin' && (
                <Badge
                  variant="outline"
                  className="bg-purple-600 text-white border-purple-600 shrink-0"
                >
                  Plugin
                </Badge>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
