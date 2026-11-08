/* ==========================================================================
   SmartRoute - data.js
   Capa de datos: datos de demostración + persistencia en localStorage.
   Todos los datos (clientes, teléfonos, placas, conductores) son FICTICIOS
   y solo sirven para la demostración.
   ========================================================================== */

// Se cambia la clave cuando cambia la estructura de los datos de ejemplo
const STORAGE_KEY = 'smartroute_demo_v2';

/* Barrios de Riohacha con coordenadas APROXIMADAS (demostrativas) */
const SECTORES = {
  'Centro':             { lat: 11.5445, lng: -72.9070 },
  'El Carmen':          { lat: 11.5395, lng: -72.9125 },
  'Coquivacoa':         { lat: 11.5325, lng: -72.9055 },
  'Entrerríos':         { lat: 11.5285, lng: -72.9185 },
  'Marbella':           { lat: 11.5465, lng: -72.9030 },
  'San Martín':         { lat: 11.5415, lng: -72.9195 },
  'Los Nogales':        { lat: 11.5365, lng: -72.9235 },
  'Villa Campo Alegre': { lat: 11.5255, lng: -72.9265 }
};

/* Punto de partida y regreso de las rutas (centro de distribución ficticio) */
const BODEGA = { nombre: 'Centro de Distribución SmartRoute (demo)', lat: 11.5440, lng: -72.9085 };

/* Productos de ejemplo */
const PRODUCTOS = ['Cajas de bebidas', 'Víveres secos', 'Empaques plásticos', 'Lácteos variados', 'Insumos médicos', 'Harina y granos', 'Detergentes', 'Mariscos congelados', 'Cajas de ropa', 'Artículos de hogar'];

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
  const clientes = [
    { id: 'C001', nombre: 'Distribuidora Guajira Express',  telefono: '300 123 4567', direccion: 'Calle 15 # 7-22',       sector: 'Centro' },
    { id: 'C002', nombre: 'Supermercado El Carmen',         telefono: '315 987 6543', direccion: 'Carrera 12 # 20-45',    sector: 'El Carmen' },
    { id: 'C003', nombre: 'Comercializadora Coquivacoa',    telefono: '301 456 7890', direccion: 'Calle 27A # 10-14',     sector: 'Coquivacoa' },
    { id: 'C004', nombre: 'Tienda La Esperanza',            telefono: '318 654 3210', direccion: 'Carrera 7 # 34-12',     sector: 'Entrerríos' },
    { id: 'C005', nombre: 'Farmacia Marbella',              telefono: '302 333 4455', direccion: 'Calle 2 # 11-05',       sector: 'Marbella' },
    { id: 'C006', nombre: 'Abarrotes San Martín',           telefono: '310 888 9900', direccion: 'Carrera 15 # 14B-30',   sector: 'San Martín' },
    { id: 'C007', nombre: 'Restaurante El Malecón',         telefono: '311 222 3344', direccion: 'Av. La Marina # 3-40',  sector: 'Marbella' },
    { id: 'C008', nombre: 'Boutique Los Nogales',           telefono: '312 777 1122', direccion: 'Calle 22 # 18-04',      sector: 'Los Nogales' },
    { id: 'C009', nombre: 'Variedades Villa Campo Alegre',  telefono: '314 555 6677', direccion: 'Carrera 20 # 30-11',    sector: 'Villa Campo Alegre' }
  ];

  // La capacidad se expresa en unidades (cantidad de productos que puede llevar)
  const vehiculos = [
    { id: 'V001', placa: 'GUA-123', modelo: 'Chevrolet N300',  tipo: 'Furgoneta',      capacidad: 60,  conductor: 'Carlos Mendoza',  estado: 'En ruta' },
    { id: 'V002', placa: 'GUA-456', modelo: 'Renault Kangoo',  tipo: 'Camioneta',      capacidad: 40,  conductor: 'Josefa Pushaina', estado: 'Disponible' },
    { id: 'V003', placa: 'GUA-789', modelo: 'AKT Cargo 200',   tipo: 'Motocarro',      capacidad: 20,  conductor: 'Luis Epiayu',     estado: 'Disponible' },
    { id: 'V004', placa: 'GUA-901', modelo: 'Hino 300',        tipo: 'Camión pequeño', capacidad: 120, conductor: 'Andrés Uriana',   estado: 'En mantenimiento' },
    { id: 'V005', placa: 'GUA-234', modelo: 'Kia K2700',       tipo: 'Camión pequeño', capacidad: 50,  conductor: 'Mauricio Díaz',   estado: 'Disponible' }
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
    nuevoPedido(1010, 'C009', 'Cancelado',  'Artículos de hogar',  18, -1, { observaciones: 'Cancelado por el cliente' })
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
