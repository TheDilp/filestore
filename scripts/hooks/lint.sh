#!/bin/sh
cd client && bun run lint || (echo "❌ Lint check failed. Please fix ESLint errors before pushing." && exit 1)