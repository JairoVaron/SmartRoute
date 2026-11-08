/* ==========================================================================
   SmartRoute - routes.js
   Simulación de planificación de rutas y dibujo del mapa.

   MAPA: usa Leaflet con VARIOS proveedores de mosaicos. Si el primero no
   responde (por ejemplo, OpenStreetMap bloquea las peticiones cuando la
   página se abre como archivo local, sin "Referer"), se cambia
   automáticamente al siguiente. Si Leaflet no carga, se dibuja un mapa
   esquemático en SVG.

   IMPORTANTE: la planificación es DEMOSTRATIVA. El orden de las paradas se
   obtiene con una heurística sencilla de "vecino más cercano". Opcionalmente
   se consulta el servicio público OSRM solo para TRAZAR el recorrido por
   calles y medir su distancia; no se usa para optimizar el orden.
   ========================================================================== */

const Rutas = {
  mapa: null,            // instancia de Leaflet
  capaRuta: null,        // grupo de capas (marcadores + línea)
  usandoLeaflet: false,
  capasBase: [],         // capas de mosaicos disponibles
  indiceBase: 0,         // proveedor activo
  temporizadorMosaicos: null,

  /* Colores para los marcadores */
  COLORES: ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D'],

  /* Valores de la estimación demostrativa */
  VELOCIDAD_KMH: 25,
  MIN_POR_PARADA: 4,
  FACTOR_CALLES: 1.3,    // la distancia real por calles es mayor que la línea recta

  /* Proveedores de mosaicos (ninguno requiere clave). Se prueban en este orden. */
  PROVEEDORES: [
    {
      nombre: 'Calles (CARTO)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      opciones: { subdomains: 'abcd', maxZoom: 19, attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' }
    },
    {
      nombre: 'Calles (Esri)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      opciones: { maxZoom: 19, attribution: 'Mosaicos &copy; Esri' }
    },
    {
      nombre: 'Satélite (Esri)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      opciones: { maxZoom: 19, attribution: 'Mosaicos &copy; Esri' }
    },
    {
      nombre: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      opciones: { maxZoom: 19, attribution: '&copy; Colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }
    }
  ],

  /* ---------- Cálculos ---------- */

  /* Distancia en línea recta entre dos coordenadas (fórmula de Haversine), en km */
  distanciaKm(a, b) {
    const R = 6371;
    const rad = x => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
              Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  },

  /* Coordenadas de un pedido según su sector (con un pequeño desplazamiento
     determinista para que pedidos del mismo sector no queden superpuestos) */
  ubicacionDePedido(pedido) {
    const base = SECTORES[pedido.sector] || { lat: BODEGA.lat, lng: BODEGA.lng };
    const num = parseInt(String(pedido.id).replace(/\D/g, ''), 10) || 0;
    const dLat = (((num * 7) % 11) - 5) * 0.00016;
    const dLng = (((num * 13) % 11) - 5) * 0.00016;
    return { lat: base.lat + dLat, lng: base.lng + dLng };
  },

  /* Ordena los puntos con la heurística del vecino más cercano partiendo de la bodega */
  ordenarVecinoMasCercano(origen, puntos) {
    const pendientes = puntos.slice();
    const orden = [];
    let actual = origen;
    while (pendientes.length) {
      let mejor = 0;
      let mejorDist = Infinity;
      pendientes.forEach((p, i) => {
        const d = this.distanciaKm(actual, p.ubicacion);
        if (d < mejorDist) { mejorDist = d; mejor = i; }
      });
      const elegido = pendientes.splice(mejor, 1)[0];
      orden.push(elegido);
      actual = elegido.ubicacion;
    }
    return orden;
  },

  /* Simula la planificación para una lista de pedidos y un vehículo.
     Devuelve un objeto con el resultado o { error } si no es posible. */
  simular(pedidos, vehiculo) {
    if (!pedidos.length) return { error: 'Selecciona al menos un pedido pendiente.' };
    if (!vehiculo) return { error: 'Selecciona un vehículo disponible.' };

    const carga = pedidos.reduce((s, p) => s + Number(p.cantidad || 0), 0);
    if (carga > vehiculo.capacidad) {
      return { error: `La carga seleccionada (${carga} uds.) supera la capacidad del vehículo ${vehiculo.placa} (${vehiculo.capacidad} uds.).` };
    }

    const puntos = pedidos.map(p => ({ pedido: p, ubicacion: this.ubicacionDePedido(p) }));
    const orden = this.ordenarVecinoMasCercano(BODEGA, puntos);

    // Distancia: bodega -> paradas -> regreso a bodega
    let linea = 0;
    let anterior = BODEGA;
    orden.forEach(pt => { linea += this.distanciaKm(anterior, pt.ubicacion); anterior = pt.ubicacion; });
    linea += this.distanciaKm(anterior, BODEGA);

    const distanciaKm = Math.round(linea * this.FACTOR_CALLES * 10) / 10;
    const tiempoMin = Math.round((distanciaKm / this.VELOCIDAD_KMH) * 60 + orden.length * this.MIN_POR_PARADA);

    return { orden, distanciaKm, tiempoMin, carga, vehiculo, calles: null };
  },

  /* Consulta opcional al servicio público OSRM para trazar el recorrido por calles.
     Devuelve { coords, km, min } o null si no hay conexión / el servicio no responde.
     Solo traza el recorrido: el ORDEN de las paradas sigue siendo el de la heurística. */
  async rutaPorCalles(resultado) {
    if (!resultado || !resultado.orden || typeof fetch === 'undefined') return null;
    const puntos = [BODEGA].concat(resultado.orden.map(pt => pt.ubicacion), [BODEGA]);
    const coords = puntos.map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const control = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const limite = setTimeout(() => control && control.abort(), 6000);
    try {
      const resp = await fetch(url, control ? { signal: control.signal } : undefined);
      if (!resp.ok) return null;
      const json = await resp.json();
      if (json.code !== 'Ok' || !json.routes || !json.routes.length) return null;
      const ruta = json.routes[0];
      return {
        coords: ruta.geometry.coordinates.map(c => [c[1], c[0]]),
        km: Math.round(ruta.distance / 100) / 10,
        min: Math.max(1, Math.round(ruta.duration / 60))
      };
    } catch (e) {
      return null;
    } finally {
      clearTimeout(limite);
    }
  },

  /* ---------- Mapa ---------- */

  /* Crea (o recrea) el mapa dentro del contenedor indicado */
  iniciarMapa(idContenedor) {
    this.destruirMapa();
    const cont = document.getElementById(idContenedor);
    if (!cont) return;
    cont.innerHTML = '';
    cont.classList.remove('sr-sin-mosaicos');

    if (typeof L === 'undefined') {
      this.usandoLeaflet = false;
      return; // el respaldo SVG se dibuja en dibujar()
    }

    try {
      this.mapa = L.map(idContenedor, { zoomControl: true, attributionControl: true }).setView([BODEGA.lat, BODEGA.lng], 14);
      this.capaRuta = L.layerGroup().addTo(this.mapa);
      this.usandoLeaflet = true;
      this.iniciarMosaicos(cont);
      // Corrige el tamaño cuando el contenedor ya es visible
      [100, 400, 1000].forEach(ms => setTimeout(() => this.mapa && this.mapa.invalidateSize(), ms));
    } catch (e) {
      console.warn('Leaflet no pudo iniciarse, se usa el mapa de respaldo.', e);
      this.usandoLeaflet = false;
      this.mapa = null;
    }
  },

  /* Crea las capas de mosaicos, el control para cambiarlas y el cambio automático */
  iniciarMosaicos(cont) {
    const aviso = document.getElementById('avisoMapaOffline');
    if (aviso) aviso.classList.add('d-none');
    this.capasBase = [];
    this.indiceBase = 0;

    const base = {};
    this.PROVEEDORES.forEach((prov, i) => {
      const capa = L.tileLayer(prov.url, Object.assign({}, prov.opciones, { crossOrigin: false }));
      capa._sr = { cargados: 0, errores: 0, indice: i };
      capa.on('tileload', () => { capa._sr.cargados++; if (aviso) aviso.classList.add('d-none'); });
      capa.on('tileerror', () => {
        capa._sr.errores++;
        // Si el proveedor activo falla varias veces sin cargar ninguna imagen, se prueba el siguiente
        if (capa === this.capasBase[this.indiceBase] && capa._sr.cargados === 0 && capa._sr.errores >= 3) {
          this.siguienteProveedor(cont);
        }
      });
      this.capasBase.push(capa);
      base[prov.nombre] = capa;
    });

    this.capasBase[0].addTo(this.mapa);
    L.control.layers(base, null, { position: 'topright', collapsed: true }).addTo(this.mapa);

    // Si pasados unos segundos no ha cargado nada (bloqueo silencioso), también se cambia
    clearTimeout(this.temporizadorMosaicos);
    this.temporizadorMosaicos = setTimeout(() => {
      const activa = this.capasBase[this.indiceBase];
      if (activa && activa._sr.cargados === 0) this.siguienteProveedor(cont);
    }, 7000);
  },

  siguienteProveedor(cont) {
    if (!this.mapa) return;
    const anterior = this.capasBase[this.indiceBase];
    const siguiente = this.indiceBase + 1;
    if (siguiente >= this.capasBase.length) {
      // Ningún proveedor responde: se mantiene la ruta sobre un fondo cuadriculado
      cont.classList.add('sr-sin-mosaicos');
      const aviso = document.getElementById('avisoMapaOffline');
      if (aviso) aviso.classList.remove('d-none');
      return;
    }
    this.indiceBase = siguiente;
    if (anterior && this.mapa.hasLayer(anterior)) this.mapa.removeLayer(anterior);
    this.capasBase[siguiente].addTo(this.mapa);
    clearTimeout(this.temporizadorMosaicos);
    this.temporizadorMosaicos = setTimeout(() => {
      const activa = this.capasBase[this.indiceBase];
      if (activa && activa._sr.cargados === 0) this.siguienteProveedor(cont);
    }, 7000);
  },

  destruirMapa() {
    clearTimeout(this.temporizadorMosaicos);
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
      this.capaRuta = null;
    }
    this.capasBase = [];
  },

  /* Icono numerado y coloreado para Leaflet */
  crearIcono(texto, color) {
    return L.divIcon({
      className: 'sr-marker-wrap',
      html: `<div class="sr-marker" style="background:${color}">${texto}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -14]
    });
  },

  /* Dibuja el estado actual:
       - resultado: objeto devuelto por simular() (con o sin .calles) o null
       - pedidosPendientes: se muestran como puntos simples cuando no hay ruta */
  dibujar(idContenedor, resultado, pedidosPendientes) {
    if (!this.usandoLeaflet || !this.mapa) {
      this.dibujarRespaldo(idContenedor, resultado, pedidosPendientes);
      return;
    }

    this.capaRuta.clearLayers();
    const limites = [[BODEGA.lat, BODEGA.lng]];

    // Marcador de la bodega
    L.marker([BODEGA.lat, BODEGA.lng], { icon: this.crearIcono('<i class="bi bi-house-door-fill"></i>', '#14213D') })
      .bindPopup(`<strong>${BODEGA.nombre}</strong><br>Punto de partida y regreso`)
      .addTo(this.capaRuta);

    if (resultado && resultado.orden) {
      const coords = [[BODEGA.lat, BODEGA.lng]];
      resultado.orden.forEach((pt, i) => {
        const color = this.COLORES[i % this.COLORES.length];
        const p = pt.pedido;
        L.marker([pt.ubicacion.lat, pt.ubicacion.lng], { icon: this.crearIcono(i + 1, color) })
          .bindPopup(`<strong>Parada ${i + 1}: ${p.cliente}</strong><br>${p.direccion}, ${p.sector}<br>${p.producto} · ${p.cantidad} uds.`)
          .addTo(this.capaRuta);
        coords.push([pt.ubicacion.lat, pt.ubicacion.lng]);
        limites.push([pt.ubicacion.lat, pt.ubicacion.lng]);
      });

      if (resultado.calles && resultado.calles.coords.length > 1) {
        // Recorrido por calles (OSRM): línea continua que sigue las vías
        const linea = L.polyline(resultado.calles.coords, { color: '#2563EB', weight: 5, opacity: 0.85 }).addTo(this.capaRuta);
        linea.getBounds().isValid() && limites.push(linea.getBounds().getNorthEast(), linea.getBounds().getSouthWest());
      } else {
        // Sin servicio de calles: líneas rectas entre paradas y regreso punteado
        L.polyline(coords, { color: '#2563EB', weight: 5, opacity: 0.85 }).addTo(this.capaRuta);
        L.polyline([coords[coords.length - 1], coords[0]], { color: '#64748B', weight: 3, opacity: 0.7, dashArray: '8 8' }).addTo(this.capaRuta);
      }
    } else {
      // Sin ruta: se muestran los pedidos pendientes como puntos
      (pedidosPendientes || []).forEach((p, i) => {
        const u = this.ubicacionDePedido(p);
        L.marker([u.lat, u.lng], { icon: this.crearIcono(i + 1, this.COLORES[i % this.COLORES.length]) })
          .bindPopup(`<strong>${p.cliente}</strong><br>${p.direccion}, ${p.sector}<br>${p.producto} · ${p.cantidad} uds.`)
          .addTo(this.capaRuta);
        limites.push([u.lat, u.lng]);
      });
    }

    if (limites.length > 1) this.mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 15 });
    setTimeout(() => this.mapa && this.mapa.invalidateSize(), 100);
  },

  /* Mapa de respaldo (SVG) para cuando Leaflet no está disponible */
  dibujarRespaldo(idContenedor, resultado, pedidosPendientes) {
    const cont = document.getElementById(idContenedor);
    if (!cont) return;

    const items = [];
    if (resultado && resultado.orden) {
      resultado.orden.forEach((pt, i) => items.push({ ...pt.ubicacion, etiqueta: String(i + 1), nombre: pt.pedido.cliente, color: this.COLORES[i % this.COLORES.length] }));
    } else {
      (pedidosPendientes || []).forEach((p, i) => items.push({ ...this.ubicacionDePedido(p), etiqueta: String(i + 1), nombre: p.cliente, color: this.COLORES[i % this.COLORES.length] }));
    }

    const todos = [{ lat: BODEGA.lat, lng: BODEGA.lng }].concat(items);
    const lats = todos.map(t => t.lat), lngs = todos.map(t => t.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const W = 800, H = 500, pad = 60;
    const rx = (maxLng - minLng) || 0.01, ry = (maxLat - minLat) || 0.01;
    const px = lng => pad + ((lng - minLng) / rx) * (W - 2 * pad);
    const py = lat => H - pad - ((lat - minLat) / ry) * (H - 2 * pad);

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="sr-fallback-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de respaldo de la ruta">`;
    svg += `<defs><pattern id="rejilla" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#E2E8F0" stroke-width="1"/></pattern></defs>`;
    svg += `<rect width="${W}" height="${H}" fill="#F1F5F9"/><rect width="${W}" height="${H}" fill="url(#rejilla)"/>`;

    if (resultado && items.length) {
      const pts = [[px(BODEGA.lng), py(BODEGA.lat)]].concat(items.map(t => [px(t.lng), py(t.lat)]));
      svg += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#2563EB" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
      svg += `<line x1="${pts[pts.length - 1][0]}" y1="${pts[pts.length - 1][1]}" x2="${pts[0][0]}" y2="${pts[0][1]}" stroke="#64748B" stroke-width="3" stroke-dasharray="8 8"/>`;
    }
    // Bodega
    svg += `<g><circle cx="${px(BODEGA.lng)}" cy="${py(BODEGA.lat)}" r="16" fill="#14213D"/><text x="${px(BODEGA.lng)}" y="${py(BODEGA.lat) + 5}" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">B</text></g>`;
    items.forEach(t => {
      svg += `<g><circle cx="${px(t.lng)}" cy="${py(t.lat)}" r="14" fill="${t.color}" stroke="#fff" stroke-width="3"/>` +
             `<text x="${px(t.lng)}" y="${py(t.lat) + 5}" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">${t.etiqueta}</text>` +
             `<text x="${px(t.lng)}" y="${py(t.lat) - 20}" text-anchor="middle" fill="#14213D" font-size="12">${t.nombre}</text></g>`;
    });
    svg += '</svg>';

    cont.innerHTML = svg +
      '<div class="sr-fallback-note"><i class="bi bi-wifi-off me-1"></i>Mapa de respaldo (no se pudo cargar Leaflet). Representación esquemática demostrativa.</div>';
  }
};
