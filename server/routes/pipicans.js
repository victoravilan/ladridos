import express from 'express';

const router = express.Router();

// Pipicanes data - mainly Barcelona area
const pipicanes = [
  { id: 1, nombre: 'Pipican Camp de l\'Arpa', direccion: 'Carrer de l\'Arca, 80', barrio: 'Camp de l\'Arpa', ciudad: 'Barcelona', lat: 41.4103, lng: 2.1854, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 2, nombre: 'Pipican Parc de la Guineueta', direccion: 'Carrer de Agència, 45', barrio: 'Nou Barris', ciudad: 'Barcelona', lat: 41.4378, lng: 2.1783, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 3, nombre: 'Pipican Parc de les Aigües', direccion: 'Pg. de la Vall d\'Hebron, 75', barrio: 'Horta-Guinardó', ciudad: 'Barcelona', lat: 41.4292, lng: 2.1486, horario: '24h', vallas: true, agua: true, sombra: false },
  { id: 4, nombre: 'Pipican Diagonal Mar', direccion: 'Av. Diagonal, 300', barrio: 'Sant Martí', ciudad: 'Barcelona', lat: 41.4073, lng: 2.2181, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 5, nombre: 'Pipican Parc de la Ciutadella', direccion: 'Pg. Picasso, 21', barrio: 'Ciutat Vella', ciudad: 'Barcelona', lat: 41.3885, lng: 2.1873, horario: '10h-20h', vallas: false, agua: false, sombra: true },
  { id: 6, nombre: 'Pipican Parc de Cervantes', direccion: 'Av. Diagonal, 616', barrio: 'Les Corts', ciudad: 'Barcelona', lat: 41.3867, lng: 2.1225, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 7, nombre: 'Pipican Parc de la Creueta del Coll', direccion: 'Carrer de Santa Coloma, 90', barrio: 'Gràcia', ciudad: 'Barcelona', lat: 41.4154, lng: 2.1567, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 8, nombre: 'Pipican Can Mercader', direccion: 'Av. del Parc, 10', barrio: 'Cornellà', ciudad: 'Cornellà de Llobregat', lat: 41.3533, lng: 2.0806, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 9, nombre: 'Pipican Parc Forum', direccion: 'Carrer de Sant Ramon de Penyafort', barrio: 'Sant Martí', ciudad: 'Barcelona', lat: 41.4139, lng: 2.2233, horario: '24h', vallas: true, agua: true, sombra: false },
  { id: 10, nombre: 'Pipican Turó Park', direccion: 'Carrer de Cambrils, 20', barrio: 'Sarrià-Sant Gervasi', ciudad: 'Barcelona', lat: 41.3944, lng: 2.1503, horario: '24h', vallas: false, agua: false, sombra: true },
  { id: 11, nombre: 'Pipican Parc del Clot', direccion: 'Carrer dels Encants, 20', barrio: 'Sant Martí', ciudad: 'Barcelona', lat: 41.4078, lng: 2.1958, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 12, nombre: 'Pipican Can Sabadell', direccion: 'Carrer de Joan Güell, 120', barrio: 'Sants', ciudad: 'Barcelona', lat: 41.3775, lng: 2.1358, horario: '24h', vallas: true, agua: true, sombra: false },
  { id: 13, nombre: 'Pipican Parc de la Trinitat', direccion: 'Carrer d\'Aiguablava, 50', barrio: 'Sant Andreu', ciudad: 'Barcelona', lat: 41.4361, lng: 2.2033, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 14, nombre: 'Pipican Parc del Centre del Poblenou', direccion: 'Carrer de Bilbao, 10', barrio: 'Sant Martí', ciudad: 'Barcelona', lat: 41.4036, lng: 2.2033, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 15, nombre: 'Pipican Parc de la Vallcarca', direccion: 'Carrer de la Mare de Déu de la Salut, 45', barrio: 'Gràcia', ciudad: 'Barcelona', lat: 41.4064, lng: 2.1503, horario: '24h', vallas: false, agua: false, sombra: true },
  { id: 16, nombre: 'Pipican Esplugues de Llobregat', direccion: 'Av. de Can Mallolas, 30', barrio: 'Esplugues', ciudad: 'Esplugues de Llobregat', lat: 41.3728, lng: 2.0858, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 17, nombre: 'Pipican Badalona', direccion: 'Pg. de la Generalitat, 50', barrio: 'Badalona Centre', ciudad: 'Badalona', lat: 41.4422, lng: 2.2456, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 18, nombre: 'Pipican Sant Adrià de Besòs', direccion: 'Av. de la Generalitat, 80', barrio: 'Centre', ciudad: 'Sant Adrià de Besòs', lat: 41.4306, lng: 2.2181, horario: '24h', vallas: true, agua: true, sombra: false },
  { id: 19, nombre: 'Pipican Parc Nord', direccion: 'Carrer de València, 10', barrio: 'Nou Barris', ciudad: 'Barcelona', lat: 41.4322, lng: 2.1733, horario: '24h', vallas: true, agua: true, sombra: true },
  { id: 20, nombre: 'Pipican Montjuïc', direccion: 'Carrer del Foc, 45', barrio: 'Sants-Montjuïc', ciudad: 'Barcelona', lat: 41.3633, lng: 2.1533, horario: '24h', vallas: true, agua: false, sombra: true }
];

// Get all pipicanes
router.get('/', (req, res) => {
  res.json(pipicanes);
});

// Get nearby pipicanes based on user location
router.get('/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  
  if (!lat || !lng) {
    return res.json(pipicanes);
  }
  
  const withDistance = pipicanes.map(p => ({
    ...p,
    distancia: calculateDistance(lat, lng, p.lat, p.lng)
  }));
  
  withDistance.sort((a, b) => a.distancia - b.distancia);
  res.json(withDistance);
});

// Get pipican by id
router.get('/:id', (req, res) => {
  const pipican = pipicanes.find(p => p.id === parseInt(req.params.id));
  if (!pipican) {
    return res.status(404).json({ message: 'Pipican no encontrado' });
  }
  res.json(pipican);
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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
