import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import cors from "cors";
import multer from "multer";
import os from "os";

// Initialize express
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DB_FILE = path.resolve(process.cwd(), "database.xlsx");

// Ensure the spreadsheet database exists
const initDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const wb = xlsx.utils.book_new();
    
    // Users table
    const usersData = [
      { id: "admin", username: "admin", email: "admin@system.local", password: "admin", role: "admin", needsPasswordChange: true }
    ];
    const usersSheet = xlsx.utils.json_to_sheet(usersData);
    xlsx.utils.book_append_sheet(wb, usersSheet, "users");

    // Transactions table
    const txSheet = xlsx.utils.json_to_sheet([]);
    xlsx.utils.book_append_sheet(wb, txSheet, "transactions");

    // Shifts table
    const shiftsSheet = xlsx.utils.json_to_sheet([]);
    xlsx.utils.book_append_sheet(wb, shiftsSheet, "shifts");

    const outBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(DB_FILE, outBuffer);
  }
};

const getSheetData = (sheetName: string) => {
  if (!fs.existsSync(DB_FILE)) initDB();
  const buffer = fs.readFileSync(DB_FILE);
  const wb = xlsx.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return xlsx.utils.sheet_to_json(sheet);
};

const saveSheetData = (sheetName: string, data: any[]) => {
  if (!fs.existsSync(DB_FILE)) initDB();
  const buffer = fs.readFileSync(DB_FILE);
  const wb = xlsx.read(buffer, { type: "buffer" });
  const newSheet = xlsx.utils.json_to_sheet(data);
  wb.Sheets[sheetName] = newSheet;
  const outBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  fs.writeFileSync(DB_FILE, outBuffer);
};

initDB();

// --- API ROUTES ---

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = getSheetData("users") as any[];
  
  const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Update User
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let users = getSheetData("users") as any[];
  
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveSheetData("users", users);
    res.json({ user: users[index] });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Get Users
app.get("/api/users", (req, res) => {
  const users = getSheetData("users");
  res.json({ users });
});

// Add User
app.post("/api/users", (req, res) => {
  const newUser = { id: Math.random().toString(36).substring(7), ...req.body };
  const users = getSheetData("users");
  users.push(newUser);
  saveSheetData("users", users);
  res.json({ user: newUser });
});

// Delete User
app.delete("/api/users/:id", (req, res) => {
  let users = getSheetData("users") as any[];
  users = users.filter(u => u.id !== req.params.id);
  saveSheetData("users", users);
  res.json({ success: true });
});

// Get Transactions
app.get("/api/transactions", (req, res) => {
  const txs = getSheetData("transactions");
  res.json({ transactions: txs });
});

// Add Transaction
app.post("/api/transactions", (req, res) => {
  const newTx = { id: Math.random().toString(36).substring(7), ...req.body, timestamp: Date.now() };
  const txs = getSheetData("transactions");
  txs.push(newTx);
  saveSheetData("transactions", txs);
  res.json({ transaction: newTx });
});

// Add Shift
app.post("/api/shifts", (req, res) => {
  const newShift = { id: Math.random().toString(36).substring(7), ...req.body };
  const shifts = getSheetData("shifts");
  shifts.push(newShift);
  saveSheetData("shifts", shifts);
  res.json({ shift: newShift });
});

import * as docx2pdf from "docx2pdf-converter";

const upload = multer({ dest: os.tmpdir() });

app.post("/api/analyze-file", upload.single("file"), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  try {
    const filePath = req.file.path;
    const name = req.file.originalname.toLowerCase();
    
    if (name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
       const outputPath = path.join(os.tmpdir(), `${req.file.filename}.pdf`);
       try {
           docx2pdf.convert(filePath, outputPath);
           if (fs.existsSync(outputPath)) {
               const pdfBuffer = fs.readFileSync(outputPath);
               res.json({ success: true, pdfBase64: pdfBuffer.toString('base64') });
           } else {
               throw new Error("Conversion output not found");
           }
       } catch (err: any) {
           // LibreOffice/unoconv is not available or failed. Bypass and let client handle it.
           // Silently return success: false so the client handles the fallback.
           return res.status(200).json({ success: false, bypass: true, error: "Conversion failed via docx2pdf-converter", details: err.message });
       }
    } else {
       res.status(400).json({ error: "Unsupported file for server conversion" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
       fs.unlinkSync(req.file.path);
    }
  }
});


// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
