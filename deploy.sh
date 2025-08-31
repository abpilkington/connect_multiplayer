#!/bin/bash

# 🚀 Multiplayer Connect 4 Deployment Script
# This script helps you deploy your game to different platforms

set -e

echo "🔴 Multiplayer Connect 4 - Deployment Script 🟡"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to build the project
build_project() {
    echo "🔨 Building project..."
    
    echo "📦 Installing dependencies..."
    npm install
    cd client && npm install && cd ..
    cd server && npm install && cd ..
    
    echo "🏗️ Building client..."
    cd client && npm run build && cd ..
    
    echo "🏗️ Building server..."
    cd server && npm run build && cd ..
    
    echo "✅ Build complete!"
}

# Function to deploy to GitHub Pages
deploy_github_pages() {
    echo "🚀 Deploying to GitHub Pages..."
    
    if [ ! -d ".git" ]; then
        echo "❌ Error: This is not a git repository"
        echo "Please run: git init && git remote add origin <your-repo-url>"
        exit 1
    fi
    
    echo "📝 Committing changes..."
    git add .
    git commit -m "Deploy to GitHub Pages" || echo "No changes to commit"
    
    echo "⬆️ Pushing to GitHub..."
    git push origin main || {
        echo "❌ Error: Failed to push to GitHub"
        echo "Please check your git remote and permissions"
        exit 1
    }
    
    echo "✅ GitHub Pages deployment initiated!"
    echo "📱 Your demo will be available at: https://yourusername.github.io/multiplayer_connect_4/"
    echo "⏳ It may take a few minutes for the changes to appear"
}

# Function to show deployment options
show_options() {
    echo ""
    echo "🎯 Deployment Options:"
    echo "1. Build project only"
    echo "2. Deploy to GitHub Pages (demo mode)"
    echo "3. Show full deployment guide"
    echo "4. Exit"
    echo ""
    read -p "Choose an option (1-4): " choice
    
    case $choice in
        1)
            build_project
            ;;
        2)
            build_project
            deploy_github_pages
            ;;
        3)
            echo ""
            echo "📚 Full Deployment Guide:"
            echo "For complete multiplayer deployment, see DEPLOYMENT.md"
            echo ""
            echo "🌐 Recommended platforms:"
            echo "- Render (free tier): https://render.com"
            echo "- Railway (free trial): https://railway.app"
            echo "- Heroku (paid): https://heroku.com"
            echo ""
            echo "📖 See DEPLOYMENT.md for detailed instructions"
            ;;
        4)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-4."
            show_options
            ;;
    esac
}

# Main execution
if [ "$1" = "--build-only" ]; then
    build_project
elif [ "$1" = "--github-pages" ]; then
    build_project
    deploy_github_pages
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo ""
    echo "Usage: ./deploy.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  --build-only      Build the project only"
    echo "  --github-pages    Build and deploy to GitHub Pages"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "No options: Interactive mode"
    exit 0
else
    show_options
fi

echo ""
echo "🎉 Deployment process completed!"
echo "📖 For more information, see DEPLOYMENT.md"
