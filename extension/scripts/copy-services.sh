#!/bin/bash
# Copy services from parent directory to extension for building

echo "📦 Copying services to extension directory..."

# Remove old services if they exist
rm -rf src/services

# Copy services directory
cp -r ../src/services src/services

# Remove test files (not needed in extension)
find src/services -name "*.test.ts" -delete
find src/services -name "*.test.js" -delete
find src/services -type d -name "__tests__" -exec rm -rf {} + 2>/dev/null || true

echo "✅ Services copied successfully!"

