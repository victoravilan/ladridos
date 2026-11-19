import express from 'express';
import { User } from '../models/Post.js';

const router = express.Router();

// Auth middleware
export function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No hay token, acceso denegado' });
  }
  const decoded = User.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Token invalido' });
  }
  req.user = decoded;
  next();
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, nombrePerro, razaPerro, mesNacimiento, anioNacimiento } = req.body;
    
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y password son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contrasena debe tener al menos 6 caracteres' });
    }

    const existe = User.findByEmail(email);
    if (existe) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const user = await User.create({ nombre, email, password, nombrePerro, razaPerro, mesNacimiento, anioNacimiento });
    const token = User.generateToken(user);
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: User.toSafe(user)
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const user = User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Credenciales invalidas' });
    }

    const valid = await User.verifyPassword(user, password);
    if (!valid) {
      return res.status(400).json({ message: 'Credenciales invalidas' });
    }

    const token = User.generateToken(user);
    res.json({
      message: 'Login exitoso',
      token,
      user: User.toSafe(user)
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const user = User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  res.json({ user: User.toSafe(user) });
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['nombre', 'fotoPerro', 'fotoPerfil'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.nombrePerro !== undefined) updates.perro = { ...User.findById(req.user.id)?.perro, nombre: req.body.nombrePerro };
    
    const user = User.update(req.user.id, updates);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ user: User.toSafe(user) });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
