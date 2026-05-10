// ── Configuración ────────────────────────────────────────────────────────
const API_BASE = 'http://54.165.48.162:8080';
import { enviarMensaje, escucharMensajesRecibidos, escucharMensajesEnviados, marcarLeido, escucharNoLeidos } from './firebase.js';
import { setupMensajes } from './mensajeria.js';

// ── Estado global ────────────────────────────────────────────────────────
let state = {
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  currentView: 'login',
  currentPage: 'dashboard',
  mensajeSeleccionado: null,
  _unsubMensajes: null,
  _unsubBadge: null
};

// ── Chart helpers ─────────────────────────────────────────────────────────
const _charts = {};
function destroyChart(id) { if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; } }

function crearDonutAsistencia(canvasId, pct) {
  destroyChart(canvasId);
  const el = document.getElementById(canvasId);
  if (!el) return;
  const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  _charts[canvasId] = new Chart(el, {
    type: 'doughnut',
    data: { datasets: [{ data: [pct, 100 - pct],
      backgroundColor: [color, 'rgba(255,255,255,0.05)'],
      borderWidth: 0, hoverOffset: 0 }] },
    options: { cutout: '78%', responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 1200, easing: 'easeOutQuart' } }
  });
}

function crearBarrasNotas(canvasId, notas) {
  destroyChart(canvasId);
  const el = document.getElementById(canvasId);
  if (!el) return;
  const grupos = {};
  notas.forEach(n => {
    const k = n.asignaturaNombre || n.asignaturaId || 'Sin asignatura';
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(n.nota);
  });
  const labels = Object.keys(grupos);
  const data = labels.map(k => +(grupos[k].reduce((a,b)=>a+b,0)/grupos[k].length).toFixed(1));
  _charts[canvasId] = new Chart(el, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Promedio', data,
      backgroundColor: data.map(v => v >= 4 ? 'rgba(16,185,129,0.75)' : 'rgba(239,68,68,0.75)'),
      borderRadius: 8, borderWidth: 0 }] },
    options: { responsive: true,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` Nota: ${ctx.raw}` } } },
      scales: {
        y: { min: 1, max: 7, grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } },
        x: { grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 }, maxRotation: 30 } }
      }, animation: { duration: 1000, easing: 'easeOutQuart' } }
  });
}

function crearBarrasAsistencia(canvasId, registros) {
  destroyChart(canvasId);
  const el = document.getElementById(canvasId);
  if (!el) return;
  const counts = { PRESENTE: 0, AUSENTE: 0, TARDANZA: 0, JUSTIFICADO: 0 };
  registros.forEach(r => { if (counts[r.estado] !== undefined) counts[r.estado]++; });
  _charts[canvasId] = new Chart(el, {
    type: 'bar',
    data: { labels: ['Presente','Ausente','Tardanza','Justificado'],
      datasets: [{ data: [counts.PRESENTE, counts.AUSENTE, counts.TARDANZA, counts.JUSTIFICADO],
        backgroundColor: ['rgba(16,185,129,0.75)','rgba(239,68,68,0.75)',
          'rgba(245,158,11,0.75)','rgba(124,58,237,0.75)'],
        borderRadius: 8, borderWidth: 0 }] },
    options: { responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
      }, animation: { duration: 1000 } }
  });
}

// ── Utilidades HTTP ──────────────────────────────────────────────────────

async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`[API] ${options.method || 'GET'} ${endpoint} → ${res.status}`, data);
    throw { status: res.status, data };
  }
  return data;
}

// ── Toast Notifications ──────────────────────────────────────────────────

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Router simple ────────────────────────────────────────────────────────

function navigate() {
  const app = document.getElementById('app');
  if (state.token && state.user) {
    renderDashboard(app);
  } else {
    if (state.currentView === 'register') {
      renderRegister(app);
    } else {
      renderLogin(app);
    }
  }
}

function navigateTo(page) {
  state.currentPage = page;
  const content = document.getElementById('page-content');
  if (content) {
    renderPageContent(content);
    updateActiveLink();
  }
}
window.navigateTo = navigateTo;

function updateActiveLink() {
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === state.currentPage);
  });
}

// ── Init mensajeria module ───────────────────────────────────────────────
const _msg = setupMensajes(state, api, showToast, navigateTo);
const renderMensajes = _msg.renderMensajes;
const renderNuevoMensaje = _msg.renderNuevoMensaje;
const renderVerMensaje = _msg.renderVerMensaje;

// ── Página de Login ──────────────────────────────────────────────────────

function renderLogin(container) {
  container.innerHTML = `
    <div class="login-page">
      <video class="login-video" autoplay muted loop playsinline>
        <source src="/assets/fondo-login.mp4" type="video/mp4">
      </video>

      <!-- Overlay oscuro base -->
      <div class="login-page__overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.4);z-index:1;pointer-events:none"></div>

      <!-- Pantalla de bienvenida -->
      <div class="splash-screen" id="splash-screen">
        <div class="splash-eyebrow">Colegio</div>
        <div class="splash-title">Bernardo O'Higgins</div>
        <div class="splash-subtitle">Formamos hoy, líderes del mañana</div>
        <button class="splash-btn" id="btn-bienvenida">Bienvenidos &nbsp;→</button>
      </div>

      <!-- Formulario de login (oculto inicialmente) -->
      <div class="login-card" id="login-card">
        <div class="login-card__logo">
          <img src="/assets/logo.png" alt="Logo Colegio" style="width:72px;height:72px;object-fit:contain;margin-bottom:0.75rem">
          <h1>Iniciar Sesión</h1>
          <p>Colegio Bernardo O'Higgins</p>
        </div>
        <div id="login-alert"></div>
        <form id="login-form">
          <div class="form-group">
            <label for="rut">RUT</label>
            <input type="text" id="rut" placeholder="Ej: 11111111-1" required autocomplete="username" />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" placeholder="Ingrese su contraseña" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary" id="btn-login" style="margin-bottom: 1rem;">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  `;

  // Animación: click en bienvenida → oculta splash → muestra login
  document.getElementById('btn-bienvenida').addEventListener('click', () => {
    const splash = document.getElementById('splash-screen');
    const card   = document.getElementById('login-card');

    // Oculta splash con animación
    splash.classList.add('hiding');

    // Tras terminar, muestra el login deslizando desde abajo
    setTimeout(() => {
      splash.style.display = 'none';
      card.classList.add('visible');
    }, 750);
  });

  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const alertBox = document.getElementById('login-alert');
  const btn = document.getElementById('btn-login');

  const rut = document.getElementById('rut').value.trim();
  const password = document.getElementById('password').value;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ rut, password }),
    });

    state.token = data.token;
    state.refreshToken = data.refreshToken;
    state.user = {
      id: data.id, rut: data.rut, nombre: data.nombre,
      apellido: data.apellido, email: data.email, rol: data.rol,
    };
    localStorage.setItem('token', state.token);
    localStorage.setItem('refreshToken', state.refreshToken);
    localStorage.setItem('user', JSON.stringify(state.user));

    state.currentPage = 'dashboard';
    showToast(`¡Bienvenido, ${state.user.nombre}!`, 'success');
    navigate();
  } catch (err) {
    const msg = err?.data?.error || 'Credenciales incorrectas';
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
    btn.disabled = false;
    btn.textContent = 'Iniciar Sesión';
  }
}

// ── Página de Registro ───────────────────────────────────────────────────

function renderRegister(container) {
  container.innerHTML = `
    <div class="login-page">
      <video class="login-video" autoplay muted loop playsinline>
        <source src="/assets/fondo-login.mp4" type="video/mp4">
      </video>
      <div class="login-card" style="max-width: 500px;">
        <div class="login-card__logo">
          <h1>🏫 Registro</h1>
          <p>Crea tu cuenta en el sistema</p>
        </div>
        <div id="register-alert"></div>
        <form id="register-form">
          <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem;">
            <div class="form-group" style="margin-bottom: 0; flex: 1;">
              <label for="reg-nombre">Nombre</label>
              <input type="text" id="reg-nombre" required />
            </div>
            <div class="form-group" style="margin-bottom: 0; flex: 1;">
              <label for="reg-apellido">Apellido</label>
              <input type="text" id="reg-apellido" required />
            </div>
          </div>
          <div class="form-group">
            <label for="reg-rut">RUT</label>
            <input type="text" id="reg-rut" placeholder="Ej: 11111111-1" required />
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" placeholder="correo@ejemplo.com" required />
          </div>
          <div class="form-group">
            <label for="reg-rol">Rol</label>
            <select id="reg-rol" required style="width:100%; padding:0.75rem 1rem; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; color:var(--text); font-family:var(--font); outline:none; margin-bottom:1.25rem;">
              <option value="DOCENTE">Docente</option>
              <option value="APODERADO">Apoderado</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reg-password">Contraseña</label>
            <input type="password" id="reg-password" required />
          </div>
          <button type="submit" class="btn btn-primary" id="btn-register" style="margin-bottom: 1rem;">Registrarse</button>
          <div style="text-align: center; font-size: 0.875rem;">
            <a href="#" id="link-login" style="color: var(--primary-light); text-decoration: none;">¿Ya tienes cuenta? Inicia sesión</a>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('link-login').addEventListener('click', (e) => {
    e.preventDefault();
    state.currentView = 'login';
    navigate();
  });
}

async function handleRegister(e) {
  e.preventDefault();
  const alertBox = document.getElementById('register-alert');
  const btn = document.getElementById('btn-register');

  const payload = {
    nombre: document.getElementById('reg-nombre').value.trim(),
    apellido: document.getElementById('reg-apellido').value.trim(),
    rut: document.getElementById('reg-rut').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    rol: document.getElementById('reg-rol').value,
    password: document.getElementById('reg-password').value,
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    state.token = data.token;
    state.refreshToken = data.refreshToken;
    state.user = {
      id: data.id, rut: data.rut, nombre: data.nombre,
      apellido: data.apellido, email: data.email, rol: data.rol,
    };
    localStorage.setItem('token', state.token);
    localStorage.setItem('refreshToken', state.refreshToken);
    localStorage.setItem('user', JSON.stringify(state.user));

    showToast('¡Cuenta creada exitosamente!', 'success');
    state.currentView = 'login';
    navigate();
  } catch (err) {
    let msg = 'Error al registrar';
    if (err?.data?.errores) {
       msg = Object.values(err.data.errores).join('<br>');
    } else if (err?.data?.error) {
       msg = err.data.error;
    }
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
    btn.disabled = false;
    btn.textContent = 'Registrarse';
  }
}

// ── Dashboard (Layout principal) ─────────────────────────────────────────

function renderDashboard(container) {
  const { nombre, apellido, rol } = state.user;
  const initials = `${nombre[0]}${apellido[0]}`.toUpperCase();

  // Estudiante tiene layout tipo campus virtual
  if (rol === 'ESTUDIANTE') {
    container.innerHTML = `
      <div class="dashboard">
        ${renderSidebarEstudiante(nombre, apellido, initials)}
        <div class="main-content">
          <nav class="topbar">
            <h1 class="topbar__title" id="page-title">Actividad</h1>
            <div class="topbar__user">
              <span class="topbar__badge">ESTUDIANTE</span>
              <button class="btn-logout" id="btn-logout">Cerrar Sesión</button>
            </div>
          </nav>
          <div class="dashboard__content" id="page-content"></div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="dashboard">
        ${renderSidebar(rol, nombre, apellido, initials)}
        <div class="main-content">
          <nav class="topbar">
            <h1 class="topbar__title" id="page-title">Dashboard</h1>
            <div class="topbar__user">
              <span class="topbar__badge">${rol}</span>
              <button class="btn-logout" id="btn-logout">Cerrar Sesión</button>
            </div>
          </nav>
          <div class="dashboard__content" id="page-content"></div>
        </div>
      </div>
    `;
  }

  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', () => navigateTo(link.dataset.page));
  });

  renderPageContent(document.getElementById('page-content'));
  updateActiveLink();
  // Badge dinámico de mensajes no leídos
  if (state._unsubBadge) state._unsubBadge();
  if (state.user) {
    state._unsubBadge = escucharNoLeidos(state.user.rut, (count) => {
      const badges = document.querySelectorAll('.lms-badge, .msg-badge');
      badges.forEach(b => { b.textContent = count; b.style.display = count > 0 ? 'flex' : 'none'; });
    });
  }
}

// ── Sidebar (roles generales) ─────────────────────────────────────────────

function renderSidebar(rol, nombre, apellido, initials) {
  const menuItems = getMenuItems(rol);
  return `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <img src="/assets/logo.png" alt="Logo" style="width:42px;height:42px;object-fit:contain;border-radius:6px">
          <div>
            <h2 style="font-size:0.875rem;font-weight:800;color:#1F3A5F;letter-spacing:-0.02em;line-height:1.2">Colegio Bernardo O'Higgins</h2>
            <p style="font-size:0.625rem;color:#6B7280;font-family:var(--font-mono);margin-top:2px">Sistema de Gestión</p>
          </div>
        </div>
      </div>
      <nav class="sidebar__nav">
        <div class="sidebar__section-label">Principal</div>
        <a class="sidebar__link" data-page="dashboard">
          <span class="sidebar__link-icon">📊</span> Dashboard
        </a>
        <a class="sidebar__link" data-page="perfil">
          <span class="sidebar__link-icon">👤</span> Mi Perfil
        </a>
        ${menuItems}
      </nav>
      <div class="sidebar__footer">
        <div class="sidebar__user-info">
          <div class="sidebar__avatar">${initials}</div>
          <div class="sidebar__user-details">
            <div class="sidebar__user-name">${nombre} ${apellido}</div>
            <div class="sidebar__user-role">${rol}</div>
          </div>
        </div>
        <button class="btn btn-secondary" id="btn-logout-sidebar" style="width:100%; font-size:0.8125rem; padding:0.5rem;">
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  `;
}

// ── Sidebar ESTUDIANTE — estilo campus virtual ────────────────────────────

function renderSidebarEstudiante(nombre, apellido, initials) {
  return `
    <aside class="sidebar lms-sidebar">
      <div class="lms-sidebar__header">
        <div class="lms-sidebar__logo">
          <img src="/assets/logo.png" alt="Logo" style="width:38px;height:38px;object-fit:contain;border-radius:6px">
          <div>
            <div style="font-size:0.8rem;font-weight:800;color:var(--text);letter-spacing:-0.02em">Campus Virtual</div>
            <div style="font-size:0.6rem;color:var(--text-dim);font-family:var(--font-mono)">Colegio B. O'Higgins</div>
          </div>
        </div>
        <div class="lms-sidebar__profile">
          <div class="lms-sidebar__avatar">${initials}</div>
          <div class="lms-sidebar__profile-info">
            <div class="lms-sidebar__profile-name">${nombre} ${apellido}</div>
            <div class="lms-sidebar__profile-role">Estudiante</div>
          </div>
        </div>
      </div>

      <nav class="sidebar__nav" style="padding:0.5rem 0.625rem;">
        <a class="sidebar__link lms-link" data-page="dashboard">
          <span class="lms-link__icon">🏠</span>
          <span class="lms-link__label">Actividad</span>
        </a>
        <a class="sidebar__link lms-link" data-page="mis-cursos">
          <span class="lms-link__icon">📖</span>
          <span class="lms-link__label">Cursos</span>
        </a>
        <a class="sidebar__link lms-link" data-page="calendario">
          <span class="lms-link__icon">📅</span>
          <span class="lms-link__label">Calendario</span>
        </a>
        <a class="sidebar__link lms-link" data-page="mensajes">
          <span class="lms-link__icon">✉️</span>
          <span class="lms-link__label">Mensajes</span>
          <span class="lms-badge">3</span>
        </a>
        <a class="sidebar__link lms-link" data-page="mis-notas">
          <span class="lms-link__icon">📝</span>
          <span class="lms-link__label">Calificaciones</span>
        </a>
        <a class="sidebar__link lms-link" data-page="mi-asistencia">
          <span class="lms-link__icon">📋</span>
          <span class="lms-link__label">Asistencia</span>
        </a>
        <a class="sidebar__link lms-link" data-page="herramientas">
          <span class="lms-link__icon">🔧</span>
          <span class="lms-link__label">Herramientas</span>
        </a>
      </nav>

      <div class="sidebar__footer">
        <button class="lms-logout-btn" id="btn-logout-sidebar">
          <span style="font-size:1rem">⏻</span> Cerrar sesión
        </button>
        <div style="font-size:0.6rem;color:var(--text-dim);text-align:center;margin-top:0.75rem;font-family:var(--font-mono)">
          Privacidad · Condiciones · Accesibilidad
        </div>
      </div>
    </aside>
  `;
}

function getMenuItems(rol) {
  let items = '';

  if (rol === 'ADMIN') {
    items += `
      <div class="sidebar__section-label">Administración</div>
      <a class="sidebar__link" data-page="usuarios">
        <span class="sidebar__link-icon">👥</span> Gestión de Usuarios
      </a>
      <a class="sidebar__link" data-page="profesores">
        <span class="sidebar__link-icon">👨‍🏫</span> Gestión de Profesores
      </a>
      <a class="sidebar__link" data-page="asignaturas-admin">
        <span class="sidebar__link-icon">📚</span> Asignaturas
      </a>
    `;
  }

  if (rol === 'APODERADO') {
    items += `
      <div class="sidebar__section-label">Familia</div>
      <a class="sidebar__link" data-page="hijos">
        <span class="sidebar__link-icon">🎓</span> Mis Estudiantes
      </a>
      <a class="sidebar__link" data-page="matricular">
        <span class="sidebar__link-icon">➕</span> Matricular Estudiante
      </a>
    `;
  }

  if (rol === 'DOCENTE') {
    items += `
      <div class="sidebar__section-label">Docencia</div>
      <a class="sidebar__link" data-page="calificaciones">
        <span class="sidebar__link-icon">📝</span> Calificaciones
      </a>
      <a class="sidebar__link" data-page="asistencia">
        <span class="sidebar__link-icon">📋</span> Asistencia
      </a>
      <a class="sidebar__link" data-page="mensajes">
        <span class="sidebar__link-icon">✉️</span> Mensajes <span class="msg-badge" style="margin-left:auto;min-width:20px;height:20px;border-radius:10px;background:var(--accent);color:white;font-size:0.625rem;font-weight:800;font-family:var(--font-mono);display:none;align-items:center;justify-content:center;padding:0 5px">0</span>
      </a>
    `;
  }

  items += `
    <div class="sidebar__section-label">Cuenta</div>
    <a class="sidebar__link" data-page="cambiar-password">
      <span class="sidebar__link-icon">🔒</span> Cambiar Contraseña
    </a>
  `;

  return items;
}

// ── Page Router ──────────────────────────────────────────────────────────

function renderPageContent(container) {
  const titleEl = document.getElementById('page-title');
  const titles = {
    'dashboard':        'Actividad',
    'perfil':           'Mi Perfil',
    'usuarios':         'Gestión de Usuarios',
    'profesores':       'Gestión de Profesores',
    'asignaturas-admin':'Asignaturas',
    'hijos':            'Mis Estudiantes',
    'matricular':       'Matricular Estudiante',
    'calificaciones':   'Calificaciones',
    'asistencia':       'Asistencia',
    'mis-notas':        'Calificaciones',
    'mi-asistencia':    'Asistencia',
    'mis-cursos':       'Mis Cursos',
    'mensajes':         'Mensajes',
    'nuevo-mensaje':    'Nuevo Mensaje',
    'ver-mensaje':      'Ver Mensaje',
    'calendario':       'Calendario',
    'herramientas':     'Herramientas',
    'cambiar-password': 'Cambiar Contraseña',
  };

  if (titleEl) titleEl.textContent = titles[state.currentPage] || 'Actividad';

  setTimeout(() => {
    const sidebarLogout = document.getElementById('btn-logout-sidebar');
    if (sidebarLogout) sidebarLogout.addEventListener('click', handleLogout);
  }, 0);

  switch (state.currentPage) {
    case 'dashboard':        return renderDashboardHome(container);
    case 'perfil':           return renderProfile(container);
    case 'usuarios':         return renderUsuariosPage(container);
    case 'profesores':       return renderProfesoresPage(container);
    case 'asignaturas-admin':return renderAsignaturasAdmin(container);
    case 'hijos':            return renderHijosPage(container);
    case 'matricular':       return renderMatricularPage(container);
    case 'calificaciones':   return renderCalificacionesDocente(container);
    case 'asistencia':       return renderAsistenciaDocente(container);
    case 'mis-notas':        return renderMisNotas(container);
    case 'mi-asistencia':    return renderMiAsistencia(container);
    case 'mis-cursos':       return renderMisCursos(container);
    case 'mensajes':         return renderMensajes(container);
    case 'nuevo-mensaje':    return renderNuevoMensaje(container);
    case 'ver-mensaje':      return renderVerMensaje(container);
    case 'calendario':       return renderCalendario(container);
    case 'herramientas':     return renderHerramientas(container);
    case 'cambiar-password': return renderCambiarPassword(container);
    default:                 return renderDashboardHome(container);
  }
}

// ── Dashboard Home ───────────────────────────────────────────────────────

async function renderDashboardHome(container) {
  const { nombre, rol, rut } = state.user;
  container.innerHTML = `
    <section class="welcome-section">
      <h2>Hola, ${nombre} 👋</h2>
      <p>Panel de gestión — ${rol}</p>
    </section>
    <div id="dashboard-body"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando datos...</div></div>
  `;

  const body = document.getElementById('dashboard-body');

  try {
    if (rol === 'ESTUDIANTE') {
      const [notas, asistencia] = await Promise.allSettled([
        api(`/calificaciones/estudiante/${rut}`),
        api(`/asistencia/estudiante/${rut}`)
      ]);
      const n = notas.status === 'fulfilled' ? notas.value : [];
      const a = asistencia.status === 'fulfilled' ? asistencia.value : [];
      const prom = n.length ? +(n.reduce((s,x)=>s+x.nota,0)/n.length).toFixed(1) : 0;
      const total = a.length;
      const presentes = a.filter(x=>x.estado==='PRESENTE').length;
      const pctAsist = total ? +((presentes/total)*100).toFixed(1) : 0;
      const colorProm = prom >= 4 ? 'var(--success)' : 'var(--error)';
      const colorAsist = pctAsist >= 75 ? 'var(--success)' : pctAsist >= 60 ? 'var(--warning)' : 'var(--error)';
      body.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-card__label">Promedio General</div>
            <div class="stat-card__value" style="color:${colorProm}">${prom || '—'}</div></div>
          <div class="stat-card"><div class="stat-card__label">Evaluaciones</div>
            <div class="stat-card__value">${n.length}</div></div>
          <div class="stat-card"><div class="stat-card__label">% Asistencia</div>
            <div class="stat-card__value" style="color:${colorAsist}">${pctAsist}%</div></div>
          <div class="stat-card"><div class="stat-card__label">Clases Registradas</div>
            <div class="stat-card__value">${total}</div></div>
        </div>
        <div class="charts-row">
          <div class="chart-wrap">
            <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">Asistencia</div>
            <div class="donut-wrap">
              <canvas id="ch-asist" height="220"></canvas>
              <div class="chart-label-center">
                <div class="pct" style="color:${colorAsist}">${pctAsist}%</div>
                <div class="sub">asistencia</div>
              </div>
            </div>
          </div>
          <div class="chart-wrap">
            <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">Notas por Asignatura</div>
            <canvas id="ch-notas" height="220"></canvas>
          </div>
        </div>`;
      setTimeout(() => { crearDonutAsistencia('ch-asist', pctAsist); crearBarrasNotas('ch-notas', n); }, 100);

    } else if (rol === 'DOCENTE') {
      const [notas, asistencia, asignaturas] = await Promise.allSettled([
        api('/calificaciones/mis-registros'),
        api('/asistencia/mis-registros'),
        api('/asignaturas')
      ]);
      const n = notas.status === 'fulfilled' ? notas.value : [];
      const a = asistencia.status === 'fulfilled' ? asistencia.value : [];
      const asigs = asignaturas.status === 'fulfilled' ? asignaturas.value : [];
      const estudiantesU = new Set(n.map(x=>x.estudianteId)).size;
      const promGeneral = n.length ? +(n.reduce((s,x)=>s+x.nota,0)/n.length).toFixed(1) : 0;
      const totalAsist = a.length;
      const presentes = a.filter(x=>x.estado==='PRESENTE').length;
      const pctAsist = totalAsist ? +((presentes/totalAsist)*100).toFixed(0) : 0;
      const hoy = new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'});

      // Últimas 5 calificaciones
      const ultimas = [...n].sort((a,b)=>(b.fechaRegistro||'').localeCompare(a.fechaRegistro||'')).slice(0,5);

      body.innerHTML = `
        <!-- Header con saludo -->
        <div style="margin-bottom:2rem;animation:stagger 0.5s ease-out both">
          <div style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:0.5rem">📅 ${hoy}</div>
          <h2 style="font-size:1.75rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.25rem;color:#111827">Panel Docente</h2>
          <p style="color:var(--text-muted);font-size:0.8125rem">Resumen de tu actividad académica</p>
        </div>

        <!-- Stats Cards Premium -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:2rem">
          <div class="stat-card" style="background:#FFFFFF;border:1px solid #E5E7EB;animation:stagger 0.5s ease-out both;animation-delay:0.1s">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
              <div style="width:40px;height:40px;border-radius:10px;background:#EBF2FF;display:flex;align-items:center;justify-content:center;font-size:1.25rem" class="tool-card__icon">📝</div>
              <div class="stat-card__label" style="margin:0;color:#6B7280">Calificaciones</div>
            </div>
            <div class="stat-card__value" style="color:#1F3A5F;font-size:2rem">${n.length}</div>
            <div style="font-size:0.6875rem;color:#9ca3af;font-family:var(--font-mono);margin-top:0.25rem">registradas</div>
          </div>

          <div class="stat-card" style="background:#FFFFFF;border:1px solid #E5E7EB;animation:stagger 0.5s ease-out both;animation-delay:0.2s">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
              <div style="width:40px;height:40px;border-radius:10px;background:#F5F7FA;display:flex;align-items:center;justify-content:center;font-size:1.25rem" class="tool-card__icon">🎓</div>
              <div class="stat-card__label" style="margin:0;color:#6B7280">Estudiantes</div>
            </div>
            <div class="stat-card__value" style="color:#1F3A5F;font-size:2rem">${estudiantesU}</div>
            <div style="font-size:0.6875rem;color:#9ca3af;font-family:var(--font-mono);margin-top:0.25rem">evaluados</div>
          </div>

          <div class="stat-card" style="background:#FFFFFF;border:1px solid #E5E7EB;animation:stagger 0.5s ease-out both;animation-delay:0.3s">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
              <div style="width:40px;height:40px;border-radius:10px;background:${promGeneral >= 4 ? '#DCFCE7' : '#FEE2E2'};display:flex;align-items:center;justify-content:center;font-size:1.25rem" class="tool-card__icon">📊</div>
              <div class="stat-card__label" style="margin:0;color:#6B7280">Promedio</div>
            </div>
            <div class="stat-card__value" style="color:${promGeneral >= 4 ? '#16A34A' : '#DC2626'};font-size:2rem">${promGeneral || '—'}</div>
            <div style="font-size:0.6875rem;color:#9ca3af;font-family:var(--font-mono);margin-top:0.25rem">general notas</div>
          </div>

          <div class="stat-card" style="background:#FFFFFF;border:1px solid #E5E7EB;animation:stagger 0.5s ease-out both;animation-delay:0.4s">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
              <div style="width:40px;height:40px;border-radius:10px;background:#EBF2FF;display:flex;align-items:center;justify-content:center;font-size:1.25rem" class="tool-card__icon">📋</div>
              <div class="stat-card__label" style="margin:0;color:#6B7280">Asistencia</div>
            </div>
            <div class="stat-card__value" style="color:#1F3A5F;font-size:2rem">${totalAsist}</div>
            <div style="font-size:0.6875rem;color:#9ca3af;font-family:var(--font-mono);margin-top:0.25rem">${pctAsist}% presentes</div>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div style="margin-bottom:2rem;animation:stagger 0.5s ease-out both;animation-delay:0.5s">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">⚡ Acciones Rápidas</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem">
            <div class="tool-card" data-page="calificaciones" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;cursor:pointer;transition:var(--transition-slow);display:flex;align-items:center;gap:0.75rem">
              <div class="tool-card__icon" style="width:36px;height:36px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;transition:transform 0.3s">📝</div>
              <div>
                <div style="font-weight:600;font-size:0.8125rem;color:var(--text)">Registrar Nota</div>
                <div style="font-size:0.6875rem;color:var(--text-dim)">Calificaciones</div>
              </div>
            </div>
            <div class="tool-card" data-page="asistencia" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;cursor:pointer;transition:var(--transition-slow);display:flex;align-items:center;gap:0.75rem">
              <div class="tool-card__icon" style="width:36px;height:36px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;transition:transform 0.3s">📋</div>
              <div>
                <div style="font-weight:600;font-size:0.8125rem;color:var(--text)">Pasar Lista</div>
                <div style="font-size:0.6875rem;color:var(--text-dim)">Asistencia</div>
              </div>
            </div>
            <div class="tool-card" data-page="mensajes" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;cursor:pointer;transition:var(--transition-slow);display:flex;align-items:center;gap:0.75rem">
              <div class="tool-card__icon" style="width:36px;height:36px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;transition:transform 0.3s">✉️</div>
              <div>
                <div style="font-weight:600;font-size:0.8125rem;color:var(--text)">Mensajes</div>
                <div style="font-size:0.6875rem;color:var(--text-dim)">Comunicaciones</div>
              </div>
            </div>
            <div class="tool-card" data-page="perfil" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;cursor:pointer;transition:var(--transition-slow);display:flex;align-items:center;gap:0.75rem">
              <div class="tool-card__icon" style="width:36px;height:36px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;transition:transform 0.3s">👤</div>
              <div>
                <div style="font-weight:600;font-size:0.8125rem;color:var(--text)">Mi Perfil</div>
                <div style="font-size:0.6875rem;color:var(--text-dim)">Datos personales</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="charts-row" style="animation:stagger 0.5s ease-out both;animation-delay:0.6s">
          <div class="chart-wrap">
            <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">📈 Notas Registradas por Asignatura</div>
            <canvas id="ch-notas" height="240"></canvas>
          </div>
          <div class="chart-wrap">
            <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">📊 Distribución de Asistencia</div>
            <canvas id="ch-asist" height="240"></canvas>
          </div>
        </div>

        <!-- Últimas calificaciones -->
        ${ultimas.length ? `
        <div style="margin-top:2rem;animation:stagger 0.5s ease-out both;animation-delay:0.7s">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">🕐 Últimas Calificaciones Registradas</div>
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
            ${ultimas.map((c, i) => `
              <div style="display:flex;align-items:center;gap:1rem;padding:0.875rem 1.25rem;border-bottom:1px solid #f1f5f9;animation:stagger 0.3s ease-out both;animation-delay:${0.8 + i*0.05}s">
                <div style="width:36px;height:36px;border-radius:10px;background:${c.nota >= 4 ? '#ecfdf5' : '#fef2f2'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.875rem;color:${c.nota >= 4 ? '#059669' : '#dc2626'};font-family:var(--font-mono);flex-shrink:0">${c.nota}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:0.8125rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.estudianteNombre || c.estudianteId}</div>
                  <div style="font-size:0.6875rem;color:var(--text-dim)">${c.asignaturaNombre || c.asignaturaId}</div>
                </div>
                <div style="font-size:0.6875rem;color:var(--text-dim);font-family:var(--font-mono)">${c.fecha || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Asignaturas activas -->
        ${asigs.filter(a=>a.activa).length ? `
        <div style="margin-top:2rem;animation:stagger 0.5s ease-out both;animation-delay:0.9s">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">📚 Asignaturas Activas</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
            ${asigs.filter(a=>a.activa).map((a,i) => {
              const colors = ['#1F3A5F','#2563EB','#16A34A','#4A90E2','#374151','#1d4ed8','#6B7280'];
              const c = colors[i % colors.length];
              return `<span style="font-size:0.75rem;font-family:var(--font-mono);padding:0.375rem 0.875rem;border-radius:20px;background:${c}18;color:${c};border:1px solid ${c}30;animation:stagger 0.3s ease-out both;animation-delay:${1 + i*0.05}s">${a.nombre}</span>`;
            }).join('')}
          </div>
        </div>
        ` : ''}
      `;

      // Bind quick actions
      body.querySelectorAll('.tool-card[data-page]').forEach(card => {
        card.addEventListener('click', () => navigateTo(card.dataset.page));
      });

      setTimeout(() => { crearBarrasNotas('ch-notas', n); crearBarrasAsistencia('ch-asist', a); }, 100);

    } else if (rol === 'APODERADO') {
      const hijos = await api('/usuarios/mis-hijos');
      body.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-card__label">Estudiantes a Cargo</div>
            <div class="stat-card__value">${hijos.length}</div></div>
          <div class="stat-card"><div class="stat-card__label">Rol</div>
            <div class="stat-card__value" style="font-size:1rem">APODERADO</div></div>
        </div>
        <div style="margin-top:1rem;font-size:0.8125rem;color:var(--text-muted);font-family:var(--font-mono)">👉 Ve a <strong style="color:var(--accent-light)">Mis Estudiantes</strong> para ver los gráficos de calificaciones y asistencia de cada alumno.</div>`;

    } else if (rol === 'ADMIN') {
      const usuarios = await api('/usuarios');
      const byRol = {};
      usuarios.forEach(u => { byRol[u.rol] = (byRol[u.rol]||0)+1; });
      body.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-card__label">Total Usuarios</div>
            <div class="stat-card__value">${usuarios.length}</div></div>
          ${Object.entries(byRol).map(([r,c])=>`
          <div class="stat-card"><div class="stat-card__label">${r}</div>
            <div class="stat-card__value">${c}</div></div>`).join('')}
        </div>`;
    }
  } catch(e) {
    body.innerHTML = `<div class="alert alert-error">Error al cargar datos del dashboard</div>`;
  }
}

// ── Perfil ───────────────────────────────────────────────────────────────

async function renderProfile(container) {
  container.innerHTML = `<div class="loading-container"><span class="spinner spinner-lg"></span> Cargando perfil...</div>`;

  try {
    const perfil = await api('/auth/me');
    container.innerHTML = `
      <div class="section-card">
        <div class="section-card__header">
          <span class="section-card__header-icon">👤</span>
          <h3>Información Personal</h3>
        </div>
        <div class="profile-grid">
          <div class="profile-field">
            <div class="profile-field__label">Nombre</div>
            <div class="profile-field__value">${perfil.nombre}</div>
          </div>
          <div class="profile-field">
            <div class="profile-field__label">Apellido</div>
            <div class="profile-field__value">${perfil.apellido}</div>
          </div>
          <div class="profile-field">
            <div class="profile-field__label">RUT</div>
            <div class="profile-field__value">${perfil.rut}</div>
          </div>
          <div class="profile-field">
            <div class="profile-field__label">Email</div>
            <div class="profile-field__value">${perfil.email}</div>
          </div>
          <div class="profile-field">
            <div class="profile-field__label">Rol</div>
            <div class="profile-field__value"><span class="topbar__badge">${perfil.rol}</span></div>
          </div>
          <div class="profile-field">
            <div class="profile-field__label">Estado</div>
            <div class="profile-field__value">${perfil.activo ? '✅ Activo' : '❌ Inactivo'}</div>
          </div>
        </div>
      </div>
    `;
  } catch {
    container.innerHTML = `<div class="alert alert-error">Error al cargar el perfil</div>`;
  }
}

// ── Cambiar Contraseña ───────────────────────────────────────────────────

function renderCambiarPassword(container) {
  container.innerHTML = `
    <div class="section-card" style="max-width: 500px;">
      <div class="section-card__header">
        <span class="section-card__header-icon">🔒</span>
        <h3>Cambiar Contraseña</h3>
      </div>
      <div id="password-alert"></div>
      <form id="change-password-form">
        <div class="form-group">
          <label for="current-pw">Contraseña Actual</label>
          <input type="password" id="current-pw" required />
        </div>
        <div class="form-group">
          <label for="new-pw">Nueva Contraseña</label>
          <input type="password" id="new-pw" required minlength="6" />
        </div>
        <div class="form-group">
          <label for="confirm-pw">Confirmar Nueva Contraseña</label>
          <input type="password" id="confirm-pw" required minlength="6" />
        </div>
        <button type="submit" class="btn btn-primary" id="btn-change-pw">Actualizar Contraseña</button>
      </form>
    </div>
  `;

  document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
}

async function handleChangePassword(e) {
  e.preventDefault();
  const alertBox = document.getElementById('password-alert');
  const btn = document.getElementById('btn-change-pw');
  const newPw = document.getElementById('new-pw').value;
  const confirmPw = document.getElementById('confirm-pw').value;

  if (newPw !== confirmPw) {
    alertBox.innerHTML = `<div class="alert alert-error">Las contraseñas no coinciden</div>`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';

  try {
    await api('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({
        passwordActual: document.getElementById('current-pw').value,
        passwordNueva: newPw,
      }),
    });

    showToast('Contraseña actualizada exitosamente', 'success');
    document.getElementById('change-password-form').reset();
    btn.disabled = false;
    btn.textContent = 'Actualizar Contraseña';
  } catch (err) {
    const msg = err?.data?.error || 'Error al cambiar la contraseña';
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
    btn.disabled = false;
    btn.textContent = 'Actualizar Contraseña';
  }
}

// ── Gestión de Usuarios (ADMIN) ──────────────────────────────────────────

async function renderUsuariosPage(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-card__header">
        <span class="section-card__header-icon">👥</span>
        <h3>Usuarios Registrados</h3>
        <button onclick="cargarUsuarios()" class="btn btn-secondary" style="margin-left:auto; font-size:0.8rem; padding:0.4rem 0.9rem;">🔄 Actualizar</button>
      </div>
      <div id="usuarios-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando usuarios...</div></div>
    </div>
  `;
  await cargarUsuarios();
}

window.cargarUsuarios = async function() {
  const list = document.getElementById('usuarios-list');
  if (!list) return;
  list.innerHTML = `<div class="loading-container"><span class="spinner spinner-lg"></span> Cargando...</div>`;
  try {
    const usuarios = await api('/usuarios');
    if (!usuarios.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">👥</div><div class="empty-state__title">Sin usuarios</div><div class="empty-state__text">No hay usuarios registrados.</div></div>`;
      return;
    }
    const roles = ['ADMIN','DOCENTE','ESTUDIANTE','APODERADO'];
    list.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => `
              <tr>
                <td style="font-weight:500;">${u.nombre} ${u.apellido}</td>
                <td style="font-family:var(--font-mono); font-size:0.85rem;">${u.rut}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${u.email}</td>
                <td>
                  <select onchange="cambiarRolUsuario('${u.id}', this.value)"
                    style="background:var(--bg-input); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:0.25rem 0.5rem; font-size:0.8rem; cursor:pointer;">
                    ${roles.map(r => `<option value="${r}" ${u.rol === r ? 'selected' : ''}>${r}</option>`).join('')}
                  </select>
                </td>
                <td>
                  <span class="topbar__badge" style="background:${u.activo !== false ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)'}; color:${u.activo !== false ? 'var(--success)' : 'var(--error)'};">
                    ${u.activo !== false ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                </td>
                <td style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                  ${u.activo !== false
                    ? `<button onclick="toggleUsuario('${u.id}', false)" style="background:rgba(245,158,11,.15); color:var(--warning); border:none; padding:0.3rem 0.6rem; border-radius:6px; cursor:pointer; font-size:0.75rem;">⏸ Desactivar</button>`
                    : `<button onclick="toggleUsuario('${u.id}', true)" style="background:rgba(34,197,94,.15); color:var(--success); border:none; padding:0.3rem 0.6rem; border-radius:6px; cursor:pointer; font-size:0.75rem;">▶ Activar</button>`
                  }
                  <button onclick="eliminarUsuario('${u.id}', '${u.nombre}')" style="background:rgba(239,68,68,.15); color:var(--error); border:none; padding:0.3rem 0.6rem; border-radius:6px; cursor:pointer; font-size:0.75rem;">🗑️ Eliminar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    const status = err?.status ? ` (HTTP ${err.status})` : '';
    list.innerHTML = `<div class="alert alert-error">Error al cargar usuarios${status}</div>`;
  }
};

window.cambiarRolUsuario = async function(id, nuevoRol) {
  try {
    await api(`/usuarios/${id}/rol`, {
      method: 'PATCH',
      body: JSON.stringify({ rol: nuevoRol })
    });
    showToast(`Rol actualizado a ${nuevoRol}`, 'success');
  } catch (err) {
    showToast('Error al cambiar el rol', 'error');
    await cargarUsuarios();
  }
};

window.toggleUsuario = async function(id, activar) {
  const accion = activar ? 'activar' : 'desactivar';
  try {
    if (activar) {
      await api(`/usuarios/${id}/activar`, { method: 'PATCH' });
    } else {
      await api(`/usuarios/${id}`, { method: 'DELETE' });
    }
    showToast(`Usuario ${activar ? 'activado' : 'desactivado'} correctamente`, 'success');
    await cargarUsuarios();
  } catch (err) {
    showToast(`Error al ${accion} el usuario`, 'error');
  }
};

window.eliminarUsuario = async function(id, nombre) {
  if (!confirm(`¿Eliminar permanentemente al usuario ${nombre}? Esta acción no se puede deshacer.`)) return;
  try {
    await api(`/usuarios/${id}`, { method: 'DELETE' });
    showToast('Usuario eliminado', 'info');
    await cargarUsuarios();
  } catch {
    showToast('Error al eliminar el usuario', 'error');
  }
};

// ── Mis Hijos (APODERADO) ────────────────────────────────────────────────

async function renderHijosPage(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-card__header">
        <span class="section-card__header-icon">🎓</span>
        <h3>Estudiantes a mi Cargo</h3>
      </div>
      <div id="hijos-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando estudiantes...</div></div>
    </div>
    <div id="hijos-detalle-container"></div>
  `;

  try {
    const hijos = await api('/usuarios/mis-hijos');
    const list = document.getElementById('hijos-list');
    if (!hijos.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🎓</div><div class="empty-state__title">Sin estudiantes</div><div class="empty-state__text">Aún no tienes estudiantes registrados. Ve a "Matricular Estudiante" para agregar uno.</div></div>`;
      return;
    }
    list.innerHTML = `
      <div style="display:grid; gap:0.75rem;">
        ${hijos.map(h => `
          <div class="hijo-card" data-rut="${h.rut}" data-nombre="${h.nombre} ${h.apellido}"
               style="background:var(--bg-input); padding:1.25rem; border:1px solid var(--border); border-radius:10px; display:flex; align-items:center; gap:1.25rem; cursor:pointer; transition:var(--transition);"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='var(--accent)'"
               onmouseout="this.style.transform='none'; this.style.borderColor='var(--border)'">
            <div style="font-size:2.5rem;">🎓</div>
            <div style="flex:1;">
              <div style="font-weight:600; font-size:1.1rem; color:var(--accent);">${h.nombre} ${h.apellido}</div>
              <div style="font-size:0.8125rem; color:var(--text-muted); margin-top:0.25rem;">RUT: ${h.rut} · Email: ${h.email}</div>
            </div>
            <div style="color:var(--text-dim); font-size:0.75rem;">Ver detalle →</div>
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.hijo-card').forEach(card => {
      card.addEventListener('click', () => {
        const rut = card.dataset.rut;
        const nombre = card.dataset.nombre;
        renderHijoDetalle(rut, nombre);
        document.querySelectorAll('.hijo-card').forEach(c => c.style.borderColor = 'var(--border)');
        card.style.borderColor = 'var(--accent)';
      });
    });
  } catch {
    document.getElementById('hijos-list').innerHTML = `<div class="alert alert-error">Error al cargar estudiantes</div>`;
  }
}

async function renderHijoDetalle(rut, nombre) {
  const container = document.getElementById('hijos-detalle-container');
  container.innerHTML = `
    <div class="section-card" style="margin-top:1.5rem;">
      <div class="section-card__header">
        <span class="section-card__header-icon">🎓</span>
        <h3>${nombre}</h3>
      </div>
      <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border);">
        <button id="tab-btn-notas" onclick="switchHijoTab('notas','${rut}','${nombre}')"
          style="padding:0.6rem 1.25rem; background:var(--accent); color:#fff; border:none; border-radius:8px 8px 0 0; cursor:pointer; font-family:var(--font); font-size:0.875rem; font-weight:600;">
          📝 Calificaciones
        </button>
        <button id="tab-btn-asistencia" onclick="switchHijoTab('asistencia','${rut}','${nombre}')"
          style="padding:0.6rem 1.25rem; background:var(--bg-input); color:var(--text-muted); border:1px solid var(--border); border-bottom:none; border-radius:8px 8px 0 0; cursor:pointer; font-family:var(--font); font-size:0.875rem; font-weight:600;">
          📋 Asistencia
        </button>
      </div>
      <div id="hijo-tab-content"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando...</div></div>
    </div>
  `;
  await cargarNotasHijo(rut, nombre);
}

window.switchHijoTab = function(tab, rut, nombre) {
  const btnNotas      = document.getElementById('tab-btn-notas');
  const btnAsistencia = document.getElementById('tab-btn-asistencia');
  if (!btnNotas) return;
  if (tab === 'notas') {
    Object.assign(btnNotas.style,      { background: 'var(--accent)', color: '#fff', border: 'none' });
    Object.assign(btnAsistencia.style, { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' });
    cargarNotasHijo(rut, nombre);
  } else {
    Object.assign(btnAsistencia.style, { background: 'var(--accent)', color: '#fff', border: 'none' });
    Object.assign(btnNotas.style,      { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' });
    cargarAsistenciaHijo(rut, nombre);
  }
};

async function cargarNotasHijo(rut, nombre) {
  const content = document.getElementById('hijo-tab-content');
  if (!content) return;
  content.innerHTML = `<div class="loading-container"><span class="spinner spinner-lg"></span> Cargando notas...</div>`;

  try {
    const notas = await api(`/calificaciones/estudiante/${rut}`);
    if (!notas.length) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📝</div><div class="empty-state__title">Sin calificaciones</div><div class="empty-state__text">${nombre} aún no tiene calificaciones registradas.</div></div>`;
      return;
    }
    const promedio  = (notas.reduce((sum, n) => sum + n.nota, 0) / notas.length).toFixed(1);
    const colorProm = promedio >= 4.0 ? 'var(--success)' : 'var(--error)';
    content.innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.5rem;">
        <div class="stat-card"><div class="stat-card__label">Promedio</div>
          <div class="stat-card__value" style="color:${colorProm};">${promedio}</div></div>
        <div class="stat-card"><div class="stat-card__label">Evaluaciones</div>
          <div class="stat-card__value">${notas.length}</div></div>
        <div class="stat-card"><div class="stat-card__label">Nota más alta</div>
          <div class="stat-card__value" style="color:var(--success);">${Math.max(...notas.map(n => n.nota)).toFixed(1)}</div></div>
      </div>
      <div class="charts-row" style="margin-bottom:1.5rem;">
        <div class="chart-wrap">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">Promedio por Asignatura</div>
          <canvas id="hijo-notas-barras" height="220"></canvas>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Asignatura</th><th>Nota</th><th>Tipo</th><th>Fecha</th><th>Observación</th></tr></thead>
          <tbody>
            ${notas.map(n => `
              <tr>
                <td style="font-weight:500;">${n.asignaturaNombre || n.asignaturaId}</td>
                <td style="font-weight:700; color:${n.nota >= 4.0 ? 'var(--success)' : 'var(--error)'};">${n.nota.toFixed(1)}</td>
                <td><span class="topbar__badge">${n.tipo}</span></td>
                <td style="color:var(--text-muted);">${n.fecha}</td>
                <td style="color:var(--text-muted); font-size:0.75rem;">${n.observacion || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    setTimeout(() => crearBarrasNotas('hijo-notas-barras', notas), 100);
  } catch (err) {
    const status = err?.status ? ` (HTTP ${err.status})` : '';
    const msg = err?.data?.error || err?.data?.message || 'Error al cargar calificaciones';
    content.innerHTML = `<div class="alert alert-error">${msg}${status}</div>`;
  }
}

async function cargarAsistenciaHijo(rut, nombre) {
  const content = document.getElementById('hijo-tab-content');
  if (!content) return;
  content.innerHTML = `<div class="loading-container"><span class="spinner spinner-lg"></span> Cargando asistencia...</div>`;
  try {
    const registros = await api(`/asistencia/estudiante/${rut}`);
    if (!registros.length) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">Sin registros</div><div class="empty-state__text">${nombre} aún no tiene registros de asistencia.</div></div>`;
      return;
    }
    const total      = registros.length;
    const presentes  = registros.filter(r => r.estado === 'PRESENTE').length;
    const ausentes   = registros.filter(r => r.estado === 'AUSENTE').length;
    const tardanzas  = registros.filter(r => r.estado === 'TARDANZA').length;
    const pct        = +((presentes / total) * 100).toFixed(1);
    const colorAsist = pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)';
    const estadoIcon = { PRESENTE: '✅', AUSENTE: '❌', TARDANZA: '⏰', JUSTIFICADO: '📄' };
    content.innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.5rem;">
        <div class="stat-card"><div class="stat-card__label">% Asistencia</div>
          <div class="stat-card__value" style="color:${colorAsist};">${pct}%</div></div>
        <div class="stat-card"><div class="stat-card__label">Presentes</div>
          <div class="stat-card__value" style="color:var(--success);">${presentes}</div></div>
        <div class="stat-card"><div class="stat-card__label">Ausentes</div>
          <div class="stat-card__value" style="color:var(--error);">${ausentes}</div></div>
        <div class="stat-card"><div class="stat-card__label">Tardanzas</div>
          <div class="stat-card__value">${tardanzas}</div></div>
      </div>
      <div class="charts-row" style="margin-bottom:1.5rem;">
        <div class="chart-wrap" style="display:flex;flex-direction:column;align-items:center;">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem;width:100%">% de Asistencia</div>
          <div class="donut-wrap" style="max-width:200px;width:100%;position:relative;">
            <canvas id="hijo-asist-donut" height="200"></canvas>
            <div class="chart-label-center">
              <div class="pct" style="color:${colorAsist};">${pct}%</div>
              <div class="sub">asistencia</div>
            </div>
          </div>
        </div>
        <div class="chart-wrap">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem;">Desglose por Estado</div>
          <canvas id="hijo-asist-barras" height="200"></canvas>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Asignatura</th><th>Estado</th><th>Fecha</th><th>Observación</th></tr></thead>
          <tbody>
            ${registros.map(r => `
              <tr>
                <td style="font-weight:500;">${r.asignaturaNombre || r.asignaturaId}</td>
                <td>${estadoIcon[r.estado] || ''} <span class="topbar__badge">${r.estado}</span></td>
                <td style="color:var(--text-muted);">${r.fecha}</td>
                <td style="color:var(--text-muted);font-size:.75rem;">${r.observacion || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    setTimeout(() => {
      crearDonutAsistencia('hijo-asist-donut', pct);
      crearBarrasAsistencia('hijo-asist-barras', registros);
    }, 100);
  } catch {
    content.innerHTML = `<div class="alert alert-error">Error al cargar asistencia del estudiante</div>`;
  }
}

// ── Gestión de Profesores (ADMIN) ─────────────────────────────────────────

async function renderProfesoresPage(container) {
  const selectStyle = 'width:100%; padding:0.625rem 0.875rem; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:var(--font); outline:none;';
  container.innerHTML = `
    <div class="section-card" style="max-width:560px;">
      <div class="section-card__header">
        <span class="section-card__header-icon">👨‍🏫</span>
        <h3>Crear Nuevo Profesor</h3>
      </div>
      <div id="prof-alert"></div>
      <form id="prof-form">
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="flex:1;">
            <label for="prof-nombre">Nombre</label>
            <input type="text" id="prof-nombre" placeholder="Nombre" required />
          </div>
          <div class="form-group" style="flex:1;">
            <label for="prof-apellido">Apellido</label>
            <input type="text" id="prof-apellido" placeholder="Apellido" required />
          </div>
        </div>
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="flex:1;">
            <label for="prof-rut">RUT</label>
            <input type="text" id="prof-rut" placeholder="Ej: 12345678-9" required />
          </div>
          <div class="form-group" style="flex:1;">
            <label for="prof-email">Email</label>
            <input type="email" id="prof-email" placeholder="correo@colegio.cl" required />
          </div>
        </div>
        <div class="form-group">
          <label for="prof-password">Contraseña</label>
          <input type="password" id="prof-password" placeholder="Mínimo 6 caracteres" required minlength="6" />
        </div>
        <button type="submit" class="btn btn-primary" id="btn-crear-prof">Crear Profesor</button>
      </form>
    </div>

    <div class="section-card" style="margin-top:1.5rem;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📋</span>
        <h3>Profesores Registrados</h3>
      </div>
      <div id="prof-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando...</div></div>
    </div>
  `;

  document.getElementById('prof-form').addEventListener('submit', handleCrearProfesor);
  await cargarProfesores();
}

async function handleCrearProfesor(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-crear-prof');
  const alertBox = document.getElementById('prof-alert');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';

  try {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nombre:   document.getElementById('prof-nombre').value.trim(),
        apellido: document.getElementById('prof-apellido').value.trim(),
        rut:      document.getElementById('prof-rut').value.trim(),
        email:    document.getElementById('prof-email').value.trim(),
        password: document.getElementById('prof-password').value,
        rol:      'DOCENTE'
      })
    });
    showToast('Profesor creado exitosamente', 'success');
    document.getElementById('prof-form').reset();
    await cargarProfesores();
  } catch (err) {
    const msg = err?.data?.errores
      ? Object.values(err.data.errores).join('<br>')
      : (err?.data?.error || 'Error al crear el profesor');
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Crear Profesor';
  }
}

async function cargarProfesores() {
  const list = document.getElementById('prof-list');
  if (!list) return;
  try {
    const usuarios = await api('/usuarios');
    const profesores = usuarios.filter(u => u.rol === 'DOCENTE');
    if (!profesores.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">👨‍🏫</div><div class="empty-state__title">Sin profesores</div><div class="empty-state__text">No hay profesores registrados aún.</div></div>`;
      return;
    }
    list.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>RUT</th><th>Email</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${profesores.map(p => `
              <tr>
                <td style="font-weight:500;">${p.nombre} ${p.apellido}</td>
                <td style="font-family:var(--font-mono); font-size:0.85rem;">${p.rut}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${p.email}</td>
                <td><span class="topbar__badge" style="background:${p.activo ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)'}; color:${p.activo ? 'var(--success)' : 'var(--error)'};">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button onclick="eliminarProfesor('${p.id}')" style="background:rgba(239,68,68,.15); color:var(--error); border:none; padding:0.35rem 0.75rem; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    const status = err?.status ? ` (HTTP ${err.status})` : '';
    list.innerHTML = `<div class="alert alert-error">Error al cargar profesores${status}</div>`;
  }
}

window.eliminarProfesor = async function(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este profesor?')) return;
  try {
    await api(`/usuarios/${id}`, { method: 'DELETE' });
    showToast('Profesor eliminado', 'info');
    await cargarProfesores();
  } catch (err) {
    showToast('Error al eliminar el profesor', 'error');
  }
};

// ── Asignaturas (ADMIN) ───────────────────────────────────────────────────

async function renderAsignaturasAdmin(container) {
  const selectStyle = 'width:100%; padding:0.625rem 0.875rem; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:var(--font); outline:none;';
  container.innerHTML = `
    <div class="section-card" style="max-width:560px;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📚</span>
        <h3>Agregar Asignatura</h3>
      </div>
      <div id="asig-alert"></div>
      <form id="asig-form">
        <div class="form-group">
          <label for="asig-nombre">Nombre</label>
          <input type="text" id="asig-nombre" placeholder="Ej: Matemática" required />
        </div>
        <div class="form-group">
          <label for="asig-desc">Descripción</label>
          <input type="text" id="asig-desc" placeholder="Descripción breve" />
        </div>
        <button type="submit" class="btn btn-primary" id="btn-crear-asig">Agregar Asignatura</button>
      </form>
    </div>

    <div class="section-card" style="margin-top:1.5rem;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📋</span>
        <h3>Asignaturas del Sistema</h3>
      </div>
      <div id="asig-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando...</div></div>
    </div>
  `;

  document.getElementById('asig-form').addEventListener('submit', handleCrearAsignatura);
  await cargarAsignaturasAdmin();
}

async function handleCrearAsignatura(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-crear-asig');
  const alertBox = document.getElementById('asig-alert');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';
  try {
    await api('/asignaturas', {
      method: 'POST',
      body: JSON.stringify({
        nombre:      document.getElementById('asig-nombre').value.trim(),
        descripcion: document.getElementById('asig-desc').value.trim(),
        docenteId:   null,
        docenteNombre: null
      })
    });
    showToast('Asignatura creada exitosamente', 'success');
    document.getElementById('asig-form').reset();
    await cargarAsignaturasAdmin();
  } catch (err) {
    const msg = err?.data?.error || 'Error al crear la asignatura';
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Agregar Asignatura';
  }
}

async function cargarAsignaturasAdmin() {
  const list = document.getElementById('asig-list');
  if (!list) return;
  try {
    const asignaturas = await api('/asignaturas');
    if (!asignaturas.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📚</div><div class="empty-state__title">Sin asignaturas</div><div class="empty-state__text">No hay asignaturas registradas.</div></div>`;
      return;
    }
    list.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${asignaturas.map(a => `
              <tr>
                <td style="font-weight:600;">${a.nombre}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${a.descripcion || '—'}</td>
                <td><span class="topbar__badge" style="background:${a.activa ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)'}; color:${a.activa ? 'var(--success)' : 'var(--error)'};">${a.activa ? 'Activa' : 'Inactiva'}</span></td>
                <td>
                  <button onclick="eliminarAsignatura('${a.id}')" style="background:rgba(239,68,68,.15); color:var(--error); border:none; padding:0.35rem 0.75rem; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    list.innerHTML = `<div class="alert alert-error">Error al cargar asignaturas</div>`;
  }
}

window.eliminarAsignatura = async function(id) {
  if (!confirm('¿Eliminar esta asignatura?')) return;
  try {
    await api(`/asignaturas/${id}`, { method: 'DELETE' });
    showToast('Asignatura eliminada', 'info');
    await cargarAsignaturasAdmin();
  } catch {
    showToast('Error al eliminar la asignatura', 'error');
  }
};

// ── Matricular Estudiante (APODERADO) ────────────────────────────────────


function renderMatricularPage(container) {
  container.innerHTML = `
    <div class="section-card" style="max-width: 500px;">
      <div class="section-card__header">
        <span class="section-card__header-icon">➕</span>
        <h3>Matricular Nuevo Estudiante</h3>
      </div>
      <div id="add-hijo-alert"></div>
      <form id="add-hijo-form">
        <div class="form-group">
          <label for="h-nombre">Nombre</label>
          <input type="text" id="h-nombre" placeholder="Nombre del estudiante" required />
        </div>
        <div class="form-group">
          <label for="h-apellido">Apellido</label>
          <input type="text" id="h-apellido" placeholder="Apellido del estudiante" required />
        </div>
        <div class="form-group">
          <label for="h-rut">RUT</label>
          <input type="text" id="h-rut" placeholder="Ej: 9999999-9" required />
        </div>
        <div class="form-group">
          <label for="h-email">Email</label>
          <input type="email" id="h-email" placeholder="correo@ejemplo.com" required />
        </div>
        <div class="form-group">
          <label for="h-password">Contraseña Provisoria</label>
          <input type="password" id="h-password" placeholder="Mínimo 6 caracteres" required minlength="6" />
        </div>
        <button type="submit" class="btn btn-primary" id="btn-add-hijo">Matricular Estudiante</button>
      </form>
    </div>
  `;

  document.getElementById('add-hijo-form').addEventListener('submit', handleAddHijo);
}

async function handleAddHijo(e) {
  e.preventDefault();
  const alertBox = document.getElementById('add-hijo-alert');
  const btn = document.getElementById('btn-add-hijo');

  const payload = {
    nombre: document.getElementById('h-nombre').value.trim(),
    apellido: document.getElementById('h-apellido').value.trim(),
    rut: document.getElementById('h-rut').value.trim(),
    email: document.getElementById('h-email').value.trim(),
    rol: 'ESTUDIANTE',
    password: document.getElementById('h-password').value,
    idApoderado: state.user.id
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';

  try {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    showToast('¡Estudiante matriculado exitosamente!', 'success');
    document.getElementById('add-hijo-form').reset();
    btn.disabled = false;
    btn.textContent = 'Matricular Estudiante';
  } catch (err) {
    let msg = 'Error al registrar';
    if (err?.data?.errores) {
       msg = Object.values(err.data.errores).join('<br>');
    } else if (err?.data?.error) {
       msg = err.data.error;
    }
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
    btn.disabled = false;
    btn.textContent = 'Matricular Estudiante';
  }
}

// ── Coming Soon (Placeholder) ────────────────────────────────────────────

function renderComingSoon(container, icon, title, description) {
  container.innerHTML = `
    <div class="section-card">
      <div class="empty-state">
        <div class="empty-state__icon">${icon}</div>
        <div class="empty-state__title">${title}</div>
        <div class="empty-state__text">${description}</div>
        <div style="margin-top:1.5rem;">
          <span class="topbar__badge" style="font-size:0.75rem; padding:0.375rem 1rem;">🚧 Próximamente</span>
        </div>
      </div>
    </div>
  `;
}

// ── Helper: cargar asignaturas en un <select> ────────────────────────────

async function loadAsignaturasIntoSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const asignaturas = await api('/asignaturas');
    select.innerHTML = '<option value="" disabled selected>Selecciona una asignatura</option>';
    asignaturas
      .filter(a => a.activa)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.nombre;
        opt.textContent = a.nombre;
        select.appendChild(opt);
      });
  } catch {
    select.innerHTML = '<option value="" disabled selected>Error al cargar asignaturas</option>';
  }
}

// ── Asistencia — DOCENTE ─────────────────────────────────────────────────

async function renderAsistenciaDocente(container) {
  const today = new Date().toISOString().split('T')[0];
  const selectStyle = 'width:100%; padding:0.625rem 0.875rem; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:var(--font); outline:none;';

  const cursos = [
    '1° Básico','2° Básico','3° Básico','4° Básico',
    '5° Básico','6° Básico','7° Básico','8° Básico',
    '1° Medio','2° Medio','3° Medio','4° Medio'
  ];

  container.innerHTML = `
    <div class="section-card" style="max-width: 620px;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📋</span>
        <h3>Registrar Asistencia</h3>
      </div>
      <div id="asist-alert"></div>
      <form id="asist-form">
        <div class="form-group">
          <label for="asist-curso">Curso</label>
          <select id="asist-curso" style="${selectStyle}">
            <option value="">— Todos los cursos —</option>
            ${cursos.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="asist-estudiante">Estudiante</label>
          <select id="asist-estudiante" required style="${selectStyle}">
            <option value="" disabled selected>Cargando estudiantes...</option>
          </select>
        </div>
        <div class="form-group">
          <label for="asist-asignatura">Asignatura</label>
          <select id="asist-asignatura" required style="${selectStyle}">
            <option value="" disabled selected>Cargando asignaturas...</option>
          </select>
        </div>
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="flex:1;">
            <label for="asist-estado">Estado</label>
            <select id="asist-estado" required style="${selectStyle}">
              <option value="PRESENTE">✅ Presente</option>
              <option value="AUSENTE">❌ Ausente</option>
              <option value="TARDANZA">⏰ Tardanza</option>
              <option value="JUSTIFICADO">📄 Justificado</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label for="asist-fecha">Fecha</label>
            <input type="date" id="asist-fecha" required style="color-scheme: dark;" />
          </div>
        </div>
        <div class="form-group">
          <label for="asist-obs">Observación (opcional)</label>
          <input type="text" id="asist-obs" placeholder="Comentario adicional" />
        </div>
        <button type="submit" class="btn btn-primary" id="btn-asist">Registrar Asistencia</button>
      </form>
    </div>

    <div class="section-card" style="margin-top:1.5rem;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📊</span>
        <h3>Mis Registros de Asistencia</h3>
      </div>
      <div id="asist-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando...</div></div>
    </div>
  `;

  document.getElementById('asist-fecha').value = today;
  document.getElementById('asist-form').addEventListener('submit', handleRegistrarAsistencia);
  await loadAsignaturasIntoSelect('asist-asignatura');

  // Cargar estudiantes
  try {
    const usuarios = await api('/usuarios/destinatarios');
    window._estudiantesLista = usuarios;
    poblarEstudiantes(usuarios);
  } catch {
    const sel = document.getElementById('asist-estudiante');
    sel.innerHTML = '<option value="" disabled selected>Error al cargar estudiantes</option>';
  }

  // Filtrar por curso
  document.getElementById('asist-curso').addEventListener('change', () => {
    const curso = document.getElementById('asist-curso').value;
    if (!window._estudiantesLista) return;
    // Si no hay curso seleccionado mostrar todos
    poblarEstudiantes(window._estudiantesLista);
  });

  cargarAsistenciaDocente();
}

function poblarEstudiantes(estudiantes) {
  const sel = document.getElementById('asist-estudiante');
  if (!sel) return;
  sel.innerHTML = '<option value="" disabled selected>Selecciona un estudiante</option>';
  estudiantes
    .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
    .forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.rut;
      opt.dataset.nombre = `${e.nombre} ${e.apellido}`;
      opt.textContent = `${e.apellido}, ${e.nombre} — ${e.rut}`;
      sel.appendChild(opt);
    });
}

async function handleRegistrarAsistencia(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-asist');
  const alertBox = document.getElementById('asist-alert');
  const selectEl = document.getElementById('asist-asignatura');
  const asignaturaNombre = selectEl.options[selectEl.selectedIndex]?.text || '';
  const asignaturaId     = selectEl.value.trim().toLowerCase().replace(/\s+/g, '-');

  const estSelect = document.getElementById('asist-estudiante');
  const estRut = estSelect.value;
  const estNombre = estSelect.options[estSelect.selectedIndex]?.dataset?.nombre || '';

  const payload = {
    estudianteId:     estRut,
    estudianteNombre: estNombre,
    asignaturaId,
    asignaturaNombre,
    fecha:       document.getElementById('asist-fecha').value,
    estado:      document.getElementById('asist-estado').value,
    observacion: document.getElementById('asist-obs').value.trim(),
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';

  try {
    await api('/asistencia', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Asistencia registrada exitosamente', 'success');
    document.getElementById('asist-form').reset();
    document.getElementById('asist-fecha').value = new Date().toISOString().split('T')[0];
    btn.disabled = false;
    btn.textContent = 'Registrar Asistencia';
    cargarAsistenciaDocente();
  } catch (err) {
    const msg = err?.data?.error || 'Error al registrar asistencia';
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
    btn.disabled = false;
    btn.textContent = 'Registrar Asistencia';
  }
}

async function cargarAsistenciaDocente() {
  const list = document.getElementById('asist-list');
  try {
    const registros = await api('/asistencia/mis-registros');
    if (!registros.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">Sin registros</div><div class="empty-state__text">Aún no has registrado asistencia.</div></div>`;
      return;
    }
    const estadoIcon = { PRESENTE: '✅', AUSENTE: '❌', TARDANZA: '⏰', JUSTIFICADO: '📄' };
    list.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Asignatura</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            ${registros.map(r => `
              <tr>
                <td style="font-weight:500;">${r.estudianteNombre || r.estudianteId}</td>
                <td>${r.asignaturaNombre || r.asignaturaId}</td>
                <td>${estadoIcon[r.estado] || ''} <span class="topbar__badge">${r.estado}</span></td>
                <td style="color:var(--text-muted);">${r.fecha}</td>
                <td style="color:var(--text-muted); font-size:0.75rem;">${r.observacion || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch {
    list.innerHTML = `<div class="alert alert-error">Error al cargar registros de asistencia</div>`;
  }
}

// ── Mi Asistencia — ESTUDIANTE ────────────────────────────────────────────

async function renderMiAsistencia(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-card__header">
        <span class="section-card__header-icon">📋</span>
        <h3>Mi Asistencia</h3>
      </div>
      <div id="mi-asist-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando asistencia...</div></div>
    </div>
  `;
  try {
    const registros = await api(`/asistencia/estudiante/${state.user.rut}`);
    const list = document.getElementById('mi-asist-list');
    if (!registros.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">Sin registros</div><div class="empty-state__text">Aún no tienes registros de asistencia.</div></div>`;
      return;
    }
    const total = registros.length;
    const presentes = registros.filter(r => r.estado === 'PRESENTE').length;
    const ausentes = registros.filter(r => r.estado === 'AUSENTE').length;
    const tardanzas = registros.filter(r => r.estado === 'TARDANZA').length;
    const pct = +((presentes / total) * 100).toFixed(1);
    const colorAsist = pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)';
    const estadoIcon = { PRESENTE: '✅', AUSENTE: '❌', TARDANZA: '⏰', JUSTIFICADO: '📄' };
    list.innerHTML = `
      <div class="charts-row" style="margin-bottom:1.5rem">
        <div class="chart-wrap" style="display:flex;flex-direction:column;align-items:center">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem;width:100%">% de Asistencia</div>
          <div class="donut-wrap" style="max-width:200px;width:100%;position:relative">
            <canvas id="ma-donut" height="200"></canvas>
            <div class="chart-label-center">
              <div class="pct" style="color:${colorAsist}">${pct}%</div>
              <div class="sub">asistencia</div>
            </div>
          </div>
        </div>
        <div class="chart-wrap">
          <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">Desglose de Asistencia</div>
          <canvas id="ma-barras" height="200"></canvas>
        </div>
      </div>
      <div class="stats-grid" style="margin-bottom:1.5rem">
        <div class="stat-card"><div class="stat-card__label">% Asistencia</div><div class="stat-card__value" style="color:${colorAsist}">${pct}%</div></div>
        <div class="stat-card"><div class="stat-card__label">Presentes</div><div class="stat-card__value" style="color:var(--success)">${presentes}</div></div>
        <div class="stat-card"><div class="stat-card__label">Ausentes</div><div class="stat-card__value" style="color:var(--error)">${ausentes}</div></div>
        <div class="stat-card"><div class="stat-card__label">Tardanzas</div><div class="stat-card__value">${tardanzas}</div></div>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Asignatura</th><th>Estado</th><th>Fecha</th><th>Observación</th></tr></thead>
          <tbody>${registros.map(r => `
            <tr>
              <td style="font-weight:500">${r.asignaturaNombre || r.asignaturaId}</td>
              <td>${estadoIcon[r.estado] || ''} <span class="topbar__badge">${r.estado}</span></td>
              <td style="color:var(--text-muted)">${r.fecha}</td>
              <td style="color:var(--text-muted);font-size:.75rem">${r.observacion || '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    setTimeout(() => { crearDonutAsistencia('ma-donut', pct); crearBarrasAsistencia('ma-barras', registros); }, 100);
  } catch {
    document.getElementById('mi-asist-list').innerHTML = `<div class="alert alert-error">Error al cargar asistencia</div>`;
  }
}

// ── Calificaciones — DOCENTE ─────────────────────────────────────────────

async function renderCalificacionesDocente(container) {
  const selectStyle = 'width:100%; padding:0.625rem 0.875rem; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:var(--font); outline:none;';

  container.innerHTML = `
    <div class="section-card" style="max-width: 600px;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📝</span>
        <h3>Registrar Calificación</h3>
      </div>
      <div id="cal-alert"></div>
      <form id="cal-form">
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="flex:1;">
            <label for="cal-estudiante">RUT Estudiante</label>
            <input type="text" id="cal-estudiante" placeholder="Ej: 44444444-4" required />
          </div>
          <div class="form-group" style="flex:1;">
            <label for="cal-nombre-est">Nombre Estudiante</label>
            <input type="text" id="cal-nombre-est" placeholder="Nombre completo" />
          </div>
        </div>
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="flex:2;">
            <label for="cal-asignatura">Asignatura</label>
            <select id="cal-asignatura" required style="${selectStyle}">
              <option value="" disabled selected>Cargando asignaturas...</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label for="cal-nota">Nota (1.0 - 7.0)</label>
            <input type="number" id="cal-nota" min="1.0" max="7.0" step="0.1" placeholder="4.5" required />
          </div>
        </div>
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="flex:1;">
            <label for="cal-tipo">Tipo</label>
            <select id="cal-tipo" required style="${selectStyle}">
              <option value="PRUEBA">Prueba</option>
              <option value="TAREA">Tarea</option>
              <option value="EXAMEN">Examen</option>
              <option value="TRABAJO">Trabajo</option>
              <option value="PRESENTACION">Presentación</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label for="cal-fecha">Fecha</label>
            <input type="date" id="cal-fecha" required style="color-scheme: dark;" />
          </div>
        </div>
        <div class="form-group">
          <label for="cal-obs">Observación (opcional)</label>
          <input type="text" id="cal-obs" placeholder="Comentario sobre la evaluación" />
        </div>
        <button type="submit" class="btn btn-primary" id="btn-cal">Registrar Calificación</button>
      </form>
    </div>

    <div class="section-card" style="margin-top:1.5rem;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📋</span>
        <h3>Calificaciones Registradas</h3>
      </div>
      <div id="cal-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando...</div></div>
    </div>
  `;

  document.getElementById('cal-fecha').valueAsDate = new Date();
  document.getElementById('cal-form').addEventListener('submit', handleRegistrarCalificacion);
  await loadAsignaturasIntoSelect('cal-asignatura');
  cargarCalificacionesDocente();
}

async function handleRegistrarCalificacion(e) {
  e.preventDefault();
  const btn      = document.getElementById('btn-cal');
  const alertBox = document.getElementById('cal-alert');
  const selectEl = document.getElementById('cal-asignatura');
  const asignaturaNombre = selectEl.options[selectEl.selectedIndex]?.text || '';
  const asignaturaId     = asignaturaNombre.toLowerCase().replace(/\s+/g, '-');

  const payload = {
    estudianteId:     document.getElementById('cal-estudiante').value.trim(),
    estudianteNombre: document.getElementById('cal-nombre-est').value.trim(),
    asignaturaId,
    asignaturaNombre,
    nota:       parseFloat(document.getElementById('cal-nota').value),
    tipo:       document.getElementById('cal-tipo').value,
    fecha:      document.getElementById('cal-fecha').value,
    observacion: document.getElementById('cal-obs').value.trim(),
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  alertBox.innerHTML = '';

  try {
    await api('/calificaciones', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Calificación registrada exitosamente', 'success');
    document.getElementById('cal-form').reset();
    document.getElementById('cal-fecha').valueAsDate = new Date();
    btn.disabled = false;
    btn.textContent = 'Registrar Calificación';
    cargarCalificacionesDocente();
  } catch (err) {
    const msg = err?.data?.error || (err?.data?.errores ? Object.values(err.data.errores).join(', ') : 'Error al registrar');
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
    btn.disabled = false;
    btn.textContent = 'Registrar Calificación';
  }
}

async function cargarCalificacionesDocente() {
  const list = document.getElementById('cal-list');
  try {
    const calificaciones = await api('/calificaciones/mis-registros');
    if (!calificaciones.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📝</div><div class="empty-state__title">Sin registros</div><div class="empty-state__text">Aún no has registrado calificaciones.</div></div>`;
      return;
    }
    list.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Asignatura</th>
              <th>Nota</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            ${calificaciones.map(c => `
              <tr>
                <td style="font-weight:500;">${c.estudianteNombre || c.estudianteId}</td>
                <td>${c.asignaturaNombre || c.asignaturaId}</td>
                <td style="font-weight:700; color:${c.nota >= 4.0 ? 'var(--success)' : 'var(--error)'};">${c.nota.toFixed(1)}</td>
                <td><span class="topbar__badge">${c.tipo}</span></td>
                <td style="color:var(--text-muted);">${c.fecha}</td>
                <td style="color:var(--text-muted); font-size:0.75rem;">${c.observacion || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch {
    list.innerHTML = `<div class="alert alert-error">Error al cargar calificaciones</div>`;
  }
}

// ── Mis Notas — ESTUDIANTE ───────────────────────────────────────────────

async function renderMisNotas(container) {
  container.innerHTML = `
    <div class="section-card">
      <div class="section-card__header">
        <span class="section-card__header-icon">📝</span>
        <h3>Mis Calificaciones</h3>
      </div>
      <div id="notas-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando notas...</div></div>
    </div>
    <div class="charts-row" id="notas-charts" style="display:none">
      <div class="chart-wrap">
        <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem">Promedio por Asignatura</div>
        <canvas id="mn-barras" height="240"></canvas>
      </div>
      <div class="chart-wrap">
        <div style="font-size:0.7rem;font-family:var(--font-mono);color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem">Promedio General</div>
        <div class="donut-wrap" style="max-width:180px">
          <canvas id="mn-donut" height="180"></canvas>
          <div class="chart-label-center" id="mn-donut-label"></div>
        </div>
      </div>
    </div>
  `;

  try {
    const notas = await api(`/calificaciones/estudiante/${state.user.rut}`);
    const list = document.getElementById('notas-list');

    if (!notas.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📝</div><div class="empty-state__title">Sin calificaciones</div><div class="empty-state__text">Aún no tienes calificaciones registradas.</div></div>`;
      return;
    }

    const promedio = (notas.reduce((sum, n) => sum + n.nota, 0) / notas.length).toFixed(1);

    list.innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.5rem;">
        <div class="stat-card">
          <div class="stat-card__label">Promedio General</div>
          <div class="stat-card__value" style="color:${promedio >= 4.0 ? 'var(--success)' : 'var(--error)'};">${promedio}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Evaluaciones</div>
          <div class="stat-card__value">${notas.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Nota más alta</div>
          <div class="stat-card__value" style="color:var(--success);">${Math.max(...notas.map(n => n.nota)).toFixed(1)}</div>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Asignatura</th>
              <th>Nota</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            ${notas.map(n => `
              <tr>
                <td style="font-weight:500;">${n.asignaturaNombre || n.asignaturaId}</td>
                <td style="font-weight:700; color:${n.nota >= 4.0 ? 'var(--success)' : 'var(--error)'};">${n.nota.toFixed(1)}</td>
                <td><span class="topbar__badge">${n.tipo}</span></td>
                <td style="color:var(--text-muted);">${n.fecha}</td>
                <td style="color:var(--text-muted); font-size:0.75rem;">${n.observacion || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch {
    document.getElementById('notas-list').innerHTML = `<div class="alert alert-error">Error al cargar calificaciones</div>`;
  }
}

async function renderMisCursos(container) {
  container.innerHTML = `<div class="loading-container"><span class="spinner spinner-lg"></span> Cargando cursos...</div>`;
  try {
    const asignaturas = await api('/asignaturas');
    const activas = asignaturas.filter(a => a.activa);
    const colorMap = [
      '#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626',
      '#7c3aed','#6d28d9','#0e7490','#047857','#b45309','#b91c1c',
    ];
    container.innerHTML = `
      <div style="margin-bottom:1.75rem;">
        <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.25rem">Mis Cursos</h2>
        <p style="color:var(--text-muted);font-size:0.8125rem;font-family:var(--font-mono)">${activas.length} asignaturas disponibles este período</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem">
        ${activas.map((a, i) => {
          const color = colorMap[i % colorMap.length];
          const iniciales = a.nombre.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
          return `
            <div class="curso-card" data-page="mis-notas"
                 style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:var(--transition-slow);animation:stagger 0.4s ease-out both;animation-delay:${i * 0.08}s">
              <div style="height:7px;background:${color}"></div>
              <div style="padding:1.5rem">
                <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem">
                  <div class="tool-card__icon" style="width:48px;height:48px;border-radius:12px;background:${color}22;border:1px solid ${color}44;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:800;color:${color};font-family:var(--font-mono);flex-shrink:0;transition:transform 0.3s ease">${iniciales}</div>
                  <div>
                    <div style="font-weight:700;font-size:0.9375rem;color:var(--text);line-height:1.3">${a.nombre}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem">${a.docenteNombre || 'Sin docente asignado'}</div>
                  </div>
                </div>
                <div style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);line-height:1.6;margin-bottom:1.25rem">${a.descripcion || ''}</div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:0.625rem;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em;color:${color};background:${color}18;padding:0.25rem 0.625rem;border-radius:20px;border:1px solid ${color}30">Activo</span>
                  <span style="font-size:0.75rem;color:var(--text-dim)">Ver notas →</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.querySelectorAll('.curso-card').forEach(card => {
      card.addEventListener('click', () => navigateTo(card.dataset.page));
    });
  } catch {
    container.innerHTML = `<div class="alert alert-error">Error al cargar los cursos</div>`;
  }
}

// ── Calendario — ESTUDIANTE ──────────────────────────────────────────────

function renderCalendario(container) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const eventos = {
    [today]: [{ text: 'Prueba Matematica', color: '#7c3aed' }],
    [today + 2]: [{ text: 'Entrega Lenguaje', color: '#0891b2' }],
    [today + 5]: [{ text: 'Prueba Biologia', color: '#059669' }],
    [today + 7]: [{ text: 'Acto Escolar', color: '#d97706' }],
  };

  const dias = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
  let cells = '';
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const evs = eventos[d] || [];
    cells += '<div style="min-height:64px;padding:0.4rem;border-radius:8px;background:' + (isToday ? 'var(--accent-soft)' : 'var(--bg-card)') + ';border:1px solid ' + (isToday ? 'rgba(124,58,237,0.4)' : 'var(--border)') + ';transition:var(--transition)">'
      + '<div style="font-size:0.75rem;font-weight:' + (isToday ? '800' : '500') + ';color:' + (isToday ? 'var(--accent-light)' : 'var(--text-muted)') + ';margin-bottom:0.3rem">' + d + '</div>'
      + evs.map(e => '<div style="font-size:0.6rem;background:' + e.color + '22;color:' + e.color + ';border-radius:4px;padding:0.15rem 0.35rem;margin-bottom:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--font-mono)">' + e.text + '</div>').join('')
      + '</div>';
  }

  container.innerHTML = '<div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.75rem"><div>'
    + '<h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.03em;text-transform:capitalize;margin-bottom:0.25rem">' + monthName + '</h2>'
    + '<p style="color:var(--text-muted);font-size:0.8125rem;font-family:var(--font-mono)">Calendario academico</p>'
    + '</div></div>'
    + '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem">'
    + '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0.375rem;margin-bottom:0.5rem">'
    + ['Lun','Mar','Mie','Jue','Vie','Sab','Dom'].map(d => '<div style="text-align:center;font-size:0.6rem;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);padding:0.5rem 0">' + d + '</div>').join('')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0.375rem">' + cells + '</div>'
    + '</div>'
    + '<div style="margin-top:1.5rem;display:flex;flex-wrap:wrap;gap:0.75rem">'
    + [{c:'#7c3aed',t:'Prueba'},{c:'#0891b2',t:'Entrega'},{c:'#059669',t:'Evaluacion'},{c:'#d97706',t:'Evento'}].map(e => '<div style="display:flex;align-items:center;gap:0.4rem;font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono)"><div style="width:10px;height:10px;border-radius:3px;background:' + e.c + '"></div>' + e.t + '</div>').join('')
    + '</div></div>';
}

// ── Herramientas — ESTUDIANTE ────────────────────────────────────────────

function renderHerramientas(container) {
  const herramientas = [
    { icon: '📝', titulo: 'Mis Calificaciones', desc: 'Revisa todas tus notas y promedios por asignatura', page: 'mis-notas', color: '#7c3aed' },
    { icon: '📋', titulo: 'Mi Asistencia', desc: 'Consulta tu porcentaje de asistencia y registros', page: 'mi-asistencia', color: '#0891b2' },
    { icon: '📖', titulo: 'Mis Cursos', desc: 'Explora las asignaturas en las que estás inscrito', page: 'mis-cursos', color: '#059669' },
    { icon: '✉️', titulo: 'Mensajes', desc: 'Revisa comunicaciones de tus docentes', page: 'mensajes', color: '#d97706' },
    { icon: '📅', titulo: 'Calendario', desc: 'Fechas de pruebas, entregas y eventos escolares', page: 'calendario', color: '#dc2626' },
    { icon: '🔒', titulo: 'Cambiar Contraseña', desc: 'Actualiza tu contraseña de acceso al campus', page: 'cambiar-password', color: '#6d28d9' },
  ];
  container.innerHTML = `
    <div>
      <div style="margin-bottom:1.75rem">
        <h2 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.25rem">Herramientas</h2>
        <p style="color:var(--text-muted);font-size:0.8125rem;font-family:var(--font-mono)">Accesos directos a tus recursos académicos</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem">
        ${herramientas.map((h, i) => `
          <div class="tool-card" data-page="${h.page}" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;cursor:pointer;transition:var(--transition-slow);animation:stagger 0.4s ease-out both;animation-delay:${i * 0.07}s">
            <div class="tool-card__icon" style="width:48px;height:48px;border-radius:14px;background:${h.color}18;border:1px solid ${h.color}30;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1rem;transition:transform 0.3s ease">${h.icon}</div>
            <div style="font-weight:700;font-size:0.9375rem;color:var(--text);margin-bottom:0.375rem">${h.titulo}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);line-height:1.6">${h.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.page));
  });
}

// ── Logout ───────────────────────────────────────────────────────────────

function handleLogout() {
  state.token = null;
  state.refreshToken = null;
  state.user = null;
  state.currentPage = 'dashboard';
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  showToast('Sesion cerrada', 'info');
  navigate();
}

// ── Iniciar aplicación ───────────────────────────────────────────────────
navigate();
