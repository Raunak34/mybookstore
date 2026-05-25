import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import routes from './server/routes.js';
import { connectDb as connectToDatabase } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize DB Connection (loads MongoDB Atlas or robust JSON file local DB)
  await connectToDatabase();

  // Basic Middlewares
  app.use(express.json());
  
  // Custom headers logic
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Mount entire backend REST APIs
  app.use('/api', routes);

  // Serve Frontend Assets
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (isProduction) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn("Production requested but 'dist' catalog is not built yet. Serve check fallback.");
      app.get('/', (req, res) => {
        res.status(200).send("AI-Powered Bookstore running. Preparing assets...");
      });
    }
  } else {
    // In development mode, the React app is served by Vite on port 3000.
    // Express provides API server endpoints directly on port 3001, bridged by Vite proxy.
    app.get('/', (req, res) => {
      res.json({ status: 'active', mode: 'development', service: 'online-bookstore-api' });
    });
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Bookstore Server started in Mode: ${process.env.NODE_ENV || 'production'}`);
    console.log(` Listening securely on: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error("Critical server failure on startup:", err);
});
