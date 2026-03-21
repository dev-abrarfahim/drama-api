import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from './src/routes/index.js';
import errorHandler from './src/utils/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiHtml = readFileSync(join(__dirname, 'src/ui/index.html'), 'utf8');

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(uiHtml);
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AsianCTV API running on http://localhost:${PORT}`);
});
