// Ladridos API - Netlify Serverless Function
// Handles all API routes in a single function

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const JWT_SECRET = 'ladridos-secret-key-2026-victor-avilan';

// Data paths - use local function data directory
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// Ensure data files exist
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
  if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, '[]');
}

// Helpers
function readJSON(filepath) {
  try { return JSON.parse(fs.readFileSync(filepath, 'utf-8')); }
  catch { return []; }
}
function writeJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}
function verifyPasswordHash(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// JWT
function generateToken(user) {
  const payload = { id: user.id, userId: user.userId, email: user.email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}
function verifyToken(token) {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function generateUserId(email) {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 99).toString().padStart(2, '0');
  const domain = email.split('@')[1]?.split('.')[0]?.slice(0, 3) || 'usr';
  return `U${timestamp}-${random}-${domain}`;
}

function toSafeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// Load breeds data from JSON (avoids eval which can fail in serverless)
let breedsData = [];
try {
  breedsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'breeds-data.json'), 'utf-8'));
} catch (e) {
  console.error('Error loading breeds:', e.message);
}

// Pipicanes data
const pipicanes = [
  { id: 1, nombre: "Pipican Camp de l'Arpa", direccion: "Carrer de l'Arca, 80", barrio: "Camp de l'Arpa", ciudad: "Barcelona", lat: 41.4103, lng: 2.1854, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 2, nombre: "Pipican Parc de la Guineueta", direccion: "Carrer de Agència, 45", barrio: "Nou Barris", ciudad: "Barcelona", lat: 41.4378, lng: 2.1783, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 3, nombre: "Pipican Parc de les Aigües", direccion: "Pg. de la Vall d'Hebron, 75", barrio: "Horta-Guinardó", ciudad: "Barcelona", lat: 41.4292, lng: 2.1486, horario: "24h", vallas: true, agua: true, sombra: false },
  { id: 4, nombre: "Pipican Diagonal Mar", direccion: "Av. Diagonal, 300", barrio: "Sant Martí", ciudad: "Barcelona", lat: 41.4073, lng: 2.2181, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 5, nombre: "Pipican Parc de la Ciutadella", direccion: "Pg. Picasso, 21", barrio: "Ciutat Vella", ciudad: "Barcelona", lat: 41.3885, lng: 2.1873, horario: "10h-20h", vallas: false, agua: false, sombra: true },
  { id: 6, nombre: "Pipican Parc de Cervantes", direccion: "Av. Diagonal, 616", barrio: "Les Corts", ciudad: "Barcelona", lat: 41.3867, lng: 2.1225, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 7, nombre: "Pipican Parc de la Creueta del Coll", direccion: "Carrer de Santa Coloma, 90", barrio: "Gràcia", ciudad: "Barcelona", lat: 41.4154, lng: 2.1567, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 8, nombre: "Pipican Can Mercader", direccion: "Av. del Parc, 10", barrio: "Cornellà", ciudad: "Cornellà de Llobregat", lat: 41.3533, lng: 2.0806, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 9, nombre: "Pipican Parc Forum", direccion: "Carrer de Sant Ramon de Penyafort", barrio: "Sant Martí", ciudad: "Barcelona", lat: 41.4139, lng: 2.2233, horario: "24h", vallas: true, agua: true, sombra: false },
  { id: 10, nombre: "Pipican Turó Park", direccion: "Carrer de Cambrils, 20", barrio: "Sarrià-Sant Gervasi", ciudad: "Barcelona", lat: 41.3944, lng: 2.1503, horario: "24h", vallas: false, agua: false, sombra: true },
  { id: 11, nombre: "Pipican Parc del Clot", direccion: "Carrer dels Encants, 20", barrio: "Sant Martí", ciudad: "Barcelona", lat: 41.4078, lng: 2.1958, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 12, nombre: "Pipican Can Sabadell", direccion: "Carrer de Joan Güell, 120", barrio: "Sants", ciudad: "Barcelona", lat: 41.3775, lng: 2.1358, horario: "24h", vallas: true, agua: true, sombra: false },
  { id: 13, nombre: "Pipican Parc de la Trinitat", direccion: "Carrer d'Aiguablava, 50", barrio: "Sant Andreu", ciudad: "Barcelona", lat: 41.4361, lng: 2.2033, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 14, nombre: "Pipican Parc del Centre del Poblenou", direccion: "Carrer de Bilbao, 10", barrio: "Sant Martí", ciudad: "Barcelona", lat: 41.4036, lng: 2.2033, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 15, nombre: "Pipican Parc de la Vallcarca", direccion: "Carrer de la Mare de Déu de la Salut, 45", barrio: "Gràcia", ciudad: "Barcelona", lat: 41.4064, lng: 2.1503, horario: "24h", vallas: false, agua: false, sombra: true },
  { id: 16, nombre: "Pipican Esplugues de Llobregat", direccion: "Av. de Can Mallolas, 30", barrio: "Esplugues", ciudad: "Esplugues de Llobregat", lat: 41.3728, lng: 2.0858, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 17, nombre: "Pipican Badalona", direccion: "Pg. de la Generalitat, 50", barrio: "Badalona Centre", ciudad: "Badalona", lat: 41.4422, lng: 2.2456, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 18, nombre: "Pipican Sant Adrià de Besòs", direccion: "Av. de la Generalitat, 80", barrio: "Centre", ciudad: "Sant Adrià de Besòs", lat: 41.4306, lng: 2.2181, horario: "24h", vallas: true, agua: true, sombra: false },
  { id: 19, nombre: "Pipican Parc Nord", direccion: "Carrer de València, 10", barrio: "Nou Barris", ciudad: "Barcelona", lat: 41.4322, lng: 2.1733, horario: "24h", vallas: true, agua: true, sombra: true },
  { id: 20, nombre: "Pipican Montjuïc", direccion: "Carrer del Foc, 45", barrio: "Sants-Montjuïc", ciudad: "Barcelona", lat: 41.3633, lng: 2.1533, horario: "24h", vallas: true, agua: false, sombra: true }
];

// Stores data
const stores = [
  { id: 1, nombre: "Tiendanimal Barcelona Centro", direccion: "Carrer de Pelai, 28", ciudad: "Barcelona", lat: 41.3870, lng: 2.1700, telefono: "+34 932 05 00 00", servicios: ["Perros", "Gatos", "Accesorios", "Online"] },
  { id: 2, nombre: "Kiwoko Barcelona", direccion: "Carrer de Provença, 300", ciudad: "Barcelona", lat: 41.3950, lng: 2.1560, telefono: "+34 930 00 00 00", servicios: ["Perros", "Gatos", "Peluqueria"] },
  { id: 3, nombre: "Zoo Pet Shop", direccion: "Carrer de Sants, 120", ciudad: "Barcelona", lat: 41.3740, lng: 2.1370, telefono: "+34 933 00 00 00", servicios: ["Perros", "Peces", "Aves"] },
  { id: 4, nombre: "Mascoteros BCN", direccion: "Av. Diagonal, 450", ciudad: "Barcelona", lat: 41.3970, lng: 2.1620, telefono: "+34 934 00 00 00", servicios: ["Perros", "Gatos", "Veterinaria"] },
  { id: 5, nombre: "Pet & Go Eixample", direccion: "Carrer de Mallorca, 200", ciudad: "Barcelona", lat: 41.3880, lng: 2.1620, telefono: "+34 935 00 00 00", servicios: ["Perros", "Gatos", "Accesorios"] },
  { id: 6, nombre: "Canigó Pet Shop", direccion: "Carrer de València, 350", ciudad: "Barcelona", lat: 41.3900, lng: 2.1680, telefono: "+34 936 00 00 00", servicios: ["Perros", "Roedores", "Peces"] },
  { id: 7, nombre: "AnimalFriends Sarrià", direccion: "Carrer de Balmes, 380", ciudad: "Barcelona", lat: 41.3940, lng: 2.1480, telefono: "+34 937 00 00 00", servicios: ["Perros", "Gatos", "Premium"] },
  { id: 8, nombre: "Tiendanimal Gràcia", direccion: "Carrer Gran de Gràcia, 150", ciudad: "Barcelona", lat: 41.4040, lng: 2.1560, telefono: "+34 938 00 00 00", servicios: ["Perros", "Gatos", "Online", "Peluqueria"] },
  { id: 9, nombre: "Mundo Animal Badalona", direccion: "Carrer del Mar, 30", ciudad: "Badalona", lat: 41.4430, lng: 2.2460, telefono: "+34 939 00 00 00", servicios: ["Perros", "Gatos", "Veterinaria"] },
  { id: 10, nombre: "PetStore Cornellà", direccion: "Av. d'Esplugues, 40", ciudad: "Cornellà de Llobregat", lat: 41.3550, lng: 2.0820, telefono: "+34 931 00 00 00", servicios: ["Perros", "Gatos", "Accesorios"] }
];

// Demo posts
const demoPosts = [
  { autor: 'Ladridos Team', autorId: 'DEMO-0001', raza: 'Beagle', historia: 'Los Beagles tienen un olfato increible, pueden detectar olores que nosotros ni imaginamos!', archivo: '/videos/beagle-olfato.mp4', tipoArchivo: 'video/mp4', likes: 15, esDemo: true, comentarios: [{ autor: 'Maria', texto: 'Que increible! Mi Beagle siempre encuentra todo', fecha: new Date().toISOString() }] },
  { autor: 'Ladridos Team', autorId: 'DEMO-0002', raza: 'Alaskan Malamute', historia: 'A pesar de su tamano, los Malamutes son muy gentiles y pacientes, especialmente con los ninos.', archivo: '/videos/malamute-bano.mp4', tipoArchivo: 'video/mp4', likes: 23, esDemo: true, comentarios: [{ autor: 'Carlos', texto: 'Son hermosos y muy nobles', fecha: new Date().toISOString() }] },
  { autor: 'Ladridos Team', autorId: 'DEMO-0003', raza: 'Golden Retriever', historia: 'Los Golden Retrievers son conocidos por su amor a jugar con pelotas. Pueden jugar por horas!', archivo: '/videos/golden-pelotas.mp4', tipoArchivo: 'video/mp4', likes: 31, esDemo: true, comentarios: [{ autor: 'Ana', texto: 'Mi Golden es igual, obsesionado con las pelotas', fecha: new Date().toISOString() }, { autor: 'Luis', texto: 'Son los mejores companeros de juego', fecha: new Date().toISOString() }] },
  { autor: 'Ladridos Team', autorId: 'DEMO-0004', raza: 'Corgi', historia: 'Los Corgis tienen patas cortas pero pueden saltar sorprendentemente alto cuando se emocionan!', archivo: '/videos/corgi-salto.mp4', tipoArchivo: 'video/mp4', likes: 28, esDemo: true, comentarios: [{ autor: 'Sofia', texto: 'Que gracioso! Los Corgis son adorables', fecha: new Date().toISOString() }] },
  { autor: 'Ladridos Team', autorId: 'DEMO-0005', raza: 'Akita', historia: 'Los Akitas son conocidos por su paciencia y lealtad. Son excelentes guardianes de la familia.', archivo: '/videos/akita-paciencia.mp4', tipoArchivo: 'video/mp4', likes: 19, esDemo: true, comentarios: [{ autor: 'Roberto', texto: 'Tengo un Akita y es el mas leal del mundo', fecha: new Date().toISOString() }] },
  { autor: 'Ladridos Team', autorId: 'DEMO-0006', raza: 'Border Collie', historia: 'Los Border Collies son increiblemente inteligentes y organizados. Mira como ordena sus juguetes!', archivo: '/videos/border-organizacion.mp4', tipoArchivo: 'video/mp4', likes: 42, esDemo: true, comentarios: [{ autor: 'Elena', texto: 'Son super inteligentes, el mio tambien hace eso', fecha: new Date().toISOString() }, { autor: 'Diego', texto: 'Los Border Collies son geniales', fecha: new Date().toISOString() }] },
  { autor: 'Ladridos Team', autorId: 'DEMO-0007', raza: 'Basset Hound', historia: 'Las orejas largas de los Basset Hounds no son solo adorables, les ayudan a captar mejor los olores!', archivo: '/videos/basset-orejas.mp4', tipoArchivo: 'video/mp4', likes: 25, esDemo: true, comentarios: [{ autor: 'Patricia', texto: 'Esas orejas son lo mas tierno del mundo', fecha: new Date().toISOString() }] }
];

function initDemoPosts() {
  const posts = readJSON(POSTS_FILE);
  const hasDemo = posts.some(p => p.esDemo);
  if (!hasDemo) {
    for (const dp of demoPosts) {
      posts.unshift({
        id: 'post_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        ...dp,
        fecha: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }
    writeJSON(POSTS_FILE, posts);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Multipart parser
function parseMultipart(body, boundary) {
  const boundaryStr = '--' + boundary;
  const parts = body.toString('binary').split(boundaryStr).filter(p => p.includes('Content-Disposition'));
  const fields = {};
  const files = [];
  for (const part of parts) {
    const nameMatch = part.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    const filenameMatch = part.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      const filename = filenameMatch[1];
      if (!filename) continue;
      const fileStart = part.indexOf('\r\n\r\n') + 4;
      const fileEnd = part.lastIndexOf('\r\n');
      const fileData = Buffer.from(part.substring(fileStart, fileEnd), 'binary');
      files.push({ fieldName, filename, data: fileData, size: fileData.length });
    } else {
      const valStart = part.indexOf('\r\n\r\n') + 4;
      const valEnd = part.lastIndexOf('\r\n');
      const value = part.substring(valStart, valEnd).trim();
      fields[fieldName] = value;
    }
  }
  return { fields, files };
}

// Main handler
exports.handler = async (event, context) => {
  ensureDataFiles();
  initDemoPosts();

  const path_parts = event.path.split('/api/');
  const apiPath = '/' + (path_parts[1] || '').replace(/^\/+/, '');
  const pathname = '/' + apiPath.replace(/^\/+/, '');
  const method = event.httpMethod;
  const queryParams = event.queryStringParameters || {};

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const sendJSON = (code, data) => ({
    statusCode: code,
    headers,
    body: JSON.stringify(data)
  });

  // Get auth user from header
  const getAuthUser = () => {
    const auth = event.headers.authorization || event.headers.Authorization;
    if (!auth) return null;
    const token = auth.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const users = readJSON(USERS_FILE);
    return users.find(u => u.id === decoded.id);
  };

  // Parse body
  let body = {};
  if (event.body) {
    if (event.isBase64Encoded) {
      body = Buffer.from(event.body, 'base64');
    } else {
      try { body = JSON.parse(event.body); } catch { body = {}; }
    }
  }

  // Routes
  // Health
  if (pathname === '/health' || pathname === '/' || pathname === '') {
    return sendJSON(200, { status: 'ok', app: 'Ladridos', version: '2.0.0', breeds: breedsData.length });
  }

  // Register
  if (pathname === '/auth/register' && method === 'POST') {
    const { nombre, email, password, nombrePerro, razaPerro, mesNacimiento, anioNacimiento } = body;
    if (!nombre || !email || !password) return sendJSON(400, { message: 'Nombre, email y password son requeridos' });
    if (password.length < 6) return sendJSON(400, { message: 'La contrasena debe tener al menos 6 caracteres' });
    const users = readJSON(USERS_FILE);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return sendJSON(400, { message: 'El usuario ya existe' });
    const userId = generateUserId(email);
    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      nombre, email,
      password: hashPassword(password),
      userId,
      perro: { nombre: nombrePerro || '', raza: razaPerro || '', mesNacimiento: mesNacimiento || '', anioNacimiento: anioNacimiento || '', comentario: '' },
      fotoPerro: '', fotoPerfil: '',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    const token = generateToken(newUser);
    return sendJSON(201, { message: 'Usuario creado', token, user: toSafeUser(newUser) });
  }

  // Login
  if (pathname === '/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password) return sendJSON(400, { message: 'Email y password son requeridos' });
    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPasswordHash(password, user.password)) return sendJSON(400, { message: 'Credenciales invalidas' });
    const token = generateToken(user);
    return sendJSON(200, { message: 'Login exitoso', token, user: toSafeUser(user) });
  }

  // Auth me
  if (pathname === '/auth/me' && method === 'GET') {
    const user = getAuthUser();
    if (!user) return sendJSON(401, { message: 'No autorizado' });
    return sendJSON(200, { user: toSafeUser(user) });
  }

  // Profile update (JSON only for serverless - photos would need separate handling)
  if (pathname === '/auth/profile' && method === 'PUT') {
    const authUser = getAuthUser();
    if (!authUser) return sendJSON(401, { message: 'No autorizado' });
    const users = readJSON(USERS_FILE);
    const idx = users.findIndex(u => u.id === authUser.id);
    if (idx === -1) return sendJSON(404, { message: 'Usuario no encontrado' });
    if (body.nombre) users[idx].nombre = body.nombre;
    if (body.nombrePerro !== undefined) users[idx].perro.nombre = body.nombrePerro;
    if (body.razaPerro !== undefined) users[idx].perro.raza = body.razaPerro;
    if (body.mesNacimiento !== undefined) users[idx].perro.mesNacimiento = body.mesNacimiento;
    if (body.anioNacimiento !== undefined) users[idx].perro.anioNacimiento = body.anioNacimiento;
    if (body.comentarioPerro !== undefined) users[idx].perro.comentario = body.comentarioPerro;
    writeJSON(USERS_FILE, users);
    return sendJSON(200, { user: toSafeUser(users[idx]) });
  }

  // Posts
  if (pathname === '/posts' && method === 'GET') {
    const posts = readJSON(POSTS_FILE);
    return sendJSON(200, posts);
  }

  // Demo posts
  if (pathname === '/posts/demo' && method === 'POST') {
    initDemoPosts();
    const posts = readJSON(POSTS_FILE);
    return sendJSON(200, { message: 'Posts demo listos', count: posts.filter(p => p.esDemo).length });
  }

  // Like
  const likeMatch = pathname.match(/^\/posts\/(.+)\/like$/);
  if (likeMatch && method === 'POST') {
    const posts = readJSON(POSTS_FILE);
    const idx = posts.findIndex(p => p.id === likeMatch[1]);
    if (idx === -1) return sendJSON(404, { message: 'Post no encontrado' });
    posts[idx].likes = (posts[idx].likes || 0) + 1;
    writeJSON(POSTS_FILE, posts);
    return sendJSON(200, { message: 'Like agregado', likes: posts[idx].likes });
  }

  // Comment
  const commentMatch = pathname.match(/^\/posts\/(.+)\/comment$/);
  if (commentMatch && method === 'POST') {
    const user = getAuthUser();
    if (!user) return sendJSON(401, { message: 'No autorizado' });
    if (!body.texto?.trim()) return sendJSON(400, { message: 'Comentario vacio' });
    const posts = readJSON(POSTS_FILE);
    const idx = posts.findIndex(p => p.id === commentMatch[1]);
    if (idx === -1) return sendJSON(404, { message: 'Post no encontrado' });
    if (!posts[idx].comentarios) posts[idx].comentarios = [];
    posts[idx].comentarios.push({ autor: user.nombre, texto: body.texto.trim(), fecha: new Date().toISOString() });
    writeJSON(POSTS_FILE, posts);
    return sendJSON(200, { message: 'Comentario agregado', post: posts[idx] });
  }

  // User posts
  const userPostsMatch = pathname.match(/^\/posts\/user\/(.+)$/);
  if (userPostsMatch && method === 'GET') {
    const posts = readJSON(POSTS_FILE);
    const userPosts = posts.filter(p => p.autorId === userPostsMatch[1]);
    return sendJSON(200, userPosts);
  }

  // Breeds
  if (pathname === '/breeds' && method === 'GET') {
    return sendJSON(200, breedsData);
  }

  // Random breed
  if (pathname === '/breeds/random' && method === 'GET') {
    const random = breedsData[Math.floor(Math.random() * breedsData.length)];
    return sendJSON(200, random);
  }

  // Breed by group
  const breedGroupMatch = pathname.match(/^\/breeds\/grupo\/(.+)$/);
  if (breedGroupMatch && method === 'GET') {
    const grupo = decodeURIComponent(breedGroupMatch[1]);
    const filtered = breedsData.filter(b => b.grupoFCI === grupo);
    return sendJSON(200, filtered);
  }

  // Breed by name
  const breedMatch = pathname.match(/^\/breeds\/(.+)$/);
  if (breedMatch && method === 'GET' && !breedGroupMatch) {
    const nombre = decodeURIComponent(breedMatch[1]).toLowerCase();
    const breed = breedsData.find(b => b.nombre.toLowerCase() === nombre);
    if (!breed) return sendJSON(404, { message: 'Raza no encontrada' });
    return sendJSON(200, breed);
  }

  // Pipicanes
  if (pathname === '/pipicans' && method === 'GET') {
    return sendJSON(200, pipicanes);
  }

  // Pipicanes nearby
  if (pathname === '/pipicans/nearby' && method === 'GET') {
    const lat = parseFloat(queryParams.lat);
    const lng = parseFloat(queryParams.lng);
    if (!lat || !lng) return sendJSON(200, pipicanes);
    const withDist = pipicanes.map(p => ({ ...p, distancia: calculateDistance(lat, lng, p.lat, p.lng) }));
    withDist.sort((a, b) => a.distancia - b.distancia);
    return sendJSON(200, withDist);
  }

  // Stores
  if (pathname === '/stores' && method === 'GET') {
    return sendJSON(200, stores);
  }

  // Stores nearby
  if (pathname === '/stores/nearby' && method === 'GET') {
    const lat = parseFloat(queryParams.lat);
    const lng = parseFloat(queryParams.lng);
    if (!lat || !lng) return sendJSON(200, stores);
    const withDist = stores.map(s => ({ ...s, distancia: calculateDistance(lat, lng, s.lat, s.lng) }));
    withDist.sort((a, b) => a.distancia - b.distancia);
    return sendJSON(200, withDist);
  }

  return sendJSON(404, { message: 'Endpoint no encontrado' });
};
