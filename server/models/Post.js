// Simple JSON-based data store (no MongoDB dependency)
// Stores users in a JSON file for persistence

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const JWT_SECRET = 'ladridos-secret-key-2026-victor-avilan';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files
function initFile(filepath) {
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify([]));
  }
}
initFile(USERS_FILE);
initFile(POSTS_FILE);

// Simple password hashing using Node.js native crypto (no external deps)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}
function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// User operations
export const User = {
  findAll: () => readJSON(USERS_FILE),
  findByEmail: (email) => {
    const users = readJSON(USERS_FILE);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findById: (id) => {
    const users = readJSON(USERS_FILE);
    return users.find(u => u.id === id);
  },
  findByUserId: (userId) => {
    const users = readJSON(USERS_FILE);
    return users.find(u => u.userId === userId);
  },
  create: async (userData) => {
    const users = readJSON(USERS_FILE);
    const hashedPassword = hashPassword(userData.password);
    const userId = generateUserId(userData.email);
    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      nombre: userData.nombre,
      email: userData.email,
      password: hashedPassword,
      userId,
      perro: {
        nombre: userData.nombrePerro || '',
        raza: userData.razaPerro || '',
        mesNacimiento: userData.mesNacimiento || '',
        anioNacimiento: userData.anioNacimiento || ''
      },
      fotoPerro: '',
      fotoPerfil: '',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  },
  update: (id, updates) => {
    const users = readJSON(USERS_FILE);
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      writeJSON(USERS_FILE, users);
      return users[idx];
    }
    return null;
  },
  verifyPassword: async (user, password) => {
    return verifyPasswordHash(password, user.password);
  },
  generateToken: (user) => {
    return jwt.sign(
      { id: user.id, userId: user.userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  },
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  },
  toSafe: (user) => {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }
};

// Post operations
export const Post = {
  findAll: () => readJSON(POSTS_FILE),
  findDemo: () => {
    const posts = readJSON(POSTS_FILE);
    return posts.filter(p => p.esDemo);
  },
  findByUser: (userId) => {
    const posts = readJSON(POSTS_FILE);
    return posts.filter(p => p.autorId === userId);
  },
  findById: (id) => {
    const posts = readJSON(POSTS_FILE);
    return posts.find(p => p.id === id);
  },
  create: (postData) => {
    const posts = readJSON(POSTS_FILE);
    const newPost = {
      id: 'post_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...postData,
      likes: 0,
      comentarios: [],
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    posts.unshift(newPost);
    writeJSON(POSTS_FILE, posts);
    return newPost;
  },
  insertMany: async (postsData) => {
    const posts = readJSON(POSTS_FILE);
    for (const pd of postsData) {
      posts.unshift({
        id: 'post_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        ...pd,
        fecha: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }
    writeJSON(POSTS_FILE, posts);
    return postsData;
  },
  deleteMany: (filter) => {
    let posts = readJSON(POSTS_FILE);
    if (filter.esDemo) {
      posts = posts.filter(p => !p.esDemo);
    }
    writeJSON(POSTS_FILE, posts);
  },
  addLike: (id) => {
    const posts = readJSON(POSTS_FILE);
    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      posts[idx].likes = (posts[idx].likes || 0) + 1;
      writeJSON(POSTS_FILE, posts);
      return posts[idx];
    }
    return null;
  },
  addComment: (id, autor, texto) => {
    const posts = readJSON(POSTS_FILE);
    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      const comentario = { autor, texto, fecha: new Date().toISOString() };
      if (!posts[idx].comentarios) posts[idx].comentarios = [];
      posts[idx].comentarios.push(comentario);
      writeJSON(POSTS_FILE, posts);
      return posts[idx];
    }
    return null;
  },
  count: () => readJSON(POSTS_FILE).length
};

function generateUserId(email) {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  const domain = email.split('@')[1]?.split('.')[0]?.slice(0, 3) || 'usr';
  return `U${timestamp}-${random}-${domain}`;
}

export { JWT_SECRET };
