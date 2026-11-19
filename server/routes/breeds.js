import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const breedsDir = path.join(__dirname, '..', '..', 'public', 'images', 'perros');

// Import the breed data
import { breedsData } from '../data/breeds-data.js';

// Get all breeds
router.get('/', (req, res) => {
  res.json(breedsData);
});

// Get random breed
router.get('/random', (req, res) => {
  const random = breedsData[Math.floor(Math.random() * breedsData.length)];
  res.json(random);
});

// Get breed by name
router.get('/:nombre', (req, res) => {
  const nombre = decodeURIComponent(req.params.nombre).toLowerCase();
  const breed = breedsData.find(b => b.nombre.toLowerCase() === nombre);
  if (!breed) {
    return res.status(404).json({ message: 'Raza no encontrada' });
  }
  res.json(breed);
});

// Get breeds by FCI group
router.get('/grupo/:grupo', (req, res) => {
  const grupo = req.params.grupo;
  const filtered = breedsData.filter(b => b.grupoFCI === grupo);
  res.json(filtered);
});

export default router;
