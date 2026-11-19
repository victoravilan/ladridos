import express from 'express';

const router = express.Router();

// Pet stores data - mainly Barcelona area
const tiendas = [
  { id: 1, nombre: 'Tienda Animal Barcelona Centro', direccion: 'Carrer de Pelai, 28', ciudad: 'Barcelona', lat: 41.3870, lng: 2.1601, telefono: '930 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Higiene'] },
  { id: 2, nombre: 'Kiwoko Barcelona', direccion: 'Av. Diagonal, 405', ciudad: 'Barcelona', lat: 41.3953, lng: 2.1494, telefono: '932 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Juguetes'] },
  { id: 3, nombre: 'Tiendanimal Gracia', direccion: 'Carrer Gran de Gràcia, 150', ciudad: 'Barcelona', lat: 41.4078, lng: 2.1567, telefono: '931 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Peluqueria canina'] },
  { id: 4, nombre: 'Mascoteros Sants', direccion: 'Carrer de Sants, 250', ciudad: 'Barcelona', lat: 41.3753, lng: 2.1378, telefono: '933 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios'] },
  { id: 5, nombre: 'Canic Cerda', direccion: 'Carrer del Comte d\'Urgell, 80', ciudad: 'Barcelona', lat: 41.3836, lng: 2.1539, telefono: '934 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Veterinaria', 'Peluqueria'] },
  { id: 6, nombre: 'Zoomari Eixample', direccion: 'Carrer de Mallorca, 200', ciudad: 'Barcelona', lat: 41.3892, lng: 2.1617, telefono: '935 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Higiene'] },
  { id: 7, nombre: 'Mundo Mascotas Barceloneta', direccion: 'Passeig Marítim, 15', ciudad: 'Barcelona', lat: 41.3797, lng: 2.1856, telefono: '936 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios'] },
  { id: 8, nombre: 'Pet Shop Sarrià', direccion: 'Carrer Major de Sarrià, 50', ciudad: 'Barcelona', lat: 41.3925, lng: 2.1283, telefono: '937 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Veterinaria'] },
  { id: 9, nombre: 'Animalia Horta', direccion: 'Carrer del Cartagena, 100', ciudad: 'Barcelona', lat: 41.4211, lng: 2.1722, telefono: '938 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Peluqueria canina'] },
  { id: 10, nombre: 'Can Gol Sant Andreu', direccion: 'Carrer Gran de Sant Andreu, 180', ciudad: 'Barcelona', lat: 41.4356, lng: 2.1933, telefono: '939 000 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios'] },
  { id: 11, nombre: 'Tienda Animal Badalona', direccion: 'Av. d\'Alfons XIII, 200', ciudad: 'Badalona', lat: 41.4456, lng: 2.2422, telefono: '930 111 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Veterinaria'] },
  { id: 12, nombre: 'Kiwoko Cornellà', direccion: 'Av. del Parc, 30', ciudad: 'Cornellà de Llobregat', lat: 41.3556, lng: 2.0806, telefono: '930 222 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Peluqueria canina'] },
  { id: 13, nombre: 'Mascotas Esplugues', direccion: 'Carrer de la Mercè, 20', ciudad: 'Esplugues de Llobregat', lat: 41.3778, lng: 2.0872, telefono: '930 333 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios'] },
  { id: 14, nombre: 'Animal Park Sant Cugat', direccion: 'Carrer de Valldoreix, 80', ciudad: 'Sant Cugat del Vallès', lat: 41.4711, lng: 2.0833, telefono: '930 444 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios', 'Veterinaria', 'Peluqueria'] },
  { id: 15, nombre: 'Pet Corner Sant Boi', direccion: 'Carrer Major, 90', ciudad: 'Sant Boi de Llobregat', lat: 41.3431, lng: 2.0431, telefono: '930 555 000', tipo: 'Tienda especializada', servicios: ['Alimentacion', 'Accesorios'] }
];

// Get all stores
router.get('/', (req, res) => {
  res.json(tiendas);
});

// Get nearby stores
router.get('/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  
  if (!lat || !lng) {
    return res.json(tiendas);
  }
  
  const withDistance = tiendas.map(t => ({
    ...t,
    distancia: calculateDistance(lat, lng, t.lat, t.lng)
  }));
  
  withDistance.sort((a, b) => a.distancia - b.distancia);
  res.json(withDistance);
});

// Get store by id
router.get('/:id', (req, res) => {
  const tienda = tiendas.find(t => t.id === parseInt(req.params.id));
  if (!tienda) {
    return res.status(404).json({ message: 'Tienda no encontrada' });
  }
  res.json(tienda);
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

export default router;
