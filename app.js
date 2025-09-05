(() => {
  // datos globales
  let DATA = {
    companies: [],
    vehicles: [],
    routes: [],
    schedules: []
  };

  /* -------------------------
     HELPERS
  --------------------------*/
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => (t.style.display = 'none'), 3000);
  }

  /* -------------------------
     RENDERS / UI
  --------------------------*/
  function setCounters() {
    const routesLen = (DATA.routes || []).length;
    const companiesLen = (DATA.companies || []).length;
    const vehiclesLen = (DATA.vehicles || []).length;
    const elNumRoutes = $('#numRoutes');
    const elNumCompanies = $('#numCompanies');
    const elNumVehicles = $('#numVehicles');
    if (elNumRoutes) elNumRoutes.textContent = routesLen;
    if (elNumCompanies) elNumCompanies.textContent = companiesLen;
    if (elNumVehicles) elNumVehicles.textContent = vehiclesLen;
  }

  function renderCompanies() {
    const el = $('#companiesList');
    if (!el) return;
    el.innerHTML = '';
    (DATA.companies || []).forEach(c => {
      const card = document.createElement('article');
      card.className = 'card fade-in';
      card.innerHTML = `
        <h3>${escapeHtml(c.name)}</h3>
        <p class="meta">${escapeHtml(c.phone)} • ${escapeHtml(c.email || '—')}</p>
        <p>${escapeHtml(c.description || '')}</p>
      `;
      el.appendChild(card);
    });
  }

  function renderVehicles() {
    const el = $('#vehiclesList');
    if (!el) return;
    el.innerHTML = '';
    (DATA.vehicles || []).forEach(v => {
      const card = document.createElement('div');
      card.className = 'card fade-in';
      card.innerHTML = `
        <h3>${escapeHtml(v.type)}</h3>
        <p class="meta">Capacidad: ${escapeHtml(String(v.capacity))} • Servicios: ${escapeHtml((v.services || []).join(', '))}</p>
      `;
      el.appendChild(card);
    });
  }

  function renderRoutes() {
    const el = $('#routesList');
    if (!el) return;
    el.innerHTML = '';
    (DATA.routes || []).forEach(r => {
      const card = document.createElement('div');
      card.className = 'card fade-in';
      card.innerHTML = `
        <h3>${escapeHtml(r.to)}</h3>
        <p class="meta">Duración: ${escapeHtml(r.duration)} • Distancia: ${escapeHtml(String(r.distance))} km</p>
        <p>${escapeHtml(r.description || '')}</p>
      `;
      el.appendChild(card);
    });
  }

  function populateFilters() {
    const destSel = $('#filterDestination');
    const vehSel = $('#filterVehicle');
    const qDestino = $('#qDestino');
    const qVehiculo = $('#qVehiculo');
    const pDestino = $('#pDestino');

    const uniqueDest = [...new Set((DATA.routes || []).map(r => r.to))];
    uniqueDest.forEach(d => {
      if (destSel) {
        const o = document.createElement('option');
        o.value = d;
        o.textContent = d;
        destSel.appendChild(o);
      }
      if (qDestino) {
        const o2 = document.createElement('option');
        o2.value = d;
        o2.textContent = d;
        qDestino.appendChild(o2);
      }
      if (pDestino) {
        const o3 = document.createElement('option');
        o3.value = d;
        o3.textContent = d;
        pDestino.appendChild(o3);
      }
    });

    (DATA.vehicles || []).forEach(v => {
      if (vehSel) {
        const ov = document.createElement('option');
        ov.value = v.type;
        ov.textContent = v.type;
        vehSel.appendChild(ov);
      }
      if (qVehiculo) {
        const ov2 = document.createElement('option');
        ov2.value = v.type;
        ov2.textContent = v.type;
        qVehiculo.appendChild(ov2);
      }
    });
  }

  function renderSchedules(filter = {}) {
    const tableWrap = $('#schedulesTable');
    if (!tableWrap) return;
    const schedules = DATA.schedules || [];
    const filtered = schedules.filter(s => {
      if (filter.dest && s.to !== filter.dest) return false;
      if (filter.vehicle && s.vehicle !== filter.vehicle) return false;
      return true;
    });
    const rows = filtered
      .map(
        s => `
      <tr>
        <td>${escapeHtml(s.company)}</td>
        <td>${escapeHtml(s.vehicle)}</td>
        <td>${escapeHtml(s.from)}</td>
        <td>${escapeHtml(s.to)}</td>
        <td>${escapeHtml(s.departure)}</td>
        <td>${escapeHtml(s.arrival)}</td>
      </tr>`
      )
      .join('');
    tableWrap.innerHTML = `
      <table class="schedules-table">
        <thead><tr><th>Empresa</th><th>Vehículo</th><th>Origen</th><th>Destino</th><th>Salida</th><th>Llegada</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="opacity:.7;padding:22px">No hay resultados</td></tr>'}</tbody>
      </table>
    `;
  }

  /* -------------------------
     LÓGICA DE NEGOCIO
  --------------------------*/
  function calculatePrice(dest, vehicleType, passengers = 1) {
    const route = (DATA.routes || []).find(r => r.to === dest);
    const vehicle = (DATA.vehicles || []).find(v => v.type === vehicleType);
    if (!route || !vehicle) return null;
    const basePerKm = 200; // valor ficticio COP/km
    const priceSingle = Math.max(1500, Math.round(route.distance * basePerKm * (vehicle.factor || 1)));
    return priceSingle * passengers;
  }

  /* -------------------------
     FORM BINDERS
  --------------------------*/
  function bindQuoteForm() {
    const form = $('#quoteForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const dest = $('#qDestino') ? $('#qDestino').value : '';
      const veh = $('#qVehiculo') ? $('#qVehiculo').value : '';
      const pax = parseInt($('#qPasajeros') ? $('#qPasajeros').value : '1', 10) || 1;
      const price = calculatePrice(dest, veh, pax);
      const res = $('#quoteResult');
      if (!res) return;
      if (price == null) {
        res.innerHTML = '<strong>Datos incompletos o destino/vehículo no soportado</strong>';
        return;
      }
      res.innerHTML = `<strong>Precio estimado:</strong> ${price.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP'
      })} <div style="margin-top:8px;color:var(--muted)">Precio válido como referencia. Para pago real contacte a la terminal.</div>`;
    });

    const clearBtn = $('#clearQuote');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if ($('#qDestino')) $('#qDestino').value = '';
        if ($('#qVehiculo')) $('#qVehiculo').value = '';
        if ($('#qPasajeros')) $('#qPasajeros').value = 1;
        if ($('#quoteResult')) $('#quoteResult').innerHTML = '';
      });
    }
  }

  function bindPurchaseForm() {
    const form = $('#purchaseForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#pNombre') ? $('#pNombre').value.trim() : '';
      const doc = $('#pDocumento') ? $('#pDocumento').value.trim() : '';
      const dest = $('#pDestino') ? $('#pDestino').value : '';
      const date = $('#pFecha') ? $('#pFecha').value : '';
      const pax = parseInt($('#pPasajeros') ? $('#pPasajeros').value : '1', 10) || 1;

      if (!name || !doc || !dest || !date) {
        toast('Por favor complete todos los campos.');
        return;
      }

      // Si tipo de vehículo no seleccionado, usamos el primero disponible como referencia
      const defaultVehicleType = (DATA.vehicles && DATA.vehicles[0] && DATA.vehicles[0].type) || '';
      const price = calculatePrice(dest, defaultVehicleType, pax) || 0;

      const result = $('#purchaseResult');
      if (!result) return;
      const reservationId = 'RION-' + Math.random().toString(36).slice(2, 9).toUpperCase();
      result.innerHTML = `
        <strong>Reserva generada</strong>
        <p>ID: ${reservationId}</p>
        <p>Pasajero: ${escapeHtml(name)} • Documento: ${escapeHtml(doc)}</p>
        <p>Destino: ${escapeHtml(dest)} • Fecha: ${escapeHtml(date)} • Pasajeros: ${escapeHtml(String(pax))}</p>
        <p>Total aproximado: ${price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
        <div style="margin-top:8px;color:var(--muted)">Nota: esta plataforma es una demostración; para confirmar el pago contacte la terminal.</div>
      `;
      toast('Reserva creada: ' + reservationId);
      form.reset();
    });
  }

  function bindContactForm() {
    const form = $('#contactForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#cNombre') ? $('#cNombre').value.trim() : '';
      const email = $('#cEmail') ? $('#cEmail').value.trim() : '';
      const msg = $('#cMensaje') ? $('#cMensaje').value.trim() : '';
      if (!name || !email || !msg) {
        toast('Complete los campos');
        return;
      }
      const out = $('#contactResult');
      if (!out) return;
      out.innerHTML = `<strong>Mensaje enviado</strong><p>Gracias ${escapeHtml(name)}. Responderemos a ${escapeHtml(email)} pronto.</p>`;
      form.reset();
    });
  }

  function bindFilters() {
    const fd = $('#filterDestination');
    const fv = $('#filterVehicle');
    if (fd) {
      fd.addEventListener('change', e => {
        const vehicle = fv ? fv.value : '';
        renderSchedules({ dest: e.target.value, vehicle });
      });
    }
    if (fv) {
      fv.addEventListener('change', e => {
        const dest = fd ? fd.value : '';
        renderSchedules({ dest, vehicle: e.target.value });
      });
    }
  }

  function bindNav() {
    const navToggle = $('#navToggle');
    if (navToggle) {
      navToggle.addEventListener('click', () => {
        const nav = document.querySelector('.nav-list');
        if (!nav) return;
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      });
    }
    // smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (window.innerWidth < 980) {
            const nav = document.querySelector('.nav-list');
            if (nav) nav.style.display = 'none';
          }
        }
      });
    });
  }

  /* -------------------------
     INICIALIZADOR
  --------------------------*/
  function init() {
    try {
      setCounters();
      renderCompanies();
      renderVehicles();
      renderRoutes();
      populateFilters();
      renderSchedules({});
      bindQuoteForm();
      bindPurchaseForm();
      bindContactForm();
      bindFilters();
      bindNav();

      // small stagger reveal for cards
      document.querySelectorAll('.card.fade-in').forEach((el, i) => {
        el.style.animationDelay = i * 60 + 'ms';
      });
    } catch (err) {
      console.error('Error en init():', err);
    }
  }

  function initWithData(d) {
    DATA = {
      companies: Array.isArray(d.companies) ? d.companies : [],
      vehicles: Array.isArray(d.vehicles) ? d.vehicles : [],
      routes: Array.isArray(d.routes) ? d.routes : [],
      schedules: Array.isArray(d.schedules) ? d.schedules : []
    };
    init();
  }

  /* -------------------------
     UTIL: Escape HTML simple
  --------------------------*/
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function loadDataAndInit() {
    if (window.__SAMPLE_DATA) {
      console.log('Usando window.__SAMPLE_DATA (script inline)');
      initWithData(window.__SAMPLE_DATA);
      return;
    }

    // Espera que el DOM esté listo (en la mayoría de setups el script ya se carga defer, pero esto asegura).
    document.addEventListener('DOMContentLoaded', () => {
      fetch('sample_data.json', { cache: 'no-store' })
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok: ' + response.status);
          return response.json();
        })
        .then(data => {
          console.log('📌 Datos cargados:', data);
          initWithData(data);
        })
        .catch(err => {
          console.error('Error cargando JSON:', err);
          // inicializa con estructuras vacías para evitar bloquear la app
          initWithData({ companies: [], vehicles: [], routes: [], schedules: [] });
          // opcional: mostrar mensaje al usuario
          // toast('No se cargaron los datos. Compruebe la ruta data/sample_data.json');
        });
    });
  }

  // arrancar
  loadDataAndInit();
})();