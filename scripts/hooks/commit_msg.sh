#!/bin/sh


if [ -z "$1" ]; then
  echo "ERROR: No commit message file provided" >&2
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "ERROR: Commit message file does not exist: $1" >&2
  exit 1
fi

MSG_CONTENT=$(cat "$1")
echo "DEBUG: Message content: '$MSG_CONTENT'" >&2

REGEX="^(feat|fix|chore|docs|style|refactor|test|perf|enhancement): .{1,100}"

if ! echo "$MSG_CONTENT" | grep -qE "$REGEX"; then
  echo "❌ Invalid commit message!"
  echo "Format must be: type: message"
  echo "Example: feat: add login support"
  exit 1
fi