#!/bin/sh
bun lint || (echo "❌ Lint check failed. Please fix ESLint errors before pushing." && exit 1)