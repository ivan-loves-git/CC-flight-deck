'use client';

import { useState } from 'react';
import { AlertTriangle, Info, XCircle, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { DataHealthWarning, WarningSeverity } from '@/lib/data-health';

interface DataHealthWarningsProps {
  warnings: DataHealthWarning[];
}

const severityConfig: Record<WarningSeverity, {
  icon: typeof AlertTriangle;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  error: {
    icon: XCircle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    textColor: 'text-red-600',
    badgeVariant: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-600',
    badgeVariant: 'secondary',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-600',
    badgeVariant: 'outline',
  },
};

export function DataHealthWarnings({ warnings }: DataHealthWarningsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleWarnings = warnings.filter(w => !dismissedIds.has(w.id));

  if (visibleWarnings.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  return (
    <div className="space-y-2">
      {visibleWarnings.map((warning) => {
        const config = severityConfig[warning.severity];
        const Icon = config.icon;
        const isExpanded = expandedId === warning.id;

        return (
          <Collapsible
            key={warning.id}
            open={isExpanded}
            onOpenChange={(open) => setExpandedId(open ? warning.id : null)}
          >
            <div
              className={`rounded-lg border ${config.bgColor} ${config.borderColor} p-3`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.textColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-1 text-sm font-medium hover:underline">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {warning.title}
                      </button>
                    </CollapsibleTrigger>
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {warning.affectedCount}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {warning.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => handleDismiss(warning.id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Dismiss</span>
                </Button>
              </div>

              <CollapsibleContent>
                {warning.details && warning.details.length > 0 && (
                  <ul className="mt-2 ml-7 space-y-1">
                    {warning.details.map((detail, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
