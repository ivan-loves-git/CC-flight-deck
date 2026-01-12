// Project category colors
export const PROJECT_COLORS: Record<string, string> = {
  'ai': '#3b82f6',
  'emba': '#8b5cf6',
  'entrep': '#f97316',
  'career': '#22c55e',
  'family': '#ec4899',
  'ge': '#eab308',
};

// Get color for a project based on its category prefix
export function getProjectColor(name: string): string {
  const match = name.match(/^([a-z]+)--/);
  return match && PROJECT_COLORS[match[1]] ? PROJECT_COLORS[match[1]] : '#6b7280';
}

// Extract project name without category prefix
export function getProjectName(fullName: string): string {
  const match = fullName.match(/^[a-z]+--(.+)$/);
  return match ? match[1] : fullName;
}

// Get category from full project name
export function getProjectCategory(fullName: string): string {
  const match = fullName.match(/^([a-z]+)--/);
  return match ? match[1].toUpperCase() : '';
}

// Format minutes as human-readable duration
export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Format file size as human-readable
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Extract time from session ID (format: YYYYMMDD_HHMMSS)
export function extractTimeFromId(id: string): string {
  const match = id.match(/^\d{8}_(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return id;
}
