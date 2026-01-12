#!/bin/bash
# Cleanup iTerm logs that have already been processed by /term-diary
# Options:
#   --compress  : gzip processed logs (5.2GB → ~500MB)
#   --delete    : delete processed logs entirely (5.2GB → 0)
#   --dry-run   : show what would happen without doing it

LOGS_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Progetti/_archive/iTerm Sessions"
FLIGHT_DATA="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Progetti/ai--CC-flight-deck/flight-data.json"

MODE="dry-run"
if [[ "$1" == "--compress" ]]; then
    MODE="compress"
elif [[ "$1" == "--delete" ]]; then
    MODE="delete"
elif [[ "$1" == "--dry-run" ]]; then
    MODE="dry-run"
else
    echo "Usage: $0 [--compress|--delete|--dry-run]"
    echo ""
    echo "  --dry-run   Show what would be cleaned up (default)"
    echo "  --compress  Gzip processed logs (~90% space savings)"
    echo "  --delete    Delete processed logs entirely"
    exit 1
fi

# Check if flight-data.json exists
if [[ ! -f "$FLIGHT_DATA" ]]; then
    echo "ERROR: flight-data.json not found at $FLIGHT_DATA"
    echo "Run /term-diary first to process logs."
    exit 1
fi

# Get list of processed files from flight-data.json
echo "Reading processed files from flight-data.json..."
PROCESSED_FILES=$(python3 -c "
import json
with open('$FLIGHT_DATA') as f:
    data = json.load(f)
for filename in data.get('state', {}).get('processedFiles', {}).keys():
    print(filename)
")

if [[ -z "$PROCESSED_FILES" ]]; then
    echo "No processed files found in flight-data.json"
    exit 0
fi

PROCESSED_COUNT=$(echo "$PROCESSED_FILES" | wc -l | tr -d ' ')
echo "Found $PROCESSED_COUNT processed log files"
echo ""

# Use Python for reliable file handling (spaces in filenames)
python3 << PYEOF
import json
import os
import gzip
import shutil

logs_dir = "$LOGS_DIR"
flight_data = "$FLIGHT_DATA"
mode = "$MODE"

with open(flight_data) as f:
    data = json.load(f)

processed = data.get('state', {}).get('processedFiles', {})
total_size = 0
cleanup_count = 0

print("Checking logs directory...")
for filename in processed.keys():
    filepath = os.path.join(logs_dir, filename)

    if not os.path.exists(filepath):
        continue

    size = os.path.getsize(filepath)
    total_size += size
    cleanup_count += 1
    size_mb = size / 1048576

    if mode == "dry-run":
        print(f"  Would process: {filename[:60]}... ({size_mb:.1f}MB)")
    elif mode == "compress":
        print(f"  Compressing: {filename[:60]}... ({size_mb:.1f}MB)")
        with open(filepath, 'rb') as f_in:
            with gzip.open(filepath + '.gz', 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        os.remove(filepath)
    elif mode == "delete":
        print(f"  Deleting: {filename[:60]}... ({size_mb:.1f}MB)")
        os.remove(filepath)

print()
print("=" * 40)
print(f"Files to clean: {cleanup_count}")
print(f"Space to reclaim: {total_size/1073741824:.2f}GB")
PYEOF

echo ""
if [[ "$MODE" == "dry-run" ]]; then
    echo "This was a dry run. To actually clean up, run:"
    echo "  $0 --compress   # Keep compressed copies (~90% smaller)"
    echo "  $0 --delete     # Delete entirely"
elif [[ "$MODE" == "compress" ]]; then
    echo "Done! Logs compressed to .gz files"
    echo "Compressed files in: $LOGS_DIR"
elif [[ "$MODE" == "delete" ]]; then
    echo "Done! Processed logs deleted"
fi
