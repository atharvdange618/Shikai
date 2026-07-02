#!/bin/bash
# Setup test GitHub account for Play Console review
# Usage:
#   1. Create a new GitHub account (e.g., shikai-reviewer)
#   2. Run: gh auth login (with the new account)
#   3. Run: bash scripts/setup-test-account.sh

set -e

echo "=== Shikai Test Account Setup ==="
echo ""

# Check if gh is authenticated
if ! gh auth status &>/dev/null; then
    echo "ERROR: gh CLI not authenticated."
    echo "Run: gh auth login"
    exit 1
fi

USERNAME=$(gh api user --jq '.login')
echo "Setting up repos for: $USERNAME"
echo ""

# Create repos with sample content
create_repo() {
    local name=$1
    local desc=$2
    local readme_content=$3
    local files=${4:-}

    echo "Creating repo: $name"
    gh repo create "$name" --public --description "$desc" --clone 2>/dev/null || true

    cd "$name" 2>/dev/null || cd "$USERNAME/$name" 2>/dev/null || {
        echo "  Cloning $name..."
        gh repo clone "$USERNAME/$name"
        cd "$name"
    }

    # Create README
    echo "$readme_content" > README.md

    # Create additional files if provided
    if [ -n "$files" ]; then
        eval "$files"
    fi

    git add -A
    git commit -m "Initial commit for Play Store review" --allow-empty 2>/dev/null || true
    git push origin main 2>/dev/null || git push origin master 2>/dev/null || true

    cd ..
    echo "  Done: $name"
    echo ""
}

# Repo 1: Sample React App
create_repo "sample-react-app" "A simple React demo app" \
"# Sample React App

A basic React application created for testing purposes.

## Features
- Component-based architecture
- State management with hooks
- Responsive design

## Tech Stack
- React 18
- TypeScript
- Vite

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## License
MIT" \
"
mkdir -p src/components
cat > src/App.tsx << 'APPEOF'
import React from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <div className=\"app\">
      <Header title=\"Sample App\" />
      <Dashboard />
    </div>
  );
}

export default App;
APPEOF

cat > src/components/Header.tsx << 'HEOF'
import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className=\"header\">
      <h1>{title}</h1>
    </header>
  );
};
HEOF

cat > src/components/Dashboard.tsx << 'DEOF'
import React, { useState, useEffect } from 'react';

export const Dashboard: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className=\"dashboard\">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};
DEOF

cat > package.json << 'PKGEOF'
{
  \"name\": \"sample-react-app\",
  \"version\": \"1.0.0\",
  \"scripts\": {
    \"dev\": \"vite\",
    \"build\": \"tsc && vite build\"
  },
  \"dependencies\": {
    \"react\": \"^18.2.0\",
    \"react-dom\": \"^18.2.0\"
  }
}
PKGEOF
"

# Repo 2: Python Scripts
create_repo "python-scripts" "Collection of Python utility scripts" \
"# Python Scripts

A collection of useful Python scripts for various tasks.

## Scripts

### hello.py
Basic hello world script.

### calculator.py
Simple command-line calculator.

### file_organizer.py
Organizes files by extension.

## Requirements
- Python 3.8+
- No external dependencies

## Usage
\`\`\`bash
python hello.py
python calculator.py
\`\`\`

## License
MIT" \
"
cat > hello.py << 'PYEOF'
#!/usr/bin/env python3
\"\"\"A simple hello world script.\"\"\"

def greet(name: str) -> str:
    return f\"Hello, {name}! Welcome to Python.\"

if __name__ == \"__main__\":
    print(greet(\"World\"))
PYEOF

cat > calculator.py << 'PYEOF'
#!/usr/bin/env python3
\"\"\"Simple command-line calculator.\"\"\"

def add(a: float, b: float) -> float:
    return a + b

def subtract(a: float, b: float) -> float:
    return a - b

def multiply(a: float, b: float) -> float:
    return a * b

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError(\"Cannot divide by zero\")
    return a / b

if __name__ == \"__main__\":
    print(\"Calculator\")
    print(f\"5 + 3 = {add(5, 3)}\")
    print(f\"10 - 4 = {subtract(10, 4)}\")
    print(f\"6 * 7 = {multiply(6, 7)}\")
    print(f\"15 / 3 = {divide(15, 3)}\")
PYEOF

cat > file_organizer.py << 'PYEOF'
#!/usr/bin/env python3
\"\"\"Organizes files in a directory by extension.\"\"\"

import os
from pathlib import Path

EXTENSION_MAP = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.md': 'markdown',
    '.txt': 'text',
    '.jpg': 'images',
    '.png': 'images',
}

def organize(directory: str) -> None:
    path = Path(directory)
    for file in path.iterdir():
        if file.is_file():
            ext = file.suffix.lower()
            if ext in EXTENSION_MAP:
                dest = path / EXTENSION_MAP[ext]
                dest.mkdir(exist_ok=True)
                file.rename(dest / file.name)
                print(f\"Moved {file.name} -> {EXTENSION_MAP[ext]}/\")
PYEOF
"

# Repo 3: Android Project
create_repo "android-project" "Sample Android project with Kotlin" \
"# Android Sample Project

A basic Android application built with Kotlin.

## Features
- Material Design 3
- Kotlin Coroutines
- MVVM Architecture

## Requirements
- Android Studio Hedgehog+
- Kotlin 1.9
- Gradle 8.0

## Build
\`\`\`bash
./gradlew assembleDebug
\`\`\`

## License
MIT" \
"
mkdir -p app/src/main/java/com/sample/app

cat > app/src/main/java/com/sample/app/MainActivity.kt << 'KTEOF'
package com.sample.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
KTEOF

cat > app/build.gradle << 'GRDEOF'
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    compileSdk 34
    defaultConfig {
        applicationId \"com.sample.app\"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName \"1.0\"
    }
}
GRDEOF

cat > README.md << 'RDEOF'
# Android Sample Project

A basic Android application built with Kotlin.

## Features
- Material Design 3
- Kotlin Coroutines
- MVVM Architecture

## License
MIT
RDEOF
"

# Repo 4: Documentation
create_repo "documentation" "Project documentation and notes" \
"# Documentation

Technical documentation and development notes.

## Contents

### architecture.md
High-level architecture overview.

### api-reference.md
API endpoint documentation.

### contributing.md
Guidelines for contributing.

## Links
- [GitHub Docs](https://docs.github.com)
- [React Docs](https://react.dev)

## License
MIT" \
"
cat > architecture.md << 'ARCHEOF'
# Architecture Overview

## Frontend
- React with TypeScript
- React Router for navigation
- React Query for data fetching

## Backend
- GitHub REST API
- Cloudflare Workers for OAuth proxy

## Data Flow
1. User authenticates via GitHub OAuth
2. Token stored securely on device
3. API calls made directly to GitHub
4. Responses cached for offline use

## Security
- Read-only GitHub access
- No server-side data storage
- Root device detection
ARCHEOF

cat > api-reference.md << 'APIEOF'
# API Reference

## GitHub REST API

### Authentication
- POST /login/oauth/access_token

### User
- GET /user
- GET /users/{username}

### Repositories
- GET /user/repos
- GET /repos/{owner}/{repo}

### Search
- GET /search/repositories
- GET /search/users

### Notifications
- GET /notifications
- PUT /notifications/threads/{thread_id}

## Rate Limits
- Authenticated: 5000 requests/hour
- Unauthenticated: 60 requests/hour
APIEOF

cat > contributing.md << 'CONTEOF'
# Contributing Guidelines

## Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful commit messages

## Testing
- Write tests for new features
- Ensure all tests pass before submitting

## Code of Conduct
- Be respectful
- Welcome newcomers
- Focus on constructive feedback
CONTEOF
"

echo "=== Setup Complete ==="
echo ""
echo "Next steps for Play Console review:"
echo "1. Add a profile photo to: https://github.com/$USERNAME"
echo "2. Add a bio: 'Test account for Shikai app review'"
echo "3. Star 5-10 popular repos (react, expo, etc.)"
echo "4. Follow 3-5 users (expo, reactjs, etc.)"
echo "5. Watch 2-3 repos"
echo "6. Enable notifications in Settings > Notifications"
echo ""
echo "Provide these to Play Console:"
echo "  Username: $USERNAME"
echo "  Password: [your password]"
echo ""
echo "Done!"
