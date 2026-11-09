/* ==========================================================================
   SmartRoute - data.js
   Capa de datos: datos de demostración + persistencia en localStorage.
   Todos los datos (clientes, teléfonos, placas, conductores) son FICTICIOS
   y solo sirven para la demostración.
   ========================================================================== */

// Se cambia la clave cuando cambia la estructura de los datos de ejemplo
const STORAGE_KEY = 'smartroute_demo_v3';
/* Barrios y sectores de Riohacha con coordenadas
   APROXIMADAS para demostración en SmartRoute.
   Las coordenadas añadidas no son puntos geográficos verificados.
*/
const SECTORES = {

  /* SECTORES ORIGINALES */
  'Centro':             { lat: 11.5445, lng: -72.9070 },
  'El Carmen':          { lat: 11.5395, lng: -72.9125 },
  'Coquivacoa':         { lat: 11.5325, lng: -72.9055 },
  'Entrerríos':         { lat: 11.5285, lng: -72.9185 },
  'Marbella':           { lat: 11.5465, lng: -72.9030 },
  'San Martín':         { lat: 11.5415, lng: -72.9195 },
  'Los Nogales':        { lat: 11.5365, lng: -72.9235 },
  'Villa Campo Alegre': { lat: 11.5255, lng: -72.9265 },

  /* COMUNA 1 - CENTRO HISTÓRICO */
  'Barrio Arriba':      { lat: 11.5470, lng: -72.9080 },
  'Barrio Abajo':       { lat: 11.5420, lng: -72.9040 },
  'Villa Fátima':       { lat: 11.5500, lng: -72.9110 },
  'Urbanización El Faro': { lat: 11.5480, lng: -72.8990 },

  /* COMUNA 2 - NUEVO CENTRO */
  'Barrio Arriba Sur':  { lat: 11.5380, lng: -72.9090 },
  'San Martín de Porres': { lat: 11.5430, lng: -72.9160 },
  'Los Remedios':       { lat: 11.5350, lng: -72.9130 },
  'El Tatual':          { lat: 11.5370, lng: -72.9190 },
  'El Libertador':      { lat: 11.5330, lng: -72.9110 },
  'El Acueducto':       { lat: 11.5400, lng: -72.9020 },

  /* COMUNA 3 - COQUIVACOA */
  'José Antonio Galán': { lat: 11.5300, lng: -72.9090 },
  'Padilla':            { lat: 11.5290, lng: -72.9020 },
  'El Paraíso':         { lat: 11.5260, lng: -72.9060 },
  'Guapuna':            { lat: 11.5240, lng: -72.9110 },
  'Las Mercedes':       { lat: 11.5310, lng: -72.8990 },
  'Sol Tropical':       { lat: 11.5220, lng: -72.9040 },
  'Terrazas de Coquivacoa': { lat: 11.5270, lng: -72.8970 },
  'Luis Antonio Robles': { lat: 11.5200, lng: -72.9100 },

  /* COMUNA 4 - COOPERATIVO */
  'San Tropel':         { lat: 11.5500, lng: -72.9000 },
  'Nuevo Horizonte':    { lat: 11.5520, lng: -72.9070 },
  'Portal de Comfamiliar': { lat: 11.5540, lng: -72.9130 },
  '12 de Octubre':      { lat: 11.5480, lng: -72.9160 },
  'Cooperativo':        { lat: 11.5460, lng: -72.9200 },
  'La Ñapa':            { lat: 11.5510, lng: -72.9190 },
  'Jorge Pérez':        { lat: 11.5550, lng: -72.9050 },
  'Manantial':          { lat: 11.5570, lng: -72.9110 },
  'Edinson Deluque Pinto': { lat: 11.5450, lng: -72.9250 },

  /* COMUNA 5 - AEROPUERTO */
  'Cactus I':           { lat: 11.5500, lng: -72.8900 },
  'Cactus II':          { lat: 11.5530, lng: -72.8870 },
  'Che Guevara':        { lat: 11.5480, lng: -72.8860 },
  'Las Tunas':          { lat: 11.5420, lng: -72.8890 },
  'San Martín de Loba': { lat: 11.5380, lng: -72.8910 },
  'Matajuna':           { lat: 11.5350, lng: -72.8880 },
  'Aeropuerto':         { lat: 11.5450, lng: -72.8850 },
  'Nazaret':            { lat: 11.5400, lng: -72.8840 },
  'Caribe':             { lat: 11.5340, lng: -72.8950 },

  /* COMUNA 6 - NUESTRA SEÑORA DE LOS REMEDIOS */
  '20 de Julio':        { lat: 11.5330, lng: -72.9170 },
  'Obrero':             { lat: 11.5300, lng: -72.9210 },
  'San Francisco':      { lat: 11.5260, lng: -72.9200 },
  'Rojas Pinilla':      { lat: 11.5220, lng: -72.9160 },
  'La Loma':            { lat: 11.5250, lng: -72.9120 },
  'Las Villas':         { lat: 11.5190, lng: -72.9190 },
  'El Progreso':        { lat: 11.5320, lng: -72.9250 },
  'Villa Tatiana':      { lat: 11.5170, lng: -72.9140 },
  'El Calancala':       { lat: 11.5200, lng: -72.9230 },
  'José Arnoldo Marín': { lat: 11.5160, lng: -72.9210 },
  'Luis Eduardo Cuéllar': { lat: 11.5140, lng: -72.9160 },
  'Médano':             { lat: 11.5180, lng: -72.9080 },
  'Kepiagua':           { lat: 11.5120, lng: -72.9120 },

  /* COMUNA 7 - BOCA GRANDE */
  'El Comunitario':     { lat: 11.5240, lng: -72.9290 },
  'La Esperanza':       { lat: 11.5290, lng: -72.9310 },
  'La Cosecha':         { lat: 11.5200, lng: -72.9320 },
  '15 de Mayo':         { lat: 11.5160, lng: -72.9280 },
  'Los Olivos':         { lat: 11.5310, lng: -72.9340 },
  'Eurare':             { lat: 11.5130, lng: -72.9330 },
  'Simón Bolívar':      { lat: 11.5260, lng: -72.9360 },
  'Comfamiliar 2000':   { lat: 11.5190, lng: -72.9380 },
  'Buganvilla':         { lat: 11.5340, lng: -72.9300 },
  'San Judas':          { lat: 11.5220, lng: -72.9410 },
  'Boca Grande':        { lat: 11.5120, lng: -72.9390 },

  /* COMUNA 8 - LAGUNA SALADA Y EL PATRÓN */
  'Camilo Torres':      { lat: 11.5350, lng: -72.9300 },
  'María Eugenia Rojas': { lat: 11.5300, lng: -72.9390 },
  'Villa Laura':        { lat: 11.5260, lng: -72.9440 },
  '7 de Agosto':        { lat: 11.5320, lng: -72.9430 },
  'Pinal del Río':      { lat: 11.5230, lng: -72.9480 },
  'Buenos Aires':       { lat: 11.5180, lng: -72.9460 },
  'Villa Pareigua':     { lat: 11.5390, lng: -72.9380 },
  'Claudia Catalina':   { lat: 11.5410, lng: -72.9450 },
  'Pilar del Río':      { lat: 11.5350, lng: -72.9490 },
  'Bella Vista':        { lat: 11.5290, lng: -72.9500 },
  'Los Cerezos':        { lat: 11.5450, lng: -72.9390 },
  'Sol Mar':            { lat: 11.5430, lng: -72.9480 },

  /* COMUNA 9 - RÍO RANCHERÍA */
  'Villa Comfamiliar':  { lat: 11.5150, lng: -72.9010 },
  'Villa del Mar':      { lat: 11.5120, lng: -72.8950 },
  'Nuestra Señora de Fátima': { lat: 11.5090, lng: -72.9050 },

  /* COMUNA 10 - EL DIVIDIVI */
  'Los Almendros':      { lat: 11.5140, lng: -72.9300 },
  'Los Loteros':        { lat: 11.5100, lng: -72.9250 },
  'Villa Sharin':       { lat: 11.5060, lng: -72.9320 },
  'Hugo Zúñiga':        { lat: 11.5080, lng: -72.9380 },
  'La Floresta':        { lat: 11.5120, lng: -72.9430 },
  'Villa Aurora':       { lat: 11.5050, lng: -72.9400 },
  'Villa Jardín':       { lat: 11.5020, lng: -72.9340 },
  'Taugaira':           { lat: 11.5060, lng: -72.9250 },
  'San Judas Tadeo':    { lat: 11.5000, lng: -72.9290 },
  'La Mano de Dios':    { lat: 11.4980, lng: -72.9370 },
  'Ciudadela Dividivi': { lat: 11.5040, lng: -72.9440 },
  'San Isidro':         { lat: 11.4990, lng: -72.9450 },
  'Nuevo Milenio':      { lat: 11.4960, lng: -72.9400 },
  '31 de Octubre':      { lat: 11.4930, lng: -72.9350 }
};

/* Punto de partida y regreso de las rutas (centro de distribución ficticio) */
const BODEGA = { nombre: 'Centro de Distribución SmartRoute (demo)', lat: 11.5440, lng: -72.9085 };

/* Productos de ejemplo para SmartRoute */
const PRODUCTOS = [

  /* BEBIDAS */
  'Cajas de bebidas',
  'Agua embotellada',
  'Gaseosas',
  'Jugos naturales',
  'Bebidas energéticas',
  'Bebidas hidratantes',
  'Leche en caja',
  'Malta',
  'Agua en bolsa',
  'Bebidas saborizadas',

  /* ALIMENTOS Y VÍVERES */
  'Víveres secos',
  'Arroz por bultos',
  'Harina de trigo',
  'Harina de maíz',
  'Azúcar',
  'Sal',
  'Fríjoles',
  'Lentejas',
  'Pasta alimenticia',
  'Aceite de cocina',
  'Atún enlatado',
  'Sardinas enlatadas',
  'Avena',
  'Cereales',
  'Galletas',
  'Productos de panadería',
  'Café',
  'Chocolate en polvo',
  'Condimentos',
  'Salsas y aderezos',

  /* LÁCTEOS Y REFRIGERADOS */
  'Lácteos variados',
  'Queso fresco',
  'Queso costeño',
  'Yogur',
  'Mantequilla',
  'Crema de leche',
  'Leche en polvo',
  'Productos refrigerados',
  'Embutidos',
  'Productos congelados',

  /* FRUTAS Y VERDURAS */
  'Frutas variadas',
  'Verduras frescas',
  'Papa',
  'Cebolla',
  'Tomate',
  'Zanahoria',
  'Plátano',
  'Yuca',
  'Limón',
  'Mango',

  /* PRODUCTOS DE ASEO */
  'Detergentes',
  'Jabón en polvo',
  'Jabón líquido',
  'Suavizantes',
  'Desinfectantes',
  'Cloro',
  'Limpiadores multiusos',
  'Ambientadores',
  'Papel higiénico',
  'Servilletas',
  'Toallas de papel',
  'Bolsas para basura',
  'Esponjas y paños',
  'Productos de limpieza',

  /* FARMACIA E INSUMOS */
  'Insumos médicos',
  'Material de curación',
  'Guantes desechables',
  'Tapabocas',
  'Alcohol antiséptico',
  'Gasas y vendas',
  'Productos de cuidado personal',
  'Productos de higiene',
  'Suministros de farmacia',
  'Material odontológico',

  /* EMPAQUES Y SUMINISTROS */
  'Empaques plásticos',
  'Bolsas plásticas',
  'Cajas de cartón',
  'Envases desechables',
  'Vasos desechables',
  'Platos desechables',
  'Cubiertos desechables',
  'Rollos de papel',
  'Material de embalaje',
  'Cintas adhesivas',

  /* ROPA Y TEXTILES */
  'Cajas de ropa',
  'Uniformes',
  'Calzado',
  'Ropa infantil',
  'Ropa deportiva',
  'Sábanas',
  'Toallas',
  'Cobijas',

  /* HOGAR Y FERRETERÍA */
  'Artículos de hogar',
  'Utensilios de cocina',
  'Productos de decoración',
  'Herramientas manuales',
  'Material eléctrico',
  'Accesorios de plomería',
  'Pinturas',
  'Tornillería',
  'Materiales de construcción',
  'Accesorios para el hogar',

  /* RESTAURANTES Y DISTRIBUCIÓN */
  'Mariscos congelados',
  'Pescado fresco',
  'Pollo congelado',
  'Carnes empacadas',
  'Insumos para restaurantes',
  'Productos para cafetería',
  'Desechables para alimentos',
  'Ingredientes de cocina',
  'Suministros comerciales',
  'Mercancía general'
];

/* Fecha relativa a hoy (formato AAAA-MM-DD) */
function fechaRelativa(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/* ---------- Datos iniciales ---------- */
function crearDatosDemo() {
  /* CLIENTES FICTICIOS */
  const clientes = [
    { id: 'C001', nombre: 'Distribuidora Guajira Express', telefono: '300 123 4567', direccion: 'Calle 15 # 7-22', sector: 'Centro' },
    { id: 'C002', nombre: 'Supermercado El Carmen', telefono: '315 987 6543', direccion: 'Carrera 12 # 20-45', sector: 'El Carmen' },
    { id: 'C003', nombre: 'Comercializadora Coquivacoa', telefono: '301 456 7890', direccion: 'Calle 27A # 10-14', sector: 'Coquivacoa' },
    { id: 'C004', nombre: 'Tienda La Esperanza', telefono: '318 654 3210', direccion: 'Carrera 7 # 34-12', sector: 'Entrerríos' },
    { id: 'C005', nombre: 'Farmacia Marbella', telefono: '302 333 4455', direccion: 'Calle 2 # 11-05', sector: 'Marbella' },
    { id: 'C006', nombre: 'Abarrotes San Martín', telefono: '310 888 9900', direccion: 'Carrera 15 # 14B-30', sector: 'San Martín' },
    { id: 'C007', nombre: 'Restaurante El Malecón', telefono: '311 222 3344', direccion: 'Av. La Marina # 3-40', sector: 'Marbella' },
    { id: 'C008', nombre: 'Boutique Los Nogales', telefono: '312 777 1122', direccion: 'Calle 22 # 18-04', sector: 'Los Nogales' },
    { id: 'C009', nombre: 'Variedades Villa Campo Alegre', telefono: '314 555 6677', direccion: 'Carrera 20 # 30-11', sector: 'Villa Campo Alegre' },
    { id: 'C010', nombre: 'Minimercado La Economía', telefono: '300 456 1023', direccion: 'Calle 10 # 9-15', sector: 'Centro' },
    { id: 'C011', nombre: 'Distribuciones del Norte', telefono: '301 789 2345', direccion: 'Carrera 11 # 18-30', sector: 'El Carmen' },
    { id: 'C012', nombre: 'Panadería La Guajira', telefono: '302 456 7891', direccion: 'Calle 25 # 12-08', sector: 'Coquivacoa' },
    { id: 'C013', nombre: 'Droguería Salud Total', telefono: '303 222 4567', direccion: 'Carrera 8 # 10-22', sector: 'Centro' },
    { id: 'C014', nombre: 'Comercial La Frontera', telefono: '304 333 5678', direccion: 'Calle 30 # 15-19', sector: 'Entrerríos' },
    { id: 'C015', nombre: 'Supertienda Caribe', telefono: '305 444 6789', direccion: 'Carrera 14 # 16-25', sector: 'San Martín' },
    { id: 'C016', nombre: 'Restaurante Sabor Costeño', telefono: '306 555 7890', direccion: 'Calle 3 # 10-40', sector: 'Marbella' },
    { id: 'C017', nombre: 'Ferretería El Constructor', telefono: '307 666 8901', direccion: 'Carrera 18 # 21-14', sector: 'Los Nogales' },
    { id: 'C018', nombre: 'Papelería Punto Escolar', telefono: '308 777 9012', direccion: 'Calle 13 # 6-18', sector: 'Centro' },
    { id: 'C019', nombre: 'Tienda Mi Barrio', telefono: '309 888 0123', direccion: 'Carrera 21 # 29-16', sector: 'Villa Campo Alegre' },
    { id: 'C020', nombre: 'Distribuidora La 15', telefono: '310 999 1234', direccion: 'Calle 17 # 11-32', sector: 'El Carmen' },
    { id: 'C021', nombre: 'Almacén Mundo Hogar', telefono: '311 123 2345', direccion: 'Carrera 9 # 25-10', sector: 'Coquivacoa' },
    { id: 'C022', nombre: 'Frutas y Verduras El Campo', telefono: '312 234 3456', direccion: 'Calle 32 # 14-20', sector: 'Entrerríos' },
    { id: 'C023', nombre: 'Comercializadora Wayuu', telefono: '313 345 4567', direccion: 'Carrera 16 # 12-28', sector: 'San Martín' },
    { id: 'C024', nombre: 'Droguería Nueva Vida', telefono: '314 456 5678', direccion: 'Calle 5 # 13-07', sector: 'Marbella' },
    { id: 'C025', nombre: 'Supermercado La Canasta', telefono: '315 567 6789', direccion: 'Carrera 10 # 8-19', sector: 'Centro' },
    { id: 'C026', nombre: 'Insumos y Suministros del Caribe', telefono: '316 678 7890', direccion: 'Calle 23 # 19-11', sector: 'Los Nogales' },
    { id: 'C027', nombre: 'Abarrotes La Principal', telefono: '317 789 8901', direccion: 'Carrera 19 # 28-22', sector: 'Villa Campo Alegre' },
    { id: 'C028', nombre: 'Distribuciones El Progreso', telefono: '318 890 9012', direccion: 'Calle 26 # 11-16', sector: 'Coquivacoa' },
    { id: 'C029', nombre: 'Restaurante Brisas del Mar', telefono: '319 901 0123', direccion: 'Carrera 4 # 2-15', sector: 'Marbella' },
    { id: 'C030', nombre: 'Tienda y Variedades El Sol', telefono: '300 112 2233', direccion: 'Calle 16 # 10-09', sector: 'El Carmen' },
    { id: 'C031', nombre: 'Comercializadora La Perla', telefono: '301 223 3344', direccion: 'Carrera 6 # 12-35', sector: 'Centro' },
    { id: 'C032', nombre: 'Minimercado Los Pinos', telefono: '302 334 4455', direccion: 'Calle 29 # 16-24', sector: 'Entrerríos' },
    { id: 'C033', nombre: 'Almacén Central Guajiro', telefono: '303 445 5566', direccion: 'Carrera 13 # 17-08', sector: 'San Martín' },
    { id: 'C034', nombre: 'Panadería Trigo Dorado', telefono: '304 556 6677', direccion: 'Calle 7 # 8-21', sector: 'Centro' },
    { id: 'C035', nombre: 'Ferretería La Fortaleza', telefono: '305 667 7788', direccion: 'Carrera 22 # 23-12', sector: 'Los Nogales' },
    { id: 'C036', nombre: 'Comercial El Buen Precio', telefono: '306 778 8899', direccion: 'Calle 24 # 13-17', sector: 'Coquivacoa' },
    { id: 'C037', nombre: 'Tienda El Amanecer', telefono: '307 889 9900', direccion: 'Carrera 17 # 27-05', sector: 'Villa Campo Alegre' },
    { id: 'C038', nombre: 'Distribuidora Costa Azul', telefono: '308 990 1122', direccion: 'Calle 4 # 9-30', sector: 'Marbella' },
    { id: 'C039', nombre: 'Supertienda La Bendición', telefono: '309 101 2233', direccion: 'Carrera 12 # 13-26', sector: 'El Carmen' },
    { id: 'C040', nombre: 'Comercializadora Punto Norte', telefono: '310 212 3344', direccion: 'Calle 31 # 18-09', sector: 'Entrerríos' },
    { id: 'C041', nombre: 'Distribuidora El Granero', telefono: '311 234 5678', direccion: 'Calle 18 # 9-24', sector: 'Centro' },
    { id: 'C042', nombre: 'Supermercado La Guajirita', telefono: '312 345 6789', direccion: 'Carrera 14 # 21-16', sector: 'El Carmen' },
    { id: 'C043', nombre: 'Comercializadora San José', telefono: '313 456 7890', direccion: 'Calle 28 # 11-32', sector: 'Coquivacoa' },
    { id: 'C044', nombre: 'Tienda El Buen Vecino', telefono: '314 567 8901', direccion: 'Carrera 8 # 35-10', sector: 'Entrerríos' },
    { id: 'C045', nombre: 'Droguería Vida Sana', telefono: '315 678 9012', direccion: 'Calle 6 # 12-18', sector: 'Marbella' },
    { id: 'C046', nombre: 'Abarrotes La Economía Familiar', telefono: '316 789 0123', direccion: 'Carrera 16 # 15-28', sector: 'San Martín' },
    { id: 'C047', nombre: 'Restaurante Puerto Caribe', telefono: '317 890 1234', direccion: 'Avenida La Marina # 4-25', sector: 'Marbella' },
    { id: 'C048', nombre: 'Almacén Variedades del Norte', telefono: '318 901 2345', direccion: 'Calle 21 # 17-09', sector: 'Los Nogales' },
    { id: 'C049', nombre: 'Comercializadora Nuevo Horizonte', telefono: '319 012 3456', direccion: 'Carrera 19 # 31-20', sector: 'Villa Campo Alegre' },
    { id: 'C050', nombre: 'Minimercado La Favorita', telefono: '300 234 5678', direccion: 'Calle 12 # 8-17', sector: 'Centro' },
    { id: 'C051', nombre: 'Panadería El Trigal', telefono: '301 345 6789', direccion: 'Carrera 10 # 19-25', sector: 'El Carmen' },
    { id: 'C052', nombre: 'Ferretería Los Constructores', telefono: '302 456 7890', direccion: 'Calle 26 # 13-21', sector: 'Coquivacoa' },
    { id: 'C053', nombre: 'Comercializadora La Cosecha', telefono: '303 567 8901', direccion: 'Carrera 21 # 32-14', sector: 'Entrerríos' },
    { id: 'C054', nombre: 'Tienda El Paraíso', telefono: '304 678 9012', direccion: 'Calle 11 # 10-30', sector: 'San Martín' },
    { id: 'C055', nombre: 'Restaurante Sabores del Caribe', telefono: '305 789 0123', direccion: 'Carrera 5 # 3-18', sector: 'Marbella' },
    { id: 'C056', nombre: 'Papelería El Estudiante', telefono: '306 890 1234', direccion: 'Calle 14 # 7-26', sector: 'Centro' },
    { id: 'C057', nombre: 'Almacén Hogar y Estilo', telefono: '307 901 2345', direccion: 'Carrera 17 # 22-13', sector: 'Los Nogales' },
    { id: 'C058', nombre: 'Distribuciones La Estrella', telefono: '308 012 3456', direccion: 'Calle 25 # 14-19', sector: 'Coquivacoa' },
    { id: 'C059', nombre: 'Supertienda El Ahorro', telefono: '309 123 4567', direccion: 'Carrera 18 # 29-08', sector: 'Villa Campo Alegre' },
    { id: 'C060', nombre: 'Comercializadora Costa Guajira', telefono: '310 345 6789', direccion: 'Calle 8 # 11-22', sector: 'El Carmen' }
  ];

  /* VEHÍCULOS FICTICIOS */
  // La capacidad representa unidades de carga para la demostración.
  const vehiculos = [
    { id: 'V001', placa: 'GUA-123', modelo: 'Chevrolet N300', tipo: 'Furgoneta', capacidad: 60, conductor: 'Carlos Mendoza', estado: 'En ruta' },
    { id: 'V002', placa: 'GUA-456', modelo: 'Renault Kangoo', tipo: 'Camioneta', capacidad: 40, conductor: 'Josefa Pushaina', estado: 'Disponible' },
    { id: 'V003', placa: 'GUA-789', modelo: 'AKT Cargo 200', tipo: 'Motocarro', capacidad: 20, conductor: 'Luis Epiayu', estado: 'Disponible' },
    { id: 'V004', placa: 'GUA-901', modelo: 'Hino 300', tipo: 'Camión pequeño', capacidad: 120, conductor: 'Andrés Uriana', estado: 'En mantenimiento' },
    { id: 'V005', placa: 'GUA-234', modelo: 'Kia K2700', tipo: 'Camión pequeño', capacidad: 50, conductor: 'Mauricio Díaz', estado: 'Disponible' },
    { id: 'V006', placa: 'GUA-567', modelo: 'Chevrolet NHR', tipo: 'Camión pequeño', capacidad: 100, conductor: 'Daniel González', estado: 'Disponible' },
    { id: 'V007', placa: 'GUA-678', modelo: 'Renault Duster', tipo: 'Camioneta', capacidad: 35, conductor: 'María Iguarán', estado: 'Disponible' },
    { id: 'V008', placa: 'GUA-345', modelo: 'Motocarro TVS', tipo: 'Motocarro', capacidad: 25, conductor: 'Pedro Barros', estado: 'Disponible' },
    { id: 'V009', placa: 'GUA-890', modelo: 'Nissan Cabstar', tipo: 'Camión pequeño', capacidad: 90, conductor: 'Jorge Brito', estado: 'Disponible' },
    { id: 'V010', placa: 'GUA-112', modelo: 'DFSK C35', tipo: 'Furgoneta', capacidad: 55, conductor: 'Laura Mendoza', estado: 'Disponible' },
    { id: 'V011', placa: 'GUA-223', modelo: 'Chevrolet N300 Max', tipo: 'Furgoneta', capacidad: 65, conductor: 'Ricardo Gómez', estado: 'Disponible' },
    { id: 'V012', placa: 'GUA-334', modelo: 'Suzuki Carry', tipo: 'Camioneta', capacidad: 30, conductor: 'Óscar Iguarán', estado: 'Disponible' },
    { id: 'V013', placa: 'GUA-445', modelo: 'JAC HFC 1035', tipo: 'Camión pequeño', capacidad: 110, conductor: 'Fernando Díaz', estado: 'En ruta' },
    { id: 'V014', placa: 'GUA-556', modelo: 'Piaggio Ape', tipo: 'Motocarro', capacidad: 18, conductor: 'Miguel Barros', estado: 'Fuera de servicio' },
    { id: 'V015', placa: 'GUA-667', modelo: 'Renault Master', tipo: 'Furgoneta', capacidad: 85, conductor: 'Santiago Pérez', estado: 'Disponible' },
    { id: 'V016', placa: 'GUA-778', modelo: 'Chevrolet N400', tipo: 'Furgoneta', capacidad: 70, conductor: 'Eduardo Mendoza', estado: 'Disponible' },
    { id: 'V017', placa: 'GUA-889', modelo: 'JAC X200', tipo: 'Camión pequeño', capacidad: 100, conductor: 'Roberto Uriana', estado: 'Disponible' },
    { id: 'V018', placa: 'GUA-990', modelo: 'Yamaha Cargo', tipo: 'Motocarro', capacidad: 22, conductor: 'Samuel Epiayu', estado: 'Disponible' },
    { id: 'V019', placa: 'GUA-135', modelo: 'Renault Kangoo Express', tipo: 'Camioneta', capacidad: 45, conductor: 'Andrés Brito', estado: 'En mantenimiento' },
    { id: 'V020', placa: 'GUA-246', modelo: 'Hyundai H100', tipo: 'Camión pequeño', capacidad: 95, conductor: 'Felipe González', estado: 'Disponible' }
  ];

  const nuevoPedido = (n, clienteId, estado, producto, cantidad, fecha, extra) => {
    const c = clientes.find(x => x.id === clienteId);
    return Object.assign({
      id: 'P-' + n, clienteId, cliente: c.nombre, direccion: c.direccion, sector: c.sector,
      producto, cantidad, estado, fecha: fechaRelativa(fecha), observaciones: '', creado: fechaRelativa(Math.min(fecha, 0) - 1)
    }, extra || {});
  };

  const pedidos = [
    // Pendientes (se pueden planificar hoy)
    nuevoPedido(1001, 'C001', 'Pendiente',  'Cajas de bebidas',    15, 0, { observaciones: 'Entregar en la mañana' }),
    nuevoPedido(1003, 'C003', 'Pendiente',  'Empaques plásticos',  10, 0),
    nuevoPedido(1005, 'C005', 'Pendiente',  'Insumos médicos',      5, 0, { observaciones: 'Producto delicado' }),
    nuevoPedido(1007, 'C001', 'Pendiente',  'Detergentes',         12, 0, { direccion: 'Calle 10 # 5-18' }),
    nuevoPedido(1009, 'C008', 'Pendiente',  'Cajas de ropa',        4, 1),
    // En ruta (pertenecen a la ruta R-001)
    nuevoPedido(1004, 'C004', 'En ruta',    'Lácteos variados',    20, 0, { observaciones: 'Mantener refrigerado' }),
    nuevoPedido(1006, 'C006', 'En ruta',    'Harina y granos',     25, 0, { observaciones: 'Llamar al llegar' }),
    // Completados recientemente (alimentan las gráficas)
    nuevoPedido(1002, 'C002', 'Completado', 'Víveres secos',       30, 0, { completado: fechaRelativa(0) }),
    nuevoPedido(1008, 'C007', 'Completado', 'Mariscos congelados',  8, -1, { completado: fechaRelativa(-1) }),
    nuevoPedido(1019, 'C006', 'Completado', 'Harina y granos',     13, -1, { completado: fechaRelativa(-1) }),
    nuevoPedido(1011, 'C002', 'Completado', 'Víveres secos',       22, -2, { completado: fechaRelativa(-2) }),
    nuevoPedido(1012, 'C006', 'Completado', 'Harina y granos',     14, -2, { completado: fechaRelativa(-2) }),
    nuevoPedido(1013, 'C001', 'Completado', 'Cajas de bebidas',    19, -3, { completado: fechaRelativa(-3) }),
    nuevoPedido(1014, 'C005', 'Completado', 'Insumos médicos',      6, -4, { completado: fechaRelativa(-4) }),
    nuevoPedido(1015, 'C003', 'Completado', 'Detergentes',         11, -4, { completado: fechaRelativa(-4) }),
    nuevoPedido(1016, 'C004', 'Completado', 'Lácteos variados',    16, -5, { completado: fechaRelativa(-5) }),
    nuevoPedido(1017, 'C009', 'Completado', 'Artículos de hogar',   9, -6, { completado: fechaRelativa(-6) }),
    nuevoPedido(1018, 'C008', 'Completado', 'Cajas de ropa',        5, -6, { completado: fechaRelativa(-6) }),
    // Cancelado
    nuevoPedido(1010, 'C009', 'Cancelado',  'Artículos de hogar',  18, -1, { observaciones: 'Cancelado por el cliente' }),
    // Pedidos pendientes
    nuevoPedido(1020, 'C041', 'Pendiente', 'Arroz por bultos', 20, 0),
    nuevoPedido(1021, 'C042', 'Pendiente', 'Cajas de bebidas', 15, 0),
    nuevoPedido(1022, 'C043', 'Pendiente', 'Productos de limpieza', 12, 0),
    nuevoPedido(1023, 'C044', 'Pendiente', 'Harina de maíz', 18, 0),
    nuevoPedido(1024, 'C045', 'Pendiente', 'Insumos médicos', 8, 0),
    nuevoPedido(1025, 'C046', 'Pendiente', 'Víveres secos', 25, 0),
    nuevoPedido(1026, 'C047', 'Pendiente', 'Ingredientes de cocina', 10, 0),
    nuevoPedido(1027, 'C048', 'Pendiente', 'Artículos de hogar', 14, 0),
    // Pedidos en ruta
    nuevoPedido(1028, 'C049', 'En ruta', 'Cajas de cartón', 16, 0),
    nuevoPedido(1029, 'C050', 'En ruta', 'Gaseosas', 20, 0),
    nuevoPedido(1030, 'C051', 'En ruta', 'Productos de panadería', 12, 0),
    nuevoPedido(1031, 'C052', 'En ruta', 'Herramientas manuales', 9, 0),
    // Pedidos completados
    nuevoPedido(1032, 'C053', 'Completado', 'Frutas variadas', 18, -1, { completado: fechaRelativa(-1) }),
    nuevoPedido(1033, 'C054', 'Completado', 'Detergentes', 14, -1, { completado: fechaRelativa(-1) }),
    nuevoPedido(1034, 'C055', 'Completado', 'Mariscos congelados', 10, -2, { completado: fechaRelativa(-2) }),
    nuevoPedido(1035, 'C056', 'Completado', 'Papelería y útiles', 8, -2, { completado: fechaRelativa(-2) }),
    nuevoPedido(1036, 'C057', 'Completado', 'Artículos de hogar', 11, -3, { completado: fechaRelativa(-3) }),
    nuevoPedido(1037, 'C058', 'Completado', 'Víveres secos', 22, -3, { completado: fechaRelativa(-3) }),
    // Pedidos cancelados
    nuevoPedido(1038, 'C059', 'Cancelado', 'Bebidas hidratantes', 12, -1, { observaciones: 'Cancelado por el cliente' }),
    nuevoPedido(1039, 'C060', 'Cancelado', 'Empaques plásticos', 7, -2, { observaciones: 'Pedido duplicado' })
  ];

  return {
    pedidos,
    clientes,
    vehiculos,
    rutas: [
      // Ruta de ejemplo ya despachada para el resumen del Dashboard (carga 45 de 60 uds.)
      { id: 'R-001', fecha: fechaRelativa(0), vehiculoId: 'V001', vehiculo: 'GUA-123', pedidos: ['P-1004', 'P-1006'], distanciaKm: 7.2, tiempoMin: 38 }
    ],
    actividad: [
      { texto: 'Ruta R-001 despachada con GUA-123 (2 entregas)', ts: Date.now() - 20 * 60000, tipo: 'ruta' },
      { texto: 'Pedido P-1002 completado',                       ts: Date.now() - 55 * 60000, tipo: 'ok' },
      { texto: 'Nuevo pedido P-1009 registrado (Boutique Los Nogales)', ts: Date.now() - 2 * 3600000, tipo: 'nuevo' },
      { texto: 'Vehículo GUA-901 en mantenimiento',              ts: Date.now() - 5 * 3600000, tipo: 'alerta' }
    ],
    config: {
      empresa: 'SmartRoute',
      administrador: 'Administrador',
      correo: 'soporte@smartroute-demo.com',
      ciudad: 'Riohacha, La Guajira',
      actividad: 'Planificación y optimización de rutas de distribución.',
      notificaciones: true,
      modoCompacto: false
    }
  };
}

/* ---------- Persistencia ---------- */
const Store = {
  datos: null,

  /* Carga desde localStorage o crea datos de demostración */
  cargar() {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        this.datos = JSON.parse(guardado);
        return this.datos;
      }
    } catch (e) {
      console.warn('No se pudo leer localStorage, se usan datos de demostración.', e);
    }
    this.datos = crearDatosDemo();
    this.guardar();
    return this.datos;
  },

  guardar() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.datos));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage.', e);
    }
  },

  /* Restablece los datos de demostración */
  restablecer() {
    this.datos = crearDatosDemo();
    this.guardar();
    return this.datos;
  },

  /* Genera un código consecutivo, por ejemplo P-1020, C010, V006 o R-002 */
  siguienteId(coleccion, prefijo, inicio, separador) {
    const sep = separador === undefined ? '' : separador;
    let max = inicio;
    this.datos[coleccion].forEach(item => {
      const num = parseInt(String(item.id).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    const siguiente = max + 1;
    return prefijo + sep + (prefijo === 'P' ? siguiente : String(siguiente).padStart(3, '0'));
  },

  /* Registra una línea de actividad reciente (máximo 12) */
  registrarActividad(texto, tipo) {
    this.datos.actividad.unshift({ texto, ts: Date.now(), tipo: tipo || 'info' });
    this.datos.actividad = this.datos.actividad.slice(0, 12);
    this.guardar();
  }
};
