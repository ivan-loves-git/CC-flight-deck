#!/usr/bin/env python3
"""
Extract clean conversations from iTerm HTML logs.
Preserves timestamps, filters out UI noise and duplicates.

Usage:
    python3 extract-conversations.py                    # Process all logs
    python3 extract-conversations.py --file <log>      # Process single file
    python3 extract-conversations.py --compress        # Output as .gz
"""

import re
import os
import sys
import gzip
import glob
from pathlib import Path
from datetime import datetime
from collections import OrderedDict

LOGS_DIR = os.path.expanduser(
    "~/Library/Mobile Documents/com~apple~CloudDocs/Progetti/_archive/iTerm Sessions"
)
OUTPUT_DIR = os.path.join(LOGS_DIR, "extracted")

# Patterns to identify content types
NOISE_PATTERNS = [
    r'^[\s─░▓█▐▛▜▝▘✽✢✳✻·\*\|\-]*$',  # UI decorations (including dashes)
    r'^[─\s]+$',                       # Lines of just dashes
    r'─{10,}',                         # Long dash sequences
    r'^\s*◯\s*/ide',                   # IDE hint
    r'^\s*⏱️',                         # Timer
    r'Vibing.*interrupt',              # Thinking indicator
    r'^\s*\[\w+\s*\d+\.\d+\]',         # Model indicator [Opus 4.5]
    r'^\s*Todos?\s*$',                 # Todo header
    r'^\s*☐\s*Phase \d+',              # Phase todos (repeated)
    r'^\s*▸\s*Phase \d+',              # Phase indicator
    r'CLAUDE\.md.*MCPs',               # Status bar
    r'^\s*/\w+\s+\w',                  # Command menu items
]

def is_noise(text):
    """Check if text is UI noise."""
    text = text.strip()
    if len(text) < 5:
        return True
    for pattern in NOISE_PATTERNS:
        if re.search(pattern, text):
            return True
    return False

def extract_conversation(filepath):
    """Extract timestamped conversation from an iTerm log."""
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Replace <br/> with newlines
    content = content.replace('<br/>', '\n')

    # Extract all spans with timestamps (hour can be 1 or 2 digits)
    # Note: space before AM/PM may be \u202f (narrow no-break space) or regular space
    pattern = r"<span title='(\d{1,2}/\d{2}/\d{4}, \d{1,2}:\d{2}:\d{2},\d{3}[\s\u202f][AP]M)'[^>]*>([^<]*)</span>"
    matches = re.findall(pattern, content)

    if not matches:
        return None

    # Group text by minute, deduplicate
    minutes = OrderedDict()

    for timestamp, text in matches:
        if not text or not text.strip():
            continue

        # Parse timestamp to minute granularity
        try:
            # Normalize special spaces to regular space
            ts_normalized = timestamp.replace('\u202f', ' ')
            dt = datetime.strptime(ts_normalized, "%d/%m/%Y, %I:%M:%S,%f %p")
            minute_key = dt.strftime("%Y-%m-%d %H:%M")
        except ValueError:
            continue

        if minute_key not in minutes:
            minutes[minute_key] = set()

        # Add non-noise text (dedupe within minute)
        clean_text = text.strip()
        if clean_text and len(clean_text) > 2:
            minutes[minute_key].add(clean_text)

    # Build output - combine text per minute, filter noise
    output_lines = []
    last_content = ""

    for minute, texts in minutes.items():
        # Combine all text fragments for this minute
        combined = ' '.join(sorted(texts, key=len, reverse=True))
        combined = ' '.join(combined.split())  # Normalize whitespace

        # Skip if it's noise or duplicate of previous
        if is_noise(combined):
            continue
        if combined == last_content:
            continue

        # Skip very short or very repetitive content
        if len(combined) < 20:
            continue

        output_lines.append(f"[{minute}] {combined[:500]}")
        last_content = combined

    return '\n'.join(output_lines)

def process_all_logs(compress=False):
    """Process all log files."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    log_files = glob.glob(os.path.join(LOGS_DIR, "*.log"))

    if not log_files:
        print(f"No .log files found in {LOGS_DIR}")
        return

    print(f"Processing {len(log_files)} log files...")
    print(f"Output: {OUTPUT_DIR}")
    print()

    total_original = 0
    total_extracted = 0

    for i, filepath in enumerate(sorted(log_files), 1):
        filename = os.path.basename(filepath)
        original_size = os.path.getsize(filepath)
        total_original += original_size

        print(f"[{i}/{len(log_files)}] {filename[:50]}...", end=" ", flush=True)

        try:
            conversation = extract_conversation(filepath)

            if not conversation:
                print("(no conversation found)")
                continue

            # Output filename
            output_name = filename.replace('.log', '.txt')
            output_path = os.path.join(OUTPUT_DIR, output_name)

            if compress:
                output_path += '.gz'
                with gzip.open(output_path, 'wt', encoding='utf-8') as f:
                    f.write(conversation)
            else:
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(conversation)

            extracted_size = os.path.getsize(output_path)
            total_extracted += extracted_size

            ratio = (1 - extracted_size / original_size) * 100
            print(f"{original_size/1048576:.1f}MB → {extracted_size/1024:.0f}KB ({ratio:.0f}% smaller)")

        except Exception as e:
            print(f"ERROR: {e}")

    print()
    print("=" * 50)
    print(f"Total original:  {total_original/1073741824:.2f} GB")
    print(f"Total extracted: {total_extracted/1048576:.1f} MB")
    print(f"Space saved:     {(1 - total_extracted/total_original) * 100:.1f}%")
    print(f"Output in:       {OUTPUT_DIR}")

def main():
    compress = '--compress' in sys.argv

    if '--file' in sys.argv:
        idx = sys.argv.index('--file')
        if idx + 1 < len(sys.argv):
            filepath = sys.argv[idx + 1]
            result = extract_conversation(filepath)
            if result:
                print(result)
            else:
                print("No conversation found")
    else:
        process_all_logs(compress=compress)

if __name__ == "__main__":
    main()
