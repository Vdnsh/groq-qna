#!/bin/bash

# Auto-commit script that commits after every 3 changes
COUNTER_FILE=".git/change-counter.txt"
CHANGES_THRESHOLD=3

# Initialize counter if it doesn't exist
if [ ! -f "$COUNTER_FILE" ]; then
    echo "0" > "$COUNTER_FILE"
fi

# Read current count
CURRENT_COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
CURRENT_COUNT=$((CURRENT_COUNT + 1))

# Update counter
echo "$CURRENT_COUNT" > "$COUNTER_FILE"

echo "Change detected. Count: $CURRENT_COUNT/$CHANGES_THRESHOLD"

# Check if we've reached the threshold
if [ "$CURRENT_COUNT" -ge "$CHANGES_THRESHOLD" ]; then
    echo "Reached $CHANGES_THRESHOLD changes. Auto-committing..."
    
    # Stage all changes
    git add -A
    
    # Create commit with timestamp
    COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S') - $CURRENT_COUNT changes"
    git commit -m "$COMMIT_MSG"
    
    # Reset counter
    echo "0" > "$COUNTER_FILE"
    
    echo "Auto-commit completed: $COMMIT_MSG"
else
    echo "Waiting for more changes ($CURRENT_COUNT/$CHANGES_THRESHOLD)..."
fi

