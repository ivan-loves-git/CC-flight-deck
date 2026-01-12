#!/bin/bash
# Convert iTerm HTML logs to plain text
# Reduces 5.2GB → ~50MB (or ~5MB compressed)

LOGS_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Progetti/_archive/iTerm Sessions"
OUTPUT_DIR="$LOGS_DIR/converted"
COMPRESS=false

# Parse args
if [[ "$1" == "--compress" ]]; then
    COMPRESS=true
fi

mkdir -p "$OUTPUT_DIR"

echo "Converting iTerm logs..."
echo "Source: $LOGS_DIR"
echo "Output: $OUTPUT_DIR"
echo "Compress: $COMPRESS"
echo ""

total_original=0
total_converted=0
count=0

for file in "$LOGS_DIR"/*.log; do
    [[ -f "$file" ]] || continue

    filename=$(basename "$file")
    output_file="$OUTPUT_DIR/${filename%.log}.txt"

    # Get original size
    original_size=$(stat -f%z "$file")
    total_original=$((total_original + original_size))

    # Convert: strip HTML tags, convert <br/> to newlines
    sed 's/<br\/>/\n/g; s/<[^>]*>//g' "$file" > "$output_file"

    if [[ "$COMPRESS" == true ]]; then
        gzip -f "$output_file"
        output_file="$output_file.gz"
    fi

    converted_size=$(stat -f%z "$output_file")
    total_converted=$((total_converted + converted_size))
    count=$((count + 1))

    # Progress
    orig_mb=$(echo "scale=1; $original_size/1048576" | bc)
    conv_mb=$(echo "scale=2; $converted_size/1048576" | bc)
    echo "[$count] $filename: ${orig_mb}MB → ${conv_mb}MB"
done

echo ""
echo "=========================================="
echo "Total files: $count"
echo "Original:    $(echo "scale=2; $total_original/1073741824" | bc)GB"
echo "Converted:   $(echo "scale=2; $total_converted/1073741824" | bc)GB"
echo "Savings:     $(echo "scale=1; 100 - ($total_converted * 100 / $total_original)" | bc)%"
echo ""
echo "Converted files in: $OUTPUT_DIR"
