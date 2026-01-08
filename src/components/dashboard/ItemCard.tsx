import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import React, { useState } from "react";

interface ItemCardProps {
  name: string;
  description: string;
  lastModified: Date;
  icon?: React.ReactNode;
  path: string;
}

export function ItemCard({ name, description, lastModified, icon, path }: ItemCardProps) {
  const relativeTime = formatDistanceToNow(lastModified, { addSuffix: true });
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = async () => {
    setIsOpening(true);
    try {
      const response = await fetch('/api/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        console.error('Failed to open file in VS Code');
      }
    } catch (error) {
      console.error('Error opening file:', error);
    } finally {
      setIsOpening(false);
    }
  };

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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpen}
            disabled={isOpening}
            className="shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
