/* ==========================================================================
   SmartRoute - app.js
   Lógica de la interfaz: navegación SPA, módulos, formularios, gráficas y CSV.
   Depende de: data.js (Store, SECTORES, PRODUCTOS, fechaRelativa) y routes.js (Rutas).
   ========================================================================== */

/* ---------- Constantes ---------- */
const ESTADOS_PEDIDO = ['Pendiente', 'En ruta', 'Completado', 'Cancelado'];
const ESTADOS_VEHICULO = ['Disponible', 'En ruta', 'En mantenimiento'];
const TIPOS_VEHICULO = ['Camión pequeño', 'Furgoneta', 'Camioneta', 'Motocarro', 'Motocicleta'];

/* ---------- Estado de la interfaz ---------- */
const App = {
  seccion: 'dashboard',
  charts: [],
  q: { pedidos: '', clientes: '', vehiculos: '' },   // textos de búsqueda por módulo
  filtroEstado: '',                                  // filtro de estado en pedidos
  plan: { sel: null, vehiculoId: '', resultado: null } // estado del planificador
};

/* ==========================================================================
   UTILIDADES
   ========================================================================== */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

/* Escapa texto para insertarlo de forma segura en HTML */
const esc = s => String(s === undefined || s === null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Normaliza texto para búsquedas (sin tildes ni mayúsculas) */
const norm = s => String(s === undefined || s === null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const hoy = () => fechaRelativa(0);

const fmtFecha = iso => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const fmtCOP = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const fmtTiempo = min => {
  if (min >= 60) return `${Math.floor(min / 60)} h ${min % 60} min`;
  return `${min} min`;
};

const tiempoRelativo = ts => {
  if (!ts) return '';
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} d`;
};

const claseEstado = e => ({
  'Pendiente': 'est-pendiente', 'En ruta': 'est-ruta', 'Completado': 'est-completado',
  'Cancelado': 'est-cancelado', 'Disponible': 'est-disponible', 'En mantenimiento': 'est-mantenimiento'
}[e] || '');

const badgeEstado = e => `<span class="badge-estado ${claseEstado(e)}">${esc(e)}</span>`;

const opciones = (lista, seleccionado) =>
  lista.map(o => `<option value="${esc(o)}" ${o === seleccionado ? 'selected' : ''}>${esc(o)}</option>`).join('');

const estadoSelect = (tipo, id, estado, lista) =>
  `<select class="form-select form-select-sm estado-select ${claseEstado(estado)}" data-change="${tipo}" data-id="${esc(id)}" aria-label="Cambiar estado">${opciones(lista, estado)}</select>`;

/* Acceso rápido a los datos */
const D = () => Store.datos;
const buscarPedido = id => D().pedidos.find(p => p.id === id);
const buscarVehiculo = id => D().vehiculos.find(v => v.id === id);
const buscarCliente = id => D().clientes.find(c => c.id === id);
const buscarClientePorNombre = nombre => D().clientes.find(c => norm(c.nombre) === norm(nombre));
const pedidosPendientes = () => D().pedidos.filter(p => p.estado === 'Pendiente');
const vehiculosDisponibles = () => D().vehiculos.filter(v => v.estado === 'Disponible');

/* ---------- Notificaciones (toasts) ---------- */
function toast(mensaje, tipo = 'ok') {
  // Los mensajes de éxito/info pueden desactivarse en Configuración; los errores siempre se muestran
  if ((tipo === 'ok' || tipo === 'info') && D() && D().config.notificaciones === false) return;
  const estilos = {
    ok:    { clase: 'text-bg-success', icono: 'bi-check-circle-fill' },
    error: { clase: 'text-bg-danger',  icono: 'bi-x-circle-fill' },
    info:  { clase: 'text-bg-primary', icono: 'bi-info-circle-fill' },
    warn:  { clase: 'text-bg-warning', icono: 'bi-exclamation-triangle-fill' }
  }[tipo] || { clase: 'text-bg-primary', icono: 'bi-info-circle-fill' };

  const el = document.createElement('div');
  el.className = `toast toast-sr align-items-center ${estilos.clase}`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi ${estilos.icono} fs-5"></i><span>${esc(mensaje)}</span></div>
                  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
  $('#contenedorToasts').appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3800 });
  el.addEventListener('hidden.bs.toast', () => el.remove());
  t.show();
}

/* ---------- Modal de confirmación ---------- */
function confirmar({ titulo, mensaje, boton = 'Eliminar', onOk }) {
  $('#confirmarTitulo').textContent = titulo;
  $('#confirmarMensaje').textContent = mensaje;
  $('#confirmarAceptar').textContent = boton;
  const modal = bootstrap.Modal.getOrCreateInstance($('#modalConfirmar'));
  $('#confirmarAceptar').onclick = () => { modal.hide(); onOk(); };
  modal.show();
}

/* ---------- Modal general (formularios / información) ---------- */
const ModalGeneral = {
  abrir({ titulo, cuerpo, guardar = 'Guardar', onGuardar, alMostrar, grande = false }) {
    const el = $('#modalGeneral');
    $('#modalGeneralTitulo').textContent = titulo;
    $('#modalGeneralCuerpo').innerHTML = cuerpo;
    $('#modalGeneralDialog').classList.toggle('modal-lg', grande);
    const btnGuardar = $('#modalGeneralGuardar');
    btnGuardar.classList.toggle('d-none', !guardar);
    if (guardar) btnGuardar.textContent = guardar;
    $('#modalGeneralPie .btn-light').textContent = guardar ? 'Cancelar' : 'Cerrar';

    const modal = bootstrap.Modal.getOrCreateInstance(el);
    const form = $('#formModal');
    if (form && onGuardar) {
      form.addEventListener('submit', ev => {
        ev.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          toast('Completa los campos obligatorios marcados en rojo.', 'error');
          return;
        }
        if (onGuardar(form) !== false) modal.hide();
      });
    }
    if (alMostrar && form) alMostrar(form);
    modal.show();
    if (form) setTimeout(() => { const primero = form.querySelector('input, select, textarea'); if (primero) primero.focus(); }, 300);
  },
  cerrar() {
    const modal = bootstrap.Modal.getInstance($('#modalGeneral'));
    if (modal) modal.hide();
  }
};

/* ---------- Gráficas ---------- */
function crearGrafica(idCanvas, config) {
  const canvas = document.getElementById(idCanvas);
  if (!canvas) return;
  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = '<div class="empty-state"><i class="bi bi-wifi-off"></i>No se pudo cargar Chart.js (sin conexión).</div>';
    return;
  }
  App.charts.push(new Chart(canvas, config));
}

function destruirGraficas() {
  App.charts.forEach(c => c.destroy());
  App.charts = [];
}

function etiquetaDia(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const w = new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '');
  return `${w} ${d}`;
}

/* Entregas completadas por día durante los últimos 7 días (datos reales de localStorage) */
function entregasPorDia() {
  const dias = [];
  for (let i = 6; i >= 0; i--) dias.push(fechaRelativa(-i));
  const conteos = dias.map(d => D().pedidos.filter(p => p.estado === 'Completado' && (p.completado || p.fecha) === d).length);
  return { labels: dias.map(etiquetaDia), conteos };
}

/* ---------- Estadísticas generales ---------- */
function calcularStats() {
  const P = D().pedidos;
  const cuenta = e => P.filter(p => p.estado === e).length;
  const completados = cuenta('Completado');
  const cancelados = cuenta('Cancelado');
  const base = P.length - cancelados;
  return {
    total: P.length,
    pendientes: cuenta('Pendiente'),
    enRuta: cuenta('En ruta'),
    completados,
    cancelados,
    cumplimiento: base > 0 ? Math.round((completados / base) * 100) : 0,
    vehDisponibles: vehiculosDisponibles().length
  };
}

/* Carga (unidades) que lleva un vehículo en ruta actualmente */
function cargaAsignada(v) {
  if (v.estado !== 'En ruta') return 0;
  const ids = new Set(D().rutas.filter(r => r.vehiculoId === v.id).flatMap(r => r.pedidos));
  return D().pedidos.filter(p => ids.has(p.id) && p.estado === 'En ruta').reduce((s, p) => s + Number(p.cantidad), 0);
}

/* ==========================================================================
   NAVEGACIÓN (SPA)
   ========================================================================== */
const SECCIONES = {
  dashboard:     { titulo: 'Dashboard',            render: renderDashboard,    despues: despuesDashboard },
  pedidos:       { titulo: 'Pedidos',              render: renderPedidos,      despues: pintarTablaPedidos },
  rutas:         { titulo: 'Planificador de rutas', render: renderPlanificador, despues: despuesPlanificador },
  vehiculos:     { titulo: 'Vehículos',            render: renderVehiculos,    despues: pintarVehiculos },
  clientes:      { titulo: 'Clientes',             render: renderClientes,     despues: pintarTablaClientes },
  reportes:      { titulo: 'Reportes',             render: renderReportes,     despues: despuesReportes },
  configuracion: { titulo: 'Configuración',        render: renderConfiguracion }
};

function navegar(seccion) {
  if (!SECCIONES[seccion]) seccion = 'dashboard';
  App.seccion = seccion;

  // Menú lateral y título
  $$('.nav-item-sr').forEach(a => a.classList.toggle('active', a.dataset.seccion === seccion));
  $('#tituloSeccion').textContent = SECCIONES[seccion].titulo;
  document.title = `${SECCIONES[seccion].titulo} · SmartRoute`;

  // Buscador superior (según el módulo)
  const buscador = $('#buscadorGlobal');
  buscador.value = App.q[seccion] || '';
  buscador.placeholder = { pedidos: 'Buscar pedidos...', clientes: 'Buscar clientes...', vehiculos: 'Buscar vehículos...' }[seccion]
    || 'Buscar pedidos (Enter)...';

  cerrarMenuMovil();
  renderSeccion();
  window.scrollTo({ top: 0 });
}

/* Dibuja la sección actual (también se usa para refrescar tras un cambio) */
function renderSeccion() {
  destruirGraficas();
  Rutas.destruirMapa();
  const sec = SECCIONES[App.seccion];
  $('#contenido').innerHTML = sec.render();
  if (sec.despues) sec.despues();
  actualizarMarco();
}

/* Actualiza elementos comunes: insignias, notificaciones y usuario */
function actualizarMarco() {
  const pend = pedidosPendientes().length;
  const badge = $('#badgePedidos');
  badge.textContent = pend;
  badge.classList.toggle('d-none', pend === 0);

  const nombre = D().config.administrador || 'Administrador';
  $('#nombreUsuario').textContent = nombre;
  $('#avatarUsuario').textContent = nombre.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  document.body.classList.toggle('compacto', !!D().config.modoCompacto);

  pintarNotificaciones();
}

function cerrarMenuMovil() {
  $('#sidebar').classList.remove('abierto');
  $('#sidebarBackdrop').classList.remove('visible');
}

function irA(seccion) {
  if (location.hash === '#' + seccion) navegar(seccion);
  else location.hash = seccion;
}

/* ---------- Notificaciones (campana) ---------- */
function pintarNotificaciones() {
  const alertas = [];
  const pend = pedidosPendientes().length;
  const mant = D().vehiculos.filter(v => v.estado === 'En mantenimiento').length;
  if (pend > 0) alertas.push({ clase: 'warn', icono: 'bi-hourglass-split', texto: `${pend} pedido${pend > 1 ? 's' : ''} pendiente${pend > 1 ? 's' : ''} por asignar a una ruta.` });
  if (mant > 0) alertas.push({ clase: 'danger', icono: 'bi-tools', texto: `${mant} vehículo${mant > 1 ? 's' : ''} en mantenimiento.` });

  const iconos = { nuevo: 'bi-plus-circle-fill', ruta: 'bi-truck', ok: 'bi-check-circle-fill', alerta: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
  const clases = { nuevo: 'info', ruta: 'info', ok: 'ok', alerta: 'danger', info: 'info' };
  const recientes = D().actividad.slice(0, 4).map(a =>
    `<div class="notif-item"><div class="notif-ico ${clases[a.tipo] || 'info'}"><i class="bi ${iconos[a.tipo] || 'bi-info-circle-fill'}"></i></div>
     <div><div>${esc(a.texto)}</div><div class="text-muted small">${tiempoRelativo(a.ts)}</div></div></div>`).join('');

  $('#menuNotificaciones').innerHTML =
    `<div class="notif-head">Notificaciones</div>` +
    alertas.map(a => `<div class="notif-item"><div class="notif-ico ${a.clase}"><i class="bi ${a.icono}"></i></div><div>${esc(a.texto)}</div></div>`).join('') +
    recientes;

  const dot = $('#notifDot');
  dot.textContent = alertas.length;
  dot.classList.toggle('d-none', alertas.length === 0);
}

/* ==========================================================================
   MÓDULO: DASHBOARD
   ========================================================================== */
function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function renderDashboard() {
  const s = calcularStats();
  const rutasHoy = D().rutas.filter(r => r.fecha === hoy());

  // Últimos pedidos registrados (los de código más alto)
  const numId = p => parseInt(String(p.id).replace(/\D/g, ''), 10) || 0;
  const filasUltimos = D().pedidos.slice().sort((a, b) => numId(b) - numId(a)).slice(0, 5).map(p => `
      <tr>
        <td class="code-tag">${esc(p.id)}</td>
        <td class="fw-semibold">${esc(p.cliente)}</td>
        <td><span class="badge text-bg-light border">${esc(p.sector)}</span></td>
        <td>${badgeEstado(p.estado)}</td>
      </tr>`).join('');
  const iconos = { nuevo: 'bi-plus-circle-fill', ruta: 'bi-truck', ok: 'bi-check-circle-fill', alerta: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };

  const actividad = D().actividad.length
    ? D().actividad.slice(0, 7).map(a => `
        <div class="activity-item">
          <div class="activity-ico ${esc(a.tipo)}"><i class="bi ${iconos[a.tipo] || 'bi-info-circle-fill'}"></i></div>
          <div><div class="activity-text">${esc(a.texto)}</div><div class="activity-time">${tiempoRelativo(a.ts)}</div></div>
        </div>`).join('')
    : '<div class="empty-state"><i class="bi bi-activity"></i>Aún no hay actividad.</div>';

  const filasRutas = rutasHoy.map(r => `
      <tr>
        <td class="code-tag">${esc(r.id)}</td>
        <td><div class="fw-semibold">${esc(r.vehiculo)}</div></td>
        <td>${r.pedidos.length} entregas</td>
        <td>${r.distanciaKm} km</td>
        <td>${fmtTiempo(r.tiempoMin)}</td>
      </tr>`).join('');

  const resumenRutas = rutasHoy.length
    ? `<div class="table-responsive"><table class="table table-sr"><thead><tr><th>Ruta</th><th>Vehículo</th><th>Entregas</th><th>Distancia</th><th>Tiempo</th></tr></thead><tbody>${filasRutas}</tbody></table></div>`
    : `<div class="empty-state"><i class="bi bi-signpost-split"></i>No hay rutas planificadas para hoy.<div class="mt-3"><button class="btn btn-primary btn-sm" data-action="ir" data-id="rutas">Ir al planificador</button></div></div>`;

  return `
  <section>
    <div class="hero-card">
      <div>
        <h2>${saludo()}, ${esc(D().config.administrador)}</h2>
        <p>Este es el resumen de las operaciones de distribución de hoy.</p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-light" data-action="ir" data-id="rutas"><i class="bi bi-signpost-split-fill me-1"></i>Planificar una ruta</button>
        <button class="btn btn-outline-light" data-action="restablecer"><i class="bi bi-arrow-counterclockwise me-1"></i>Restablecer datos de demostración</button>
      </div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon blue"><i class="bi bi-box-seam-fill"></i></div><div><div class="stat-label">Pedidos registrados</div><div class="stat-value">${s.total}</div></div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon green"><i class="bi bi-check2-circle"></i></div><div><div class="stat-label">Entregas completadas</div><div class="stat-value">${s.completados}</div></div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div><div><div class="stat-label">Entregas pendientes</div><div class="stat-value">${s.pendientes}</div><div class="small text-muted">${s.enRuta} en ruta</div></div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon navy"><i class="bi bi-truck"></i></div><div><div class="stat-label">Vehículos disponibles</div><div class="stat-value">${s.vehDisponibles}</div></div></div></div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-lg-8"><div class="card-sr h-100"><div class="card-head"><h3>Entregas de los últimos 7 días</h3><span class="text-muted small">Completadas por día</span></div><div class="card-body-sr"><div class="chart-box"><canvas id="graficaEntregas"></canvas></div></div></div></div>
      <div class="col-lg-4"><div class="card-sr h-100"><div class="card-head"><h3>Estado de los pedidos</h3></div><div class="card-body-sr"><div class="chart-box"><canvas id="graficaEstados"></canvas></div></div></div></div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-lg-7"><div class="card-sr h-100">
        <div class="card-head"><h3>Últimos pedidos registrados</h3><button class="btn btn-sm btn-soft" data-action="ir" data-id="pedidos">Ver todos</button></div>
        <div class="table-responsive"><table class="table table-sr"><thead><tr><th>Código</th><th>Cliente</th><th>Barrio</th><th>Estado</th></tr></thead><tbody>${filasUltimos}</tbody></table></div>
      </div></div>
      <div class="col-lg-5"><div class="card-sr h-100"><div class="card-head"><h3>Actividad reciente</h3></div><div class="card-body-sr py-2">${actividad}</div></div></div>
    </div>

    <div class="row g-3">
      <div class="col-12"><div class="card-sr"><div class="card-head"><h3>Rutas planificadas para hoy</h3><button class="btn btn-sm btn-soft" data-action="ir" data-id="rutas">Nueva ruta</button></div>${resumenRutas}</div></div>
    </div>
  </section>`;
}

function despuesDashboard() {
  const { labels, conteos } = entregasPorDia();
  crearGrafica('graficaEntregas', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Entregas completadas', data: conteos, backgroundColor: '#2563EB', borderRadius: 8, maxBarThickness: 44 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0, stepSize: 1 }, grid: { color: '#EEF2F9' } }, x: { grid: { display: false } } } }
  });

  const s = calcularStats();
  crearGrafica('graficaEstados', {
    type: 'doughnut',
    data: { labels: ['Pendientes', 'En ruta', 'Completados', 'Cancelados'], datasets: [{ data: [s.pendientes, s.enRuta, s.completados, s.cancelados], backgroundColor: ['#F59E0B', '#2563EB', '#16A34A', '#DC2626'], borderWidth: 3, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } } }
  });
}

/* ==========================================================================
   MÓDULO: PEDIDOS
   ========================================================================== */
function renderPedidos() {
  return `
  <section>
    <div class="page-head">
      <div><h2>Pedidos</h2><p>Registra, edita y da seguimiento a las entregas.</p></div>
      <button class="btn btn-primary" data-action="nuevo-pedido"><i class="bi bi-plus-lg me-1"></i>Nuevo pedido</button>
    </div>
    <div class="card-sr">
      <div class="card-head flex-wrap">
        <div class="d-flex gap-2 flex-wrap flex-grow-1">
          <input type="search" id="buscarPedidos" class="form-control" style="max-width:280px" placeholder="Buscar por cliente, código, sector..." value="${esc(App.q.pedidos)}">
          <select class="form-select w-auto" data-change="filtro-estado" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>${opciones(ESTADOS_PEDIDO, App.filtroEstado)}
          </select>
        </div>
        <span class="text-muted small" id="contadorPedidos"></span>
      </div>
      <div class="table-responsive" id="tablaPedidos"></div>
    </div>
  </section>`;
}

function pedidosFiltrados() {
  const q = norm(App.q.pedidos);
  const num = p => parseInt(String(p.id).replace(/\D/g, ''), 10) || 0;
  return D().pedidos
    .filter(p => (!App.filtroEstado || p.estado === App.filtroEstado) &&
      (!q || norm([p.id, p.cliente, p.direccion, p.sector, p.producto, p.estado].join(' ')).includes(q)))
    .sort((a, b) => num(b) - num(a));
}

function pintarTablaPedidos() {
  const cont = $('#tablaPedidos');
  if (!cont) return;
  const lista = pedidosFiltrados();
  $('#contadorPedidos').textContent = `${lista.length} de ${D().pedidos.length} pedidos`;
  if (!lista.length) {
    cont.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i>No se encontraron pedidos con esos criterios.</div>';
    return;
  }
  cont.innerHTML = `
    <table class="table table-sr">
      <thead><tr><th>Código</th><th>Cliente</th><th>Dirección</th><th>Sector</th><th>Producto</th><th>Cant.</th><th>Estado</th><th>Entrega</th><th class="text-end">Acciones</th></tr></thead>
      <tbody>${lista.map(p => `
        <tr>
          <td class="code-tag">${esc(p.id)}</td>
          <td class="fw-semibold">${esc(p.cliente)}</td>
          <td>${esc(p.direccion)}</td>
          <td>${esc(p.sector)}</td>
          <td>${esc(p.producto)}</td>
          <td>${esc(p.cantidad)}</td>
          <td>${estadoSelect('estado-pedido', p.id, p.estado, ESTADOS_PEDIDO)}</td>
          <td class="text-nowrap">${fmtFecha(p.fecha)}</td>
          <td class="text-end text-nowrap">
            <button class="btn-action" title="Editar" data-action="editar-pedido" data-id="${esc(p.id)}"><i class="bi bi-pencil-fill"></i></button>
            <button class="btn-action danger" title="Eliminar" data-action="eliminar-pedido" data-id="${esc(p.id)}"><i class="bi bi-trash3-fill"></i></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function formPedidoHtml(p) {
  p = p || {};
  const sectores = Object.keys(SECTORES);
  return `
  <form id="formModal" novalidate>
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label" for="fCliente">Nombre del cliente</label>
        <input id="fCliente" name="cliente" class="form-control" list="listaClientes" required maxlength="80" value="${esc(p.cliente)}" placeholder="Escribe o selecciona un cliente">
        <datalist id="listaClientes">${D().clientes.map(c => `<option value="${esc(c.nombre)}"></option>`).join('')}</datalist>
        <div class="invalid-feedback">Indica el nombre del cliente.</div>
      </div>
      <div class="col-md-7">
        <label class="form-label" for="fDireccion">Dirección</label>
        <input id="fDireccion" name="direccion" class="form-control" required maxlength="100" value="${esc(p.direccion)}" placeholder="Ej.: Calle 15 # 8-20">
        <div class="invalid-feedback">Indica la dirección de entrega.</div>
      </div>
      <div class="col-md-5">
        <label class="form-label" for="fSector">Sector o barrio</label>
        <select id="fSector" name="sector" class="form-select" required>
          <option value="">Selecciona...</option>${opciones(sectores, p.sector)}
        </select>
        <div class="invalid-feedback">Selecciona un sector.</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="fProducto">Producto</label>
        <input id="fProducto" name="producto" class="form-control" list="listaProductos" required maxlength="60" value="${esc(p.producto)}">
        <datalist id="listaProductos">${PRODUCTOS.map(x => `<option value="${esc(x)}"></option>`).join('')}</datalist>
        <div class="invalid-feedback">Indica el producto.</div>
      </div>
      <div class="col-md-3">
        <label class="form-label" for="fCantidad">Cantidad</label>
        <input id="fCantidad" name="cantidad" type="number" min="1" max="999" step="1" class="form-control" required value="${esc(p.cantidad)}">
        <div class="invalid-feedback">Mínimo 1.</div>
      </div>
      <div class="col-md-3">
        <label class="form-label" for="fFecha">Fecha de entrega</label>
        <input id="fFecha" name="fecha" type="date" class="form-control" required value="${esc(p.fecha || hoy())}">
        <div class="invalid-feedback">Indica la fecha.</div>
      </div>
      <div class="col-12">
        <label class="form-label" for="fObs">Observaciones <span class="text-muted fw-normal">(opcional)</span></label>
        <textarea id="fObs" name="observaciones" class="form-control" rows="2" maxlength="200">${esc(p.observaciones)}</textarea>
      </div>
    </div>
  </form>`;
}

function abrirFormPedido(id) {
  const p = id ? buscarPedido(id) : null;
  ModalGeneral.abrir({
    titulo: p ? `Editar pedido ${p.id}` : 'Registrar nuevo pedido',
    cuerpo: formPedidoHtml(p),
    guardar: p ? 'Guardar cambios' : 'Registrar pedido',
    grande: true,
    // Al elegir un cliente existente se rellenan su dirección y sector
    alMostrar: form => {
      form.elements.cliente.addEventListener('change', () => {
        const c = buscarClientePorNombre(form.elements.cliente.value);
        if (c && !p) { form.elements.direccion.value = c.direccion; form.elements.sector.value = c.sector; }
      });
    },
    onGuardar: form => guardarPedido(form, p)
  });
}

function guardarPedido(form, existente) {
  const f = form.elements;
  const datos = {
    cliente: f.cliente.value.trim(),
    direccion: f.direccion.value.trim(),
    sector: f.sector.value,
    producto: f.producto.value.trim(),
    cantidad: parseInt(f.cantidad.value, 10),
    fecha: f.fecha.value,
    observaciones: f.observaciones.value.trim()
  };
  if (!datos.cliente || !datos.direccion || !datos.producto || !(datos.cantidad >= 1)) {
    toast('Revisa los datos del pedido.', 'error');
    return false;
  }

  // El pedido debe corresponder a un cliente registrado: si no existe, se registra
  let cliente = buscarClientePorNombre(datos.cliente);
  if (!cliente) {
    cliente = {
      id: Store.siguienteId('clientes', 'C', 0),
      nombre: datos.cliente,
      telefono: '300 000 0' + (100 + D().clientes.length + 1),
      direccion: datos.direccion,
      sector: datos.sector
    };
    D().clientes.push(cliente);
    toast(`Cliente "${cliente.nombre}" registrado automáticamente.`, 'info');
  }
  datos.cliente = cliente.nombre;
  datos.clienteId = cliente.id;

  if (existente) {
    Object.assign(existente, datos);
    Store.registrarActividad(`Pedido ${existente.id} actualizado`, 'info');
    toast(`Pedido ${existente.id} actualizado correctamente.`);
  } else {
    const nuevo = Object.assign({ id: Store.siguienteId('pedidos', 'P', 1000, '-'), estado: 'Pendiente', creado: hoy() }, datos);
    D().pedidos.push(nuevo);
    Store.registrarActividad(`Nuevo pedido ${nuevo.id} registrado (${nuevo.cliente})`, 'nuevo');
    toast(`Pedido ${nuevo.id} registrado correctamente.`);
  }
  Store.guardar();
  renderSeccion();
  return true;
}

function cambiarEstadoPedido(id, nuevo) {
  const p = buscarPedido(id);
  if (!p || p.estado === nuevo) return;
  p.estado = nuevo;
  if (nuevo === 'Completado') p.completado = hoy(); else delete p.completado;
  const tipo = { 'Completado': 'ok', 'En ruta': 'ruta', 'Cancelado': 'alerta', 'Pendiente': 'info' }[nuevo];
  Store.registrarActividad(`Pedido ${p.id} cambió a "${nuevo}"`, tipo);
  Store.guardar();
  toast(`Pedido ${p.id}: estado actualizado a "${nuevo}".`);
  renderSeccion();
}

function eliminarPedido(id) {
  const p = buscarPedido(id);
  if (!p) return;
  confirmar({
    titulo: '¿Eliminar pedido?',
    mensaje: `Se eliminará el pedido ${p.id} de ${p.cliente}. Esta acción no se puede deshacer.`,
    onOk: () => {
      D().pedidos = D().pedidos.filter(x => x.id !== id);
      // Se retira de las rutas guardadas
      D().rutas.forEach(r => { r.pedidos = r.pedidos.filter(x => x !== id); });
      D().rutas = D().rutas.filter(r => r.pedidos.length > 0);
      Store.registrarActividad(`Pedido ${id} eliminado`, 'alerta');
      Store.guardar();
      toast(`Pedido ${id} eliminado.`, 'warn');
      renderSeccion();
    }
  });
}

/* ==========================================================================
   MÓDULO: PLANIFICADOR DE RUTAS
   ========================================================================== */
function renderPlanificador() {
  const pend = pedidosPendientes();
  const vehs = vehiculosDisponibles();

  // Estado inicial del planificador
  App.plan.resultado = null;
  const idsPend = new Set(pend.map(p => p.id));
  if (!vehs.find(v => v.id === App.plan.vehiculoId)) {
    // Por defecto: el vehículo disponible de mayor capacidad
    const mayor = vehs.slice().sort((a, b) => b.capacidad - a.capacidad)[0];
    App.plan.vehiculoId = mayor ? mayor.id : '';
  }
  if (App.plan.sel === null) {
    // Preselección: pedidos que quepan en la capacidad del vehículo
    const v = buscarVehiculo(App.plan.vehiculoId);
    let acumulado = 0;
    App.plan.sel = new Set();
    pend.forEach(p => {
      if (v && acumulado + Number(p.cantidad) <= v.capacidad) { App.plan.sel.add(p.id); acumulado += Number(p.cantidad); }
    });
  }
  App.plan.sel = new Set(Array.from(App.plan.sel).filter(id => idsPend.has(id)));

  const lista = pend.length
    ? pend.map(p => `
        <label class="pedido-pick ${App.plan.sel.has(p.id) ? 'selected' : ''}" for="chk-${esc(p.id)}">
          <input type="checkbox" id="chk-${esc(p.id)}" data-change="plan-check" data-id="${esc(p.id)}" ${App.plan.sel.has(p.id) ? 'checked' : ''}>
          <div>
            <div class="nm">${esc(p.cliente)}</div>
            <div class="ad"><i class="bi bi-geo-alt-fill"></i> ${esc(p.direccion)} · ${esc(p.sector)}</div>
            <div class="ad">${esc(p.id)} · ${esc(p.producto)}</div>
          </div>
          <span class="qty">${esc(p.cantidad)} uds.</span>
        </label>`).join('')
    : `<div class="empty-state"><i class="bi bi-check2-all"></i>No hay pedidos pendientes.<div class="mt-3"><button class="btn btn-primary btn-sm" data-action="nuevo-pedido">Registrar pedido</button></div></div>`;

  const optVeh = vehs.length
    ? vehs.map(v => `<option value="${esc(v.id)}" ${v.id === App.plan.vehiculoId ? 'selected' : ''}>${esc(v.placa)} · ${esc(v.tipo)} (cap. ${v.capacidad} uds.)</option>`).join('')
    : '<option value="">Sin vehículos disponibles</option>';

  return `
  <section>
    <div class="page-head">
      <div><h2>Planificador de rutas</h2><p>Selecciona pedidos y un vehículo para generar una ruta de entrega demostrativa.</p></div>
      <span class="badge-estado est-pendiente">Simulación demostrativa</span>
    </div>

    <div class="planner-grid">
      <div class="planner-left">
        <div class="card-sr">
          <div class="card-head">
            <h3>Pedidos pendientes <span class="text-muted fw-normal">(${pend.length})</span></h3>
            <button class="btn btn-sm btn-soft" data-action="seleccionar-todos">Seleccionar todos</button>
          </div>
          <div class="pedido-list" id="listaPlan">${lista}</div>
        </div>

        <div class="card-sr"><div class="card-body-sr">
          <label class="form-label" for="selVehiculo">Vehículo disponible</label>
          <select id="selVehiculo" class="form-select" data-change="plan-vehiculo" ${vehs.length ? '' : 'disabled'}>${optVeh}</select>

          <div class="d-flex justify-content-between small mt-3 mb-1"><span class="text-muted">Carga seleccionada / capacidad</span><strong id="cargaTxt"></strong></div>
          <div class="progress sr"><div class="progress-bar" id="cargaBar" style="width:0"></div></div>
          <div class="small mt-2" id="cargaAviso"></div>

          <button class="btn btn-primary btn-generar w-100 mt-3" id="btnGenerar" data-action="generar-ruta">
            <i class="bi bi-lightning-charge-fill me-1"></i>Generar ruta
          </button>
        </div></div>
      </div>

      <div class="d-flex flex-column gap-3 min-w-0">
        <div class="card-sr map-card">
          <div class="card-head"><h3>Mapa de entregas</h3><span class="text-muted small">Riohacha, La Guajira</span></div>
          <div class="map-wrap">
            <div id="mapaRutas"></div>
            <div class="map-offline d-none" id="avisoMapaOffline"><i class="bi bi-wifi-off me-1"></i>No se pudieron cargar los mosaicos del mapa (sin conexión). Los puntos y la ruta se siguen mostrando.</div>
          </div>
        </div>
        <div id="resultadoRuta">${tarjetaSinResultado()}</div>
      </div>
    </div>
  </section>`;
}

function tarjetaSinResultado() {
  return `<div class="card-sr"><div class="empty-state"><i class="bi bi-signpost-split"></i>
    Selecciona los pedidos y el vehículo, y presiona <strong>Generar ruta</strong> para ver el orden sugerido de entregas.</div></div>`;
}

function despuesPlanificador() {
  Rutas.iniciarMapa('mapaRutas');
  Rutas.dibujar('mapaRutas', null, pedidosPendientes());
  actualizarCarga();
}

/* Actualiza la barra de carga según los pedidos y el vehículo elegidos */
function actualizarCarga() {
  const txt = $('#cargaTxt');
  if (!txt) return;
  const v = buscarVehiculo(App.plan.vehiculoId);
  const carga = pedidosPendientes().filter(p => App.plan.sel.has(p.id)).reduce((s, p) => s + Number(p.cantidad), 0);
  const cap = v ? v.capacidad : 0;
  const pct = cap ? Math.min(100, Math.round((carga / cap) * 100)) : 0;
  const excede = cap > 0 && carga > cap;

  txt.textContent = `${carga} / ${cap} uds.`;
  const barra = $('#cargaBar');
  barra.style.width = pct + '%';
  barra.classList.toggle('over', excede);
  $('#cargaAviso').innerHTML = !v
    ? '<span class="text-danger"><i class="bi bi-exclamation-circle me-1"></i>No hay vehículos disponibles.</span>'
    : excede
      ? `<span class="text-danger"><i class="bi bi-exclamation-circle me-1"></i>La carga supera la capacidad por ${carga - cap} uds. Quita pedidos o elige otro vehículo.</span>`
      : `<span class="text-muted">Quedan ${cap - carga} uds. de capacidad libre.</span>`;
}

function generarRuta(btn) {
  const pend = pedidosPendientes();
  const seleccion = pend.filter(p => App.plan.sel.has(p.id));
  const veh = buscarVehiculo(App.plan.vehiculoId);

  // Validaciones previas (mensajes claros)
  const prueba = Rutas.simular(seleccion, veh);
  if (prueba.error) { toast(prueba.error, 'error'); return; }

  // Pequeña pausa para que la demostración se note como "planificación"
  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Simulando planificación...';
  setTimeout(async () => {
    // Intenta trazar el recorrido por calles (servicio público OSRM). Si falla, se usa la estimación en línea recta.
    const calles = await Rutas.rutaPorCalles(prueba);
    if (App.seccion !== 'rutas' || !document.body.contains(btn)) return;
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    if (calles) {
      prueba.calles = calles;
      prueba.distanciaKm = calles.km;
      prueba.tiempoMin = calles.min + prueba.orden.length * Rutas.MIN_POR_PARADA;
    }
    App.plan.resultado = prueba;
    Rutas.dibujar('mapaRutas', prueba, pend);
    $('#resultadoRuta').innerHTML = tarjetaResultado(prueba);
    toast(`Ruta demostrativa generada con ${prueba.orden.length} entregas.`);
    $('#resultadoRuta').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 800);
}

function tarjetaResultado(r) {
  const v = r.vehiculo;
  const paradas = r.orden.map((pt, i) => `
    <li>
      <span class="stop-num" style="background:${Rutas.COLORES[i % Rutas.COLORES.length]}">${i + 1}</span>
      <div class="flex-grow-1">
        <div class="fw-semibold">${esc(pt.pedido.cliente)}</div>
        <div class="small text-muted">${esc(pt.pedido.direccion)} · ${esc(pt.pedido.sector)}</div>
      </div>
      <span class="small text-muted text-nowrap">${esc(pt.pedido.id)} · ${esc(pt.pedido.cantidad)} uds.</span>
    </li>`).join('');

  return `
  <div class="card-sr">
    <div class="card-head"><h3>Resultado de la ruta</h3><span class="badge-estado est-pendiente">Demostrativo</span></div>
    <div class="card-body-sr">
      <div class="row g-3 mb-3">
        <div class="col-6 col-md-3"><div class="result-stat"><div class="v">${r.orden.length}</div><div class="l">Pedidos incluidos</div></div></div>
        <div class="col-6 col-md-3"><div class="result-stat"><div class="v">${esc(v.placa)}</div><div class="l">Vehículo asignado</div></div></div>
        <div class="col-6 col-md-3"><div class="result-stat"><div class="v">${r.distanciaKm} km</div><div class="l">Distancia estimada</div></div></div>
        <div class="col-6 col-md-3"><div class="result-stat"><div class="v">${fmtTiempo(r.tiempoMin)}</div><div class="l">Tiempo estimado</div></div></div>
      </div>
      <div class="small text-muted mb-3"><i class="bi bi-truck me-1"></i>${esc(v.modelo)} · ${esc(v.conductor)} · Carga ${r.carga}/${v.capacidad} uds. · Sale y regresa a la bodega.</div>
      <h6 class="fw-bold mb-1">Orden sugerido de entregas</h6>
      <ol class="stop-list mb-3">${paradas}</ol>
      <div class="demo-note mb-3"><i class="bi bi-info-circle-fill"></i>
        <div>Resultado demostrativo. El orden se obtiene con una heurística sencilla de vecino más cercano sobre ubicaciones aproximadas por barrio; no es una ruta óptima.
          ${r.calles ? 'Solo el trazado por calles, la distancia y el tiempo de conducción provienen del servicio público de rutas OSRM.' : 'La distancia y el tiempo son estimaciones sobre línea recta (no se pudo consultar el trazado por calles).'}</div></div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-primary" data-action="despachar-ruta"><i class="bi bi-send-check-fill me-1"></i>Confirmar y despachar ruta</button>
        <button class="btn btn-light" data-action="limpiar-ruta">Descartar</button>
      </div>
    </div>
  </div>`;
}

function despacharRuta() {
  const r = App.plan.resultado;
  if (!r) return;
  const v = buscarVehiculo(r.vehiculo.id);
  if (!v) { toast('El vehículo ya no existe.', 'error'); return; }

  r.orden.forEach(pt => { const p = buscarPedido(pt.pedido.id); if (p) p.estado = 'En ruta'; });
  v.estado = 'En ruta';
  const ruta = {
    id: Store.siguienteId('rutas', 'R', 0, '-'),
    fecha: hoy(),
    vehiculoId: v.id,
    vehiculo: v.placa,
    pedidos: r.orden.map(pt => pt.pedido.id),
    distanciaKm: r.distanciaKm,
    tiempoMin: r.tiempoMin
  };
  D().rutas.push(ruta);
  Store.registrarActividad(`Ruta ${ruta.id} despachada con ${v.placa} (${ruta.pedidos.length} entregas)`, 'ruta');
  Store.guardar();

  App.plan.sel = null;
  App.plan.resultado = null;
  toast(`Ruta ${ruta.id} despachada. Los pedidos pasaron a "En ruta".`);
  renderSeccion();
}

/* ==========================================================================
   MÓDULO: VEHÍCULOS
   ========================================================================== */
const ICONOS_VEHICULO = {
  'Camión pequeño': 'bi-truck', 'Furgoneta': 'bi-truck-front-fill', 'Camioneta': 'bi-truck-flatbed',
  'Motocarro': 'bi-scooter', 'Motocicleta': 'bi-scooter'
};

function renderVehiculos() {
  return `
  <section>
    <div class="page-head">
      <div><h2>Vehículos</h2><p>Administra la flota utilizada para las entregas.</p></div>
      <button class="btn btn-primary" data-action="nuevo-vehiculo"><i class="bi bi-plus-lg me-1"></i>Agregar vehículo</button>
    </div>
    <div class="mb-3"><input type="search" id="buscarVehiculos" class="form-control" style="max-width:320px" placeholder="Buscar por placa, modelo o conductor..." value="${esc(App.q.vehiculos)}"></div>
    <div class="row g-3" id="gridVehiculos"></div>
  </section>`;
}

function pintarVehiculos() {
  const cont = $('#gridVehiculos');
  if (!cont) return;
  const q = norm(App.q.vehiculos);
  const lista = D().vehiculos.filter(v => !q || norm([v.placa, v.modelo, v.tipo, v.conductor, v.estado].join(' ')).includes(q));
  if (!lista.length) {
    cont.innerHTML = '<div class="col-12"><div class="card-sr"><div class="empty-state"><i class="bi bi-truck"></i>No se encontraron vehículos.</div></div></div>';
    return;
  }
  cont.innerHTML = lista.map(v => {
    const carga = cargaAsignada(v);
    const pct = v.capacidad ? Math.min(100, Math.round((carga / v.capacidad) * 100)) : 0;
    return `
    <div class="col-md-6 col-xl-4">
      <div class="card-sr vehicle-card">
        <div class="vehicle-top">
          <div class="vehicle-icon"><i class="bi ${ICONOS_VEHICULO[v.tipo] || 'bi-truck'}"></i></div>
          <div class="flex-grow-1"><div class="vehicle-plate">${esc(v.placa)}</div><div class="vehicle-model">${esc(v.modelo)}</div></div>
          <div class="text-nowrap">
            <button class="btn-action" title="Editar" data-action="editar-vehiculo" data-id="${esc(v.id)}"><i class="bi bi-pencil-fill"></i></button>
            <button class="btn-action danger" title="Eliminar" data-action="eliminar-vehiculo" data-id="${esc(v.id)}"><i class="bi bi-trash3-fill"></i></button>
          </div>
        </div>
        <div class="vehicle-meta">
          <div><div class="lbl">Tipo</div><div class="val">${esc(v.tipo)}</div></div>
          <div><div class="lbl">Capacidad de carga</div><div class="val">${esc(v.capacidad)} unidades</div></div>
          <div class="col-span-2" style="grid-column:1/-1"><div class="lbl">Conductor asignado</div><div class="val">${esc(v.conductor)}</div></div>
        </div>
        <div>
          <div class="d-flex justify-content-between small mb-1"><span class="text-muted">Carga en ruta</span><strong>${carga} / ${v.capacidad} uds.</strong></div>
          <div class="progress sr"><div class="progress-bar" style="width:${pct}%"></div></div>
        </div>
        <div class="d-flex align-items-center justify-content-between">
          <span class="small text-muted">Estado</span>
          ${estadoSelect('estado-vehiculo', v.id, v.estado, ESTADOS_VEHICULO)}
        </div>
      </div>
    </div>`;
  }).join('');
}

function formVehiculoHtml(v) {
  v = v || {};
  return `
  <form id="formModal" novalidate>
    <div class="row g-3">
      <div class="col-md-5">
        <label class="form-label" for="vPlaca">Placa</label>
        <input id="vPlaca" name="placa" class="form-control text-uppercase" required maxlength="10" value="${esc(v.placa)}" placeholder="Ej.: ABC-123">
        <div class="invalid-feedback">Indica la placa.</div>
      </div>
      <div class="col-md-7">
        <label class="form-label" for="vModelo">Modelo</label>
        <input id="vModelo" name="modelo" class="form-control" required maxlength="60" value="${esc(v.modelo)}" placeholder="Ej.: Chevrolet NHR 2020">
        <div class="invalid-feedback">Indica el modelo.</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="vTipo">Tipo de vehículo</label>
        <select id="vTipo" name="tipo" class="form-select" required><option value="">Selecciona...</option>${opciones(TIPOS_VEHICULO, v.tipo)}</select>
        <div class="invalid-feedback">Selecciona el tipo.</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="vCap">Capacidad de carga (unidades)</label>
        <input id="vCap" name="capacidad" type="number" min="1" max="999" class="form-control" required value="${esc(v.capacidad)}">
        <div class="invalid-feedback">Indica una capacidad mayor a 0.</div>
      </div>
      <div class="col-md-7">
        <label class="form-label" for="vCond">Conductor asignado</label>
        <input id="vCond" name="conductor" class="form-control" required maxlength="60" value="${esc(v.conductor)}" placeholder="Nombre ficticio">
        <div class="invalid-feedback">Indica el conductor.</div>
      </div>
      <div class="col-md-5">
        <label class="form-label" for="vEstado">Estado</label>
        <select id="vEstado" name="estado" class="form-select" required>${opciones(ESTADOS_VEHICULO, v.estado || 'Disponible')}</select>
      </div>
    </div>
  </form>`;
}

function abrirFormVehiculo(id) {
  const v = id ? buscarVehiculo(id) : null;
  ModalGeneral.abrir({
    titulo: v ? `Editar vehículo ${v.placa}` : 'Agregar vehículo',
    cuerpo: formVehiculoHtml(v),
    guardar: v ? 'Guardar cambios' : 'Agregar vehículo',
    onGuardar: form => {
      const f = form.elements;
      const datos = {
        placa: f.placa.value.trim().toUpperCase(),
        modelo: f.modelo.value.trim(),
        tipo: f.tipo.value,
        capacidad: parseInt(f.capacidad.value, 10),
        conductor: f.conductor.value.trim(),
        estado: f.estado.value
      };
      if (D().vehiculos.some(x => norm(x.placa) === norm(datos.placa) && (!v || x.id !== v.id))) {
        toast(`Ya existe un vehículo con la placa ${datos.placa}.`, 'error');
        return false;
      }
      if (v) {
        Object.assign(v, datos);
        Store.registrarActividad(`Vehículo ${v.placa} actualizado`, 'info');
        toast(`Vehículo ${v.placa} actualizado.`);
      } else {
        const nuevo = Object.assign({ id: Store.siguienteId('vehiculos', 'V', 0) }, datos);
        D().vehiculos.push(nuevo);
        Store.registrarActividad(`Vehículo ${nuevo.placa} agregado a la flota`, 'nuevo');
        toast(`Vehículo ${nuevo.placa} agregado.`);
      }
      Store.guardar();
      renderSeccion();
      return true;
    }
  });
}

function cambiarEstadoVehiculo(id, nuevo) {
  const v = buscarVehiculo(id);
  if (!v || v.estado === nuevo) return;
  v.estado = nuevo;
  Store.registrarActividad(`Vehículo ${v.placa} cambió a "${nuevo}"`, nuevo === 'En mantenimiento' ? 'alerta' : 'info');
  Store.guardar();
  toast(`Vehículo ${v.placa}: estado actualizado a "${nuevo}".`);
  renderSeccion();
}

function eliminarVehiculo(id) {
  const v = buscarVehiculo(id);
  if (!v) return;
  if (v.estado === 'En ruta') {
    toast(`No se puede eliminar ${v.placa} mientras está en ruta.`, 'error');
    return;
  }
  confirmar({
    titulo: '¿Eliminar vehículo?',
    mensaje: `Se eliminará el vehículo ${v.placa} (${v.modelo}). Esta acción no se puede deshacer.`,
    onOk: () => {
      D().vehiculos = D().vehiculos.filter(x => x.id !== id);
      Store.registrarActividad(`Vehículo ${v.placa} eliminado`, 'alerta');
      Store.guardar();
      toast(`Vehículo ${v.placa} eliminado.`, 'warn');
      renderSeccion();
    }
  });
}

/* ==========================================================================
   MÓDULO: CLIENTES
   ========================================================================== */
const pedidosDeCliente = c => D().pedidos.filter(p => p.clienteId === c.id || norm(p.cliente) === norm(c.nombre));

function renderClientes() {
  return `
  <section>
    <div class="page-head">
      <div><h2>Clientes</h2><p>Consulta y administra los clientes registrados.</p></div>
      <button class="btn btn-primary" data-action="nuevo-cliente"><i class="bi bi-plus-lg me-1"></i>Registrar cliente</button>
    </div>
    <div class="card-sr">
      <div class="card-head">
        <input type="search" id="buscarClientes" class="form-control" style="max-width:320px" placeholder="Buscar por nombre, sector o dirección..." value="${esc(App.q.clientes)}">
        <span class="text-muted small" id="contadorClientes"></span>
      </div>
      <div class="table-responsive" id="tablaClientes"></div>
    </div>
  </section>`;
}

function pintarTablaClientes() {
  const cont = $('#tablaClientes');
  if (!cont) return;
  const q = norm(App.q.clientes);
  const lista = D().clientes.filter(c => !q || norm([c.nombre, c.telefono, c.direccion, c.sector].join(' ')).includes(q));
  $('#contadorClientes').textContent = `${lista.length} de ${D().clientes.length} clientes`;
  if (!lista.length) {
    cont.innerHTML = '<div class="empty-state"><i class="bi bi-people"></i>No se encontraron clientes.</div>';
    return;
  }
  cont.innerHTML = `
    <table class="table table-sr">
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Dirección</th><th>Sector</th><th>Pedidos</th><th class="text-end">Acciones</th></tr></thead>
      <tbody>${lista.map(c => `
        <tr>
          <td class="fw-semibold">${esc(c.nombre)}</td>
          <td class="text-nowrap">${esc(c.telefono)}</td>
          <td>${esc(c.direccion)}</td>
          <td>${esc(c.sector)}</td>
          <td><span class="badge text-bg-light border">${pedidosDeCliente(c).length}</span></td>
          <td class="text-end text-nowrap">
            <button class="btn-action" title="Ver pedidos" data-action="pedidos-cliente" data-id="${esc(c.id)}"><i class="bi bi-box-seam"></i></button>
            <button class="btn-action" title="Editar" data-action="editar-cliente" data-id="${esc(c.id)}"><i class="bi bi-pencil-fill"></i></button>
            <button class="btn-action danger" title="Eliminar" data-action="eliminar-cliente" data-id="${esc(c.id)}"><i class="bi bi-trash3-fill"></i></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function formClienteHtml(c) {
  c = c || {};
  return `
  <form id="formModal" novalidate>
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label" for="cNombre">Nombre del cliente o negocio</label>
        <input id="cNombre" name="nombre" class="form-control" required maxlength="80" value="${esc(c.nombre)}">
        <div class="invalid-feedback">Indica el nombre.</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="cTel">Teléfono (ficticio)</label>
        <input id="cTel" name="telefono" class="form-control" required pattern="[0-9 +\\-]{7,20}" value="${esc(c.telefono)}" placeholder="300 000 0000">
        <div class="invalid-feedback">Ingresa un teléfono válido (solo números, espacios, + o -).</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="cSector">Barrio o sector</label>
        <select id="cSector" name="sector" class="form-select" required><option value="">Selecciona...</option>${opciones(Object.keys(SECTORES), c.sector)}</select>
        <div class="invalid-feedback">Selecciona un sector.</div>
      </div>
      <div class="col-12">
        <label class="form-label" for="cDir">Dirección</label>
        <input id="cDir" name="direccion" class="form-control" required maxlength="100" value="${esc(c.direccion)}">
        <div class="invalid-feedback">Indica la dirección.</div>
      </div>
    </div>
  </form>`;
}

function abrirFormCliente(id) {
  const c = id ? buscarCliente(id) : null;
  ModalGeneral.abrir({
    titulo: c ? 'Editar cliente' : 'Registrar cliente',
    cuerpo: formClienteHtml(c),
    guardar: c ? 'Guardar cambios' : 'Registrar cliente',
    onGuardar: form => {
      const f = form.elements;
      const datos = { nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), direccion: f.direccion.value.trim(), sector: f.sector.value };
      if (D().clientes.some(x => norm(x.nombre) === norm(datos.nombre) && (!c || x.id !== c.id))) {
        toast('Ya existe un cliente con ese nombre.', 'error');
        return false;
      }
      if (c) {
        const nombreAnterior = c.nombre;
        Object.assign(c, datos);
        // Mantiene la coherencia: los pedidos del cliente muestran el nombre actualizado
        D().pedidos.forEach(p => { if (p.clienteId === c.id || norm(p.cliente) === norm(nombreAnterior)) { p.cliente = c.nombre; p.clienteId = c.id; } });
        Store.registrarActividad(`Cliente "${c.nombre}" actualizado`, 'info');
        toast('Cliente actualizado correctamente.');
      } else {
        const nuevo = Object.assign({ id: Store.siguienteId('clientes', 'C', 0) }, datos);
        D().clientes.push(nuevo);
        Store.registrarActividad(`Cliente "${nuevo.nombre}" registrado`, 'nuevo');
        toast('Cliente registrado correctamente.');
      }
      Store.guardar();
      renderSeccion();
      return true;
    }
  });
}

function verPedidosCliente(id) {
  const c = buscarCliente(id);
  if (!c) return;
  const lista = pedidosDeCliente(c);
  const cuerpo = lista.length
    ? `<div class="table-responsive"><table class="table table-sr">
        <thead><tr><th>Código</th><th>Producto</th><th>Cant.</th><th>Estado</th><th>Entrega</th></tr></thead>
        <tbody>${lista.map(p => `<tr><td class="code-tag">${esc(p.id)}</td><td>${esc(p.producto)}</td><td>${esc(p.cantidad)}</td><td>${badgeEstado(p.estado)}</td><td>${fmtFecha(p.fecha)}</td></tr>`).join('')}</tbody>
      </table></div>`
    : '<div class="empty-state"><i class="bi bi-inbox"></i>Este cliente aún no tiene pedidos.</div>';
  ModalGeneral.abrir({
    titulo: `Pedidos de ${c.nombre}`,
    cuerpo: `<p class="text-muted small mb-3"><i class="bi bi-geo-alt-fill me-1"></i>${esc(c.direccion)} · ${esc(c.sector)} · ${esc(c.telefono)}</p>${cuerpo}`,
    guardar: null,
    grande: true
  });
}

function eliminarCliente(id) {
  const c = buscarCliente(id);
  if (!c) return;
  const n = pedidosDeCliente(c).length;
  if (n > 0) {
    toast(`No se puede eliminar a "${c.nombre}": tiene ${n} pedido${n > 1 ? 's' : ''} registrado${n > 1 ? 's' : ''}.`, 'error');
    return;
  }
  confirmar({
    titulo: '¿Eliminar cliente?',
    mensaje: `Se eliminará a "${c.nombre}". Esta acción no se puede deshacer.`,
    onOk: () => {
      D().clientes = D().clientes.filter(x => x.id !== id);
      Store.registrarActividad(`Cliente "${c.nombre}" eliminado`, 'alerta');
      Store.guardar();
      toast('Cliente eliminado.', 'warn');
      renderSeccion();
    }
  });
}

/* ==========================================================================
   MÓDULO: REPORTES
   ========================================================================== */
function resumenPorVehiculo() {
  return D().vehiculos.map(v => {
    const rutas = D().rutas.filter(r => r.vehiculoId === v.id);
    return {
      vehiculo: v,
      rutas: rutas.length,
      entregas: rutas.reduce((s, r) => s + r.pedidos.length, 0),
      km: Math.round(rutas.reduce((s, r) => s + r.distanciaKm, 0) * 10) / 10
    };
  });
}

function renderReportes() {
  const s = calcularStats();
  const porVeh = resumenPorVehiculo();

  const filasVeh = porVeh.map(x => `
    <tr><td class="fw-semibold">${esc(x.vehiculo.placa)}</td><td>${esc(x.vehiculo.conductor)}</td><td>${badgeEstado(x.vehiculo.estado)}</td><td>${x.rutas}</td><td>${x.entregas}</td><td>${x.km} km</td></tr>`).join('');

  const filasRutas = D().rutas.slice().reverse().map(r => `
    <tr><td class="code-tag">${esc(r.id)}</td><td>${fmtFecha(r.fecha)}</td><td>${esc(r.vehiculo)}</td><td>${r.pedidos.length}</td><td>${r.distanciaKm} km</td><td>${fmtTiempo(r.tiempoMin)}</td></tr>`).join('');

  return `
  <section>
    <div class="page-head">
      <div><h2>Reportes</h2><p>Indicadores calculados con los registros guardados en la aplicación.</p></div>
      <button class="btn btn-primary" data-action="exportar-csv"><i class="bi bi-download me-1"></i>Descargar reporte CSV</button>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon blue"><i class="bi bi-box-seam-fill"></i></div><div><div class="stat-label">Total de pedidos</div><div class="stat-value">${s.total}</div></div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon green"><i class="bi bi-check2-circle"></i></div><div><div class="stat-label">Entregas completadas</div><div class="stat-value">${s.completados}</div></div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div><div><div class="stat-label">Entregas pendientes</div><div class="stat-value">${s.pendientes}</div><div class="small text-muted">${s.enRuta} en ruta · ${s.cancelados} canceladas</div></div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="card-sr stat-card"><div class="stat-icon navy"><i class="bi bi-speedometer2"></i></div><div><div class="stat-label">Porcentaje de cumplimiento</div><div class="stat-value">${s.cumplimiento}%</div><div class="small text-muted">Sin contar canceladas</div></div></div></div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-lg-7"><div class="card-sr h-100"><div class="card-head"><h3>Entregas por día</h3><span class="text-muted small">Últimos 7 días</span></div><div class="card-body-sr"><div class="chart-box small"><canvas id="graficaReporteDias"></canvas></div></div></div></div>
      <div class="col-lg-5"><div class="card-sr h-100"><div class="card-head"><h3>Pedidos por barrio</h3><span class="text-muted small">Cobertura: ${new Set(D().pedidos.map(p => p.sector)).size} de ${Object.keys(SECTORES).length} barrios</span></div><div class="card-body-sr"><div class="chart-box small"><canvas id="graficaReporteBarrios"></canvas></div></div></div></div>
    </div>

    <div class="row g-3">
      <div class="col-xl-6"><div class="card-sr h-100"><div class="card-head"><h3>Actividad de los vehículos</h3></div>
        <div class="table-responsive"><table class="table table-sr"><thead><tr><th>Placa</th><th>Conductor</th><th>Estado</th><th>Rutas</th><th>Entregas</th><th>Distancia</th></tr></thead><tbody>${filasVeh}</tbody></table></div></div></div>
      <div class="col-xl-6"><div class="card-sr h-100"><div class="card-head"><h3>Resumen de rutas generadas</h3></div>
        ${D().rutas.length
          ? `<div class="table-responsive"><table class="table table-sr"><thead><tr><th>Ruta</th><th>Fecha</th><th>Vehículo</th><th>Entregas</th><th>Distancia</th><th>Tiempo</th></tr></thead><tbody>${filasRutas}</tbody></table></div>`
          : '<div class="empty-state"><i class="bi bi-signpost-split"></i>Aún no se han generado rutas.</div>'}
      </div></div>
    </div>
  </section>`;
}

function despuesReportes() {
  const { labels, conteos } = entregasPorDia();
  crearGrafica('graficaReporteDias', {
    type: 'line',
    data: { labels, datasets: [{ label: 'Entregas completadas', data: conteos, borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,.12)', fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#2563EB' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0, stepSize: 1 }, grid: { color: '#EEF2F9' } }, x: { grid: { display: false } } } }
  });

  // Pedidos por barrio (datos reales de los registros guardados)
  const porBarrio = {};
  D().pedidos.forEach(p => { porBarrio[p.sector] = (porBarrio[p.sector] || 0) + 1; });
  crearGrafica('graficaReporteBarrios', {
    type: 'bar',
    data: { labels: Object.keys(porBarrio), datasets: [{ label: 'Pedidos', data: Object.values(porBarrio), backgroundColor: '#16A34A', borderRadius: 8, maxBarThickness: 30 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0, stepSize: 1 }, grid: { color: '#EEF2F9' } }, y: { grid: { display: false } } } }
  });
}

/* ---------- Exportación CSV ---------- */
function celdaCSV(valor) {
  const t = String(valor === undefined || valor === null ? '' : valor);
  return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

function exportarCSV() {
  const s = calcularStats();
  const filas = [];
  filas.push(['SmartRoute - Reporte de demostración']);
  filas.push(['Generado el', new Date().toLocaleString('es-CO')]);
  filas.push(['Nota', 'Datos ficticios con fines demostrativos']);
  filas.push([]);
  filas.push(['RESUMEN']);
  filas.push(['Total de pedidos', s.total]);
  filas.push(['Entregas completadas', s.completados]);
  filas.push(['Entregas pendientes', s.pendientes]);
  filas.push(['Pedidos en ruta', s.enRuta]);
  filas.push(['Pedidos cancelados', s.cancelados]);
  filas.push(['Porcentaje de cumplimiento', s.cumplimiento + '%']);
  filas.push([]);
  filas.push(['PEDIDOS']);
  filas.push(['Código', 'Cliente', 'Dirección', 'Sector', 'Producto', 'Cantidad', 'Estado', 'Fecha de entrega']);
  D().pedidos.forEach(p => filas.push([p.id, p.cliente, p.direccion, p.sector, p.producto, p.cantidad, p.estado, fmtFecha(p.fecha)]));
  filas.push([]);
  filas.push(['RUTAS GENERADAS']);
  filas.push(['Ruta', 'Fecha', 'Vehículo', 'Entregas', 'Distancia (km)', 'Tiempo (min)']);
  D().rutas.forEach(r => filas.push([r.id, fmtFecha(r.fecha), r.vehiculo, r.pedidos.length, r.distanciaKm, r.tiempoMin]));
  filas.push([]);
  filas.push(['VEHÍCULOS']);
  filas.push(['Placa', 'Modelo', 'Tipo', 'Capacidad', 'Conductor', 'Estado']);
  D().vehiculos.forEach(v => filas.push([v.placa, v.modelo, v.tipo, v.capacidad, v.conductor, v.estado]));

  // BOM + separador ";" para que Excel en español abra bien las columnas
  const csv = '﻿' + filas.map(f => f.map(celdaCSV).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_smartroute_${hoy()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Reporte CSV descargado.');
}

/* ==========================================================================
   MÓDULO: CONFIGURACIÓN
   ========================================================================== */
function renderConfiguracion() {
  const c = D().config;
  return `
  <section>
    <div class="page-head"><div><h2>Configuración</h2><p>Datos de la empresa y preferencias generales.</p></div></div>
    <div class="row g-3">
      <div class="col-lg-7">
        <div class="card-sr mb-3">
          <div class="card-head"><h3>Datos de la cuenta</h3></div>
          <div class="card-body-sr">
            <form id="formConfig" novalidate>
              <div class="row g-3">
                <div class="col-md-6"><label class="form-label" for="cfEmpresa">Nombre de la empresa</label>
                  <input id="cfEmpresa" name="empresa" class="form-control" required maxlength="60" value="${esc(c.empresa)}"><div class="invalid-feedback">Indica el nombre de la empresa.</div></div>
                <div class="col-md-6"><label class="form-label" for="cfAdmin">Nombre del administrador</label>
                  <input id="cfAdmin" name="administrador" class="form-control" required maxlength="60" value="${esc(c.administrador)}"><div class="invalid-feedback">Indica el nombre del administrador.</div></div>
                <div class="col-md-6"><label class="form-label" for="cfCorreo">Correo electrónico (ficticio)</label>
                  <input id="cfCorreo" name="correo" type="email" class="form-control" required value="${esc(c.correo)}"><div class="invalid-feedback">Ingresa un correo válido.</div></div>
                <div class="col-md-6"><label class="form-label" for="cfCiudad">Ciudad</label>
                  <input id="cfCiudad" name="ciudad" class="form-control" required maxlength="60" value="${esc(c.ciudad)}"><div class="invalid-feedback">Indica la ciudad.</div></div>
                <div class="col-md-6"><label class="form-label" for="cfMoneda">Moneda por defecto</label>
                  <input id="cfMoneda" class="form-control" value="COP ($) · Peso colombiano" readonly></div>
                <div class="col-12">
                  <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" role="switch" id="cfNotif" name="notificaciones" ${c.notificaciones ? 'checked' : ''}><label class="form-check-label" for="cfNotif">Mostrar avisos de confirmación al realizar acciones</label></div>
                  <div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="cfCompacto" name="modoCompacto" ${c.modoCompacto ? 'checked' : ''}><label class="form-check-label" for="cfCompacto">Modo compacto (tablas y espacios más reducidos)</label></div>
                </div>
              </div>
              <div class="mt-4"><button type="submit" class="btn btn-primary"><i class="bi bi-save-fill me-1"></i>Guardar cambios</button></div>
            </form>
          </div>
        </div>

        <div class="card-sr">
          <div class="card-head"><h3>Datos de demostración</h3></div>
          <div class="card-body-sr d-flex flex-wrap align-items-center justify-content-between gap-3">
            <p class="mb-0 text-muted">Los cambios se guardan en este navegador (localStorage). Puedes volver a los datos iniciales cuando quieras.</p>
            <button class="btn btn-outline-danger" data-action="restablecer"><i class="bi bi-arrow-counterclockwise me-1"></i>Restablecer datos de demostración</button>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="card-sr mb-3">
          <div class="card-head"><h3>Información de la empresa</h3></div>
          <div class="card-body-sr py-2">
            <div class="info-row"><div class="lbl">Empresa</div><div class="fw-semibold">${esc(c.empresa)}</div></div>
            <div class="info-row"><div class="lbl">Ubicación</div><div>${esc(c.ciudad)}</div></div>
            <div class="info-row"><div class="lbl">Actividad</div><div>${esc(c.actividad)}</div></div>
            <div class="info-row"><div class="lbl">Contacto</div><div>${esc(c.correo)}</div></div>
          </div>
        </div>

        <div class="card-sr">
          <div class="card-head"><h3>Planes propuestos</h3></div>
          <div class="card-body-sr">
            <div class="row g-3">
              <div class="col-6">
                <div class="plan-card">
                  <div class="small text-muted fw-semibold">Plan básico</div>
                  <div class="plan-price">${fmtCOP(49900)}</div>
                  <div class="small text-muted">al mes</div>
                  <div class="small mt-2">Hasta 3 vehículos y 100 pedidos mensuales.</div>
                </div>
              </div>
              <div class="col-6">
                <div class="plan-card featured">
                  <div class="small text-muted fw-semibold">Plan estándar</div>
                  <div class="plan-price">${fmtCOP(79900)}</div>
                  <div class="small text-muted">al mes</div>
                  <div class="small mt-2">Vehículos y pedidos sin límite.</div>
                </div>
              </div>
            </div>
            <ul class="small text-muted mt-3 mb-0 ps-3">
              <li>Implementación inicial: desde ${fmtCOP(100000)}.</li>
              <li>Soporte personalizado: según el servicio.</li>
            </ul>
            <div class="small text-muted mt-3"><i class="bi bi-info-circle me-1"></i>Propuesta de emprendimiento universitario; SmartRoute es un prototipo demostrativo, no una plataforma comercial desplegada.</div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function guardarConfiguracion(form) {
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    toast('Revisa los campos marcados en rojo.', 'error');
    return;
  }
  const f = form.elements;
  Object.assign(D().config, {
    empresa: f.empresa.value.trim(),
    administrador: f.administrador.value.trim(),
    correo: f.correo.value.trim(),
    ciudad: f.ciudad.value.trim(),
    notificaciones: f.notificaciones.checked,
    modoCompacto: f.modoCompacto.checked
  });
  Store.guardar();
  renderSeccion();
  toast('Configuración guardada correctamente.');
}

function restablecerDatos() {
  confirmar({
    titulo: '¿Restablecer datos?',
    mensaje: 'Se perderán los cambios realizados y se cargarán de nuevo los datos de demostración.',
    boton: 'Restablecer',
    onOk: () => {
      Store.restablecer();
      App.plan = { sel: null, vehiculoId: '', resultado: null };
      App.q = { pedidos: '', clientes: '', vehiculos: '' };
      App.filtroEstado = '';
      $('#buscadorGlobal').value = '';
      toast('Datos de demostración restablecidos.', 'info');
      renderSeccion();
    }
  });
}

/* ==========================================================================
   EVENTOS (delegación)
   ========================================================================== */
const ACCIONES = {
  'ir':                id => irA(id),
  'nuevo-pedido':      () => abrirFormPedido(),
  'editar-pedido':     id => abrirFormPedido(id),
  'eliminar-pedido':   id => eliminarPedido(id),
  'nuevo-vehiculo':    () => abrirFormVehiculo(),
  'editar-vehiculo':   id => abrirFormVehiculo(id),
  'eliminar-vehiculo': id => eliminarVehiculo(id),
  'nuevo-cliente':     () => abrirFormCliente(),
  'editar-cliente':    id => abrirFormCliente(id),
  'eliminar-cliente':  id => eliminarCliente(id),
  'pedidos-cliente':   id => verPedidosCliente(id),
  'generar-ruta':      (id, el) => generarRuta(el),
  'despachar-ruta':    () => despacharRuta(),
  'limpiar-ruta':      () => {
    App.plan.resultado = null;
    Rutas.dibujar('mapaRutas', null, pedidosPendientes());
    $('#resultadoRuta').innerHTML = tarjetaSinResultado();
  },
  'seleccionar-todos': () => {
    const pend = pedidosPendientes();
    const todos = pend.every(p => App.plan.sel.has(p.id));
    App.plan.sel = todos ? new Set() : new Set(pend.map(p => p.id));
    $$('#listaPlan input[type=checkbox]').forEach(chk => {
      chk.checked = !todos;
      chk.closest('.pedido-pick').classList.toggle('selected', !todos);
    });
    actualizarCarga();
  },
  'exportar-csv':      () => exportarCSV(),
  'restablecer':       () => restablecerDatos()
};

const CAMBIOS = {
  'estado-pedido':   (id, el) => cambiarEstadoPedido(id, el.value),
  'estado-vehiculo': (id, el) => cambiarEstadoVehiculo(id, el.value),
  'filtro-estado':   (id, el) => { App.filtroEstado = el.value; pintarTablaPedidos(); },
  'plan-vehiculo':   (id, el) => { App.plan.vehiculoId = el.value; actualizarCarga(); },
  'plan-check':      (id, el) => {
    if (el.checked) App.plan.sel.add(id); else App.plan.sel.delete(id);
    el.closest('.pedido-pick').classList.toggle('selected', el.checked);
    actualizarCarga();
  }
};

/* Aplica el texto de búsqueda al módulo actual (buscador superior y locales sincronizados) */
function aplicarBusqueda(valor) {
  const sec = App.seccion;
  if (!(sec in App.q)) return;
  App.q[sec] = valor;
  $('#buscadorGlobal').value = valor;
  const local = { pedidos: '#buscarPedidos', clientes: '#buscarClientes', vehiculos: '#buscarVehiculos' }[sec];
  const campo = local && $(local);
  if (campo && campo.value !== valor) campo.value = valor;
  if (sec === 'pedidos') pintarTablaPedidos();
  if (sec === 'clientes') pintarTablaClientes();
  if (sec === 'vehiculos') pintarVehiculos();
}

function iniciarEventos() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const fn = ACCIONES[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el.dataset.id, el); }
  });

  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = CAMBIOS[el.dataset.change];
    if (fn) fn(el.dataset.id, el);
  });

  document.addEventListener('input', e => {
    const id = e.target.id;
    if (id === 'buscarPedidos' || id === 'buscarClientes' || id === 'buscarVehiculos' || id === 'buscadorGlobal') {
      aplicarBusqueda(e.target.value);
    }
  });

  // Buscador superior fuera de los módulos con listado: Enter busca en Pedidos
  $('#buscadorGlobal').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !(App.seccion in App.q)) {
      const valor = e.target.value.trim();
      if (!valor) return;
      App.q.pedidos = valor;
      irA('pedidos');
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'formConfig') { e.preventDefault(); guardarConfiguracion(e.target); }
  });

  window.addEventListener('hashchange', () => navegar(location.hash.replace('#', '')));

  // Menú móvil
  $('#btnMenu').addEventListener('click', () => {
    $('#sidebar').classList.add('abierto');
    $('#sidebarBackdrop').classList.add('visible');
  });
  $('#sidebarBackdrop').addEventListener('click', cerrarMenuMovil);

  // Redimensionar el mapa si cambia el tamaño de la ventana
  window.addEventListener('resize', () => { if (Rutas.mapa) Rutas.mapa.invalidateSize(); });
}

/* ==========================================================================
   INICIO
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  Store.cargar();
  if (typeof Chart !== 'undefined') Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  iniciarEventos();
  navegar(location.hash.replace('#', '') || 'dashboard');
});
