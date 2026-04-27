import { execSync } from 'child_process';

console.log("Starting installation Process...");

try {
  execSync('npm install', { stdio: 'inherit' });
  console.log("NPM packages installed.");
  
  console.log("Installing libreoffice and unoconv...");
  execSync('apt-get update', { stdio: 'inherit' });
  execSync('apt-get install -y libreoffice unoconv', { stdio: 'inherit' });
  console.log("System packages installed successfully.");
} catch (e: any) {
  console.error("Installation failed:", e.message);
}
