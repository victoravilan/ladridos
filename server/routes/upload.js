import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Post } from '../models/Post.js';
import { authMiddleware } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const MAX_VIDEO_SIZE = 2 * 1024 * 1024; // 2MB as requested

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = req.user?.userId || 'anonymous';
    const uploadPath = path.join(__dirname, '..', 'uploads', 'videos', 'usuarios', userFolder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `video-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de video'), false);
    }
  }
});

// Upload video and create post
router.post('/', authMiddleware, (req, res) => {
  upload.single('archivo')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: `El video no debe pesar mas de 2MB. Tu archivo excede el limite.` });
      }
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se subio ningun archivo' });
    }

    const { raza, historia } = req.body;
    if (!raza || !historia) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Raza e historia son requeridos' });
    }

    const archivoUrl = `/uploads/videos/usuarios/${req.user.userId}/${req.file.filename}`;
    
    const post = Post.create({
      autor: req.user.userId,
      autorId: req.user.userId,
      raza,
      historia,
      archivo: archivoUrl,
      tipoArchivo: req.file.mimetype,
      esDemo: false
    });

    res.status(201).json({
      message: 'Post creado exitosamente',
      post,
      archivo: {
        filename: req.file.filename,
        size: req.file.size,
        sizeMB: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: archivoUrl
      }
    });
  });
});

export default router;
