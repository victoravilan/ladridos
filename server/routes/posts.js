import express from 'express';
import { Post } from '../models/Post.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Get all posts
router.get('/', (req, res) => {
  try {
    const posts = Post.findAll();
    res.json(posts);
  } catch (error) {
    console.error('Error obteniendo posts:', error);
    res.status(500).json([]);
  }
});

// Initialize demo posts
router.post('/demo', async (req, res) => {
  try {
    const existing = Post.findDemo();
    if (existing.length === 0) {
      const demoPosts = [
        { autor: 'Ladridos Team', autorId: 'DEMO-0001', raza: 'Beagle', historia: 'Los Beagles tienen un olfato increible!', archivo: '/videos/beagle-olfato.mp4', tipoArchivo: 'video/mp4', likes: 15, esDemo: true, comentarios: [{ autor: 'Maria', texto: 'Que increible!', fecha: new Date().toISOString() }] },
        { autor: 'Ladridos Team', autorId: 'DEMO-0002', raza: 'Alaskan Malamute', historia: 'A pesar de su tamano, los Malamutes son muy gentiles.', archivo: '/videos/malamute-bano.mp4', tipoArchivo: 'video/mp4', likes: 23, esDemo: true, comentarios: [{ autor: 'Carlos', texto: 'Hermosos', fecha: new Date().toISOString() }] },
        { autor: 'Ladridos Team', autorId: 'DEMO-0003', raza: 'Golden Retriever', historia: 'Los Golden Retrievers aman jugar con pelotas!', archivo: '/videos/golden-pelotas.mp4', tipoArchivo: 'video/mp4', likes: 31, esDemo: true, comentarios: [{ autor: 'Ana', texto: 'Obsesionado con las pelotas', fecha: new Date().toISOString() }] },
        { autor: 'Ladridos Team', autorId: 'DEMO-0004', raza: 'Corgi', historia: 'Los Corgis pueden saltar sorprendentemente alto!', archivo: '/videos/corgi-salto.mp4', tipoArchivo: 'video/mp4', likes: 28, esDemo: true, comentarios: [{ autor: 'Sofia', texto: 'Adorables', fecha: new Date().toISOString() }] },
        { autor: 'Ladridos Team', autorId: 'DEMO-0005', raza: 'Akita', historia: 'Los Akitas son conocidos por su paciencia y lealtad.', archivo: '/videos/akita-paciencia.mp4', tipoArchivo: 'video/mp4', likes: 19, esDemo: true, comentarios: [{ autor: 'Roberto', texto: 'El mas leal', fecha: new Date().toISOString() }] },
        { autor: 'Ladridos Team', autorId: 'DEMO-0006', raza: 'Border Collie', historia: 'Los Border Collies son increiblemente inteligentes.', archivo: '/videos/border-organizacion.mp4', tipoArchivo: 'video/mp4', likes: 42, esDemo: true, comentarios: [{ autor: 'Elena', texto: 'Super inteligentes', fecha: new Date().toISOString() }] },
        { autor: 'Ladridos Team', autorId: 'DEMO-0007', raza: 'Basset Hound', historia: 'Las orejas largas de los Basset Hounds les ayudan a captar olores.', archivo: '/videos/basset-orejas.mp4', tipoArchivo: 'video/mp4', likes: 25, esDemo: true, comentarios: [{ autor: 'Patricia', texto: 'Tierno', fecha: new Date().toISOString() }] }
      ];
      await Post.insertMany(demoPosts);
    }
    res.json({ message: 'Posts demo listos', count: Post.findDemo().length });
  } catch (error) {
    console.error('Error creando posts demo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Like a post
router.post('/:id/like', (req, res) => {
  try {
    const post = Post.addLike(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    res.json({ message: 'Like agregado', likes: post.likes });
  } catch (error) {
    console.error('Error agregando like:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Comment on a post
router.post('/:id/comment', authMiddleware, (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto?.trim()) {
      return res.status(400).json({ message: 'El texto del comentario es requerido' });
    }
    const post = Post.addComment(req.params.id, req.user.userId, texto.trim());
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    res.json({ message: 'Comentario agregado', post });
  } catch (error) {
    console.error('Error agregando comentario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get posts by user
router.get('/user/:userId', (req, res) => {
  try {
    const posts = Post.findByUser(req.params.userId);
    res.json(posts);
  } catch (error) {
    console.error('Error obteniendo posts del usuario:', error);
    res.status(500).json([]);
  }
});

export default router;
