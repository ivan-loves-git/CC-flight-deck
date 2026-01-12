import path from 'path';
import os from 'os';

// Flight Deck data paths
export const FLIGHT_DATA_PATH = path.join(
  os.homedir(),
  'Library/Mobile Documents/com~apple~CloudDocs/Progetti/ai--CC-flight-deck/flight-data.json'
);

// Legacy path (deprecated)
export const USAGE_STATS_PATH = path.join(
  os.homedir(),
  'Library/Mobile Documents/com~apple~CloudDocs/Progetti/ai--CC-flight-deck/usage-stats.json'
);

// iTerm session logs
export const ITERM_LOGS_PATH = path.join(
  os.homedir(),
  'Library/Application Support/iTerm2/iterm2-shell-integration/logs'
);

// Claude configuration
export const CLAUDE_CONFIG_PATH = path.join(os.homedir(), '.claude');

// Projects directory (where all code projects live)
export const PROGETTI_PATH = path.join(
  os.homedir(),
  'Library/Mobile Documents/com~apple~CloudDocs/Progetti'
);
