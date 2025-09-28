#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy the dist folder to temp directory
cp -r dist/* "$TEMP_DIR/"

# Navigate to temp directory
cd "$TEMP_DIR"

# Initialize git repository
git init
git add .
git commit -m "Deploy to GitHub Pages"

# Add the gh-pages branch as remote
git remote add origin https://github.com/agnesh02backup/ernakulam-dine-flow.git

# Push to gh-pages branch
echo "Pushing to gh-pages branch..."
git push -f origin main:gh-pages

# Clean up
cd ..
rm -rf "$TEMP_DIR"

echo "Deployment complete! Your site should be available at:"
echo "https://agnesh02backup.github.io/ernakulam-dine-flow/"
