#!/bin/bash
# Local Installation Script for EXL TRANSACTION LOG

echo "Starting Installation Process..."

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js and npm first."
    exit 1
else
    echo "- Node.js is installed."
fi

# Install npm dependencies
echo "Installing npm dependencies in the application..."
npm install

# Check and install system resources for conversion
echo "Installing system dependencies (LibreOffice and unoconv)..."

if command -v apt-get &> /dev/null
then
    echo "Using apt-get to install system packages..."
    apt-get update
    apt-get install -y libreoffice unoconv
elif command -v brew &> /dev/null
then
    echo "Using Homebrew to install system packages..."
    brew install --cask libreoffice
    brew install unoconv
else
    echo "Could not find apt-get or brew. Please manually install LibreOffice and unoconv on your system."
fi

echo "=========================================="
echo "Installation process has completed."
echo "You can now run 'npm run dev' to start the application."
echo "=========================================="
