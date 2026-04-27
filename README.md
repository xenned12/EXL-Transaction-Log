# EXL TRANSACTION LOG

A full-stack React and Express application designed to analyze, process, and handle document file uploads (including `.docx`, `.xlsx`, `.pdf`, and images). This application relies on server-side capabilities for reliable Word and Excel to PDF conversions using `LibreOffice` and `unoconv`, but features a fallback client-side document processing setup.

## Prerequisites & Requirements

To run this application locally, you must ensure the following are installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (Node Package Manager)
- **LibreOffice** (For robust `.docx` and `.xlsx` conversion on the backend)
- **unoconv** (Used by the backend to interface with LibreOffice for file conversion)

If `LibreOffice/unoconv` are not available, the application gracefully handles the fallback to client-side conversions, though formatting may not be completely preserved.

## Installation Instructions

We provide a convenient installation script (`install.sh`) to help get your local environment running smoothly simply. It handles installing dependencies for the Node environment as well as LibreOffice and unoconv via your operating system's package manager.

1. **Clone the repository:**
   Ensure you have the latest code pulled locally onto your machine.

2. **Run the installation script:**
   In your terminal shell block, execute the provided script to start the installation procedure:
   
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   > NOTE: Depending on your system (e.g., Linux vs macOS), the script might ask for `sudo` password to install system dependencies via `apt-get` or it may use `brew`.

3. **Start the local development server:**
   Once installation is complete, start the development server using:
   
   ```bash
   npm run dev
   ```
   The application will become available at `http://localhost:3000`.

## Scripts Available

- `npm run dev`: Starts the application logic using Vite's middleware inside an Express backend.
- `npm run build`: Bundles the React assets for production distribution into the `dist` folder.
- `npm start`: Runs the Node.js production web server, serving static React assets.
- `npm run lint`: Performs typescript assertions logic to find compilation errors without building the assets.

## Stack Overview
- **Frontend Core:** React, Vite, Tailwind CSS, Framer Motion
- **Backend Core:** Express, Node.js (`tsx`)
- **Document Processing:** `docx2pdf-converter`, `html2canvas`, `jspdf`, `exceljs`, `docx-preview`
