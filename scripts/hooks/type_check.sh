#!/bin/sh
cd client && bun tsc || (echo "❌ Type check failed. Please fix TypeScript errors before pushing." && exit 1)