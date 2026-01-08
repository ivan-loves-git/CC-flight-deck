import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import React from "react";

interface ItemCardProps {
  name: string;
  description: string;
  lastModified: Date;
  icon?: React.ReactNode;
}

export function ItemCard({ name, description, lastModified, icon }: ItemCardProps) {
  const relativeTime = formatDistanceToNow(lastModified, { addSuffix: true });

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader>
        <div className="flex items-start gap-3">
          {icon && <div className="text-muted-foreground mt-1">{icon}</div>}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base mb-1">{name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {description}
            </CardDescription>
            <div className="text-xs text-muted-foreground mt-2">
              {relativeTime}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
