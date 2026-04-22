// ── Configuración ────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8080';

// ── Estado global ────────────────────────────────────────────────────────
let state = {
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  currentView: 'login',
  currentPage: 'dashboard'
};

// ── Utilidades HTTP ──────────────────────────────────────────────────────

async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw { status: res.status, data };
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

function updateActiveLink() {
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === state.currentPage);
  });
}

// ── Página de Login ──────────────────────────────────────────────────────

function renderLogin(container) {
  container.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__logo">
          <h1>🏫 Colegio Bernardo O'Higgins</h1>
          <p>Sistema de Gestión Escolar</p>
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
          <div style="text-align: center; font-size: 0.875rem;">
            <a href="#" id="link-register" style="color: var(--primary-light); text-decoration: none;">¿No tienes cuenta? Regístrate aquí</a>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('link-register').addEventListener('click', (e) => {
    e.preventDefault();
    state.currentView = 'register';
    navigate();
  });
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
        <div class="dashboard__content" id="page-content">
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  // Sidebar navigation
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', () => navigateTo(link.dataset.page));
  });

  renderPageContent(document.getElementById('page-content'));
  updateActiveLink();
}

// ── Sidebar ──────────────────────────────────────────────────────────────

function renderSidebar(rol, nombre, apellido, initials) {
  const menuItems = getMenuItems(rol);

  return `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <h2>🏫 Colegio B. O'Higgins</h2>
        <p>Sistema de Gestión</p>
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

function getMenuItems(rol) {
  let items = '';

  if (rol === 'ADMIN') {
    items += `
      <div class="sidebar__section-label">Administración</div>
      <a class="sidebar__link" data-page="usuarios">
        <span class="sidebar__link-icon">👥</span> Gestión de Usuarios
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
    `;
  }

  if (rol === 'ESTUDIANTE') {
    items += `
      <div class="sidebar__section-label">Académico</div>
      <a class="sidebar__link" data-page="mis-notas">
        <span class="sidebar__link-icon">📝</span> Mis Calificaciones
      </a>
      <a class="sidebar__link" data-page="mi-asistencia">
        <span class="sidebar__link-icon">📋</span> Mi Asistencia
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
    'dashboard': 'Dashboard',
    'perfil': 'Mi Perfil',
    'usuarios': 'Gestión de Usuarios',
    'hijos': 'Mis Estudiantes',
    'matricular': 'Matricular Estudiante',
    'calificaciones': 'Calificaciones',
    'asistencia': 'Asistencia',
    'mis-notas': 'Mis Calificaciones',
    'mi-asistencia': 'Mi Asistencia',
    'cambiar-password': 'Cambiar Contraseña',
  };

  if (titleEl) titleEl.textContent = titles[state.currentPage] || 'Dashboard';

  // Bind sidebar logout after re-render
  setTimeout(() => {
    const sidebarLogout = document.getElementById('btn-logout-sidebar');
    if (sidebarLogout) sidebarLogout.addEventListener('click', handleLogout);
  }, 0);

  switch (state.currentPage) {
    case 'dashboard': return renderDashboardHome(container);
    case 'perfil': return renderProfile(container);
    case 'usuarios': return renderUsuariosPage(container);
    case 'hijos': return renderHijosPage(container);
    case 'matricular': return renderMatricularPage(container);
    case 'calificaciones': return renderCalificacionesDocente(container);
    case 'asistencia': return renderComingSoon(container, '📋', 'Asistencia', 'El módulo de asistencia estará disponible cuando se implemente el microservicio ms-asistencia.');
    case 'mis-notas': return renderMisNotas(container);
    case 'mi-asistencia': return renderComingSoon(container, '📋', 'Mi Asistencia', 'Podrás ver tu registro de asistencia cuando el módulo esté disponible.');
    case 'cambiar-password': return renderCambiarPassword(container);
    default: return renderDashboardHome(container);
  }
}

// ── Dashboard Home ───────────────────────────────────────────────────────

function renderDashboardHome(container) {
  const { nombre, rol, email, rut } = state.user;

  container.innerHTML = `
    <section class="welcome-section">
      <h2>Bienvenido, ${nombre} 👋</h2>
      <p>Panel de gestión del sistema escolar</p>
    </section>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__label">Tu Rol</div>
        <div class="stat-card__value" style="font-size:1.5rem;">${rol}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Email</div>
        <div class="stat-card__value" style="font-size:0.95rem;">${email}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">RUT</div>
        <div class="stat-card__value" style="font-size:1.25rem;">${rut}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Estado</div>
        <div class="stat-card__value" style="font-size:1.25rem;">✅ Activo</div>
      </div>
    </div>
  `;
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
      </div>
      <div id="usuarios-list"><div class="loading-container"><span class="spinner spinner-lg"></span> Cargando usuarios...</div></div>
    </div>
  `;

  try {
    const usuarios = await api('/usuarios');
    const list = document.getElementById('usuarios-list');
    if (!usuarios.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">👥</div><div class="empty-state__title">Sin usuarios</div><div class="empty-state__text">No hay usuarios registrados en el sistema.</div></div>`;
      return;
    }
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
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => `
              <tr>
                <td style="font-weight:500;">${u.nombre} ${u.apellido}</td>
                <td>${u.rut}</td>
                <td style="color:var(--text-muted);">${u.email}</td>
                <td><span class="topbar__badge">${u.rol}</span></td>
                <td>${u.activo !== false ? '✅' : '❌'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch {
    document.getElementById('usuarios-list').innerHTML = `<div class="alert alert-error">Error al cargar usuarios</div>`;
  }
}

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
    <div id="hijos-notas-container"></div>
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
            <div style="color:var(--text-dim); font-size:0.75rem;">Click para ver notas →</div>
          </div>
        `).join('')}
      </div>
    `;

    // Click en cada hijo para cargar sus notas
    document.querySelectorAll('.hijo-card').forEach(card => {
      card.addEventListener('click', () => {
        const rut = card.dataset.rut;
        const nombre = card.dataset.nombre;
        cargarNotasHijo(rut, nombre);

        // Highlight active
        document.querySelectorAll('.hijo-card').forEach(c => c.style.borderColor = 'var(--border)');
        card.style.borderColor = 'var(--accent)';
      });
    });
  } catch {
    document.getElementById('hijos-list').innerHTML = `<div class="alert alert-error">Error al cargar estudiantes</div>`;
  }
}

async function cargarNotasHijo(rut, nombre) {
  const notasContainer = document.getElementById('hijos-notas-container');
  notasContainer.innerHTML = `
    <div class="section-card" style="margin-top:1.5rem;">
      <div class="section-card__header">
        <span class="section-card__header-icon">📝</span>
        <h3>Calificaciones de ${nombre}</h3>
      </div>
      <div class="loading-container"><span class="spinner spinner-lg"></span> Cargando notas...</div>
    </div>
  `;

  try {
    const notas = await api(`/calificaciones/estudiante/${rut}`);

    if (!notas.length) {
      notasContainer.innerHTML = `
        <div class="section-card" style="margin-top:1.5rem;">
          <div class="section-card__header">
            <span class="section-card__header-icon">📝</span>
            <h3>Calificaciones de ${nombre}</h3>
          </div>
          <div class="empty-state"><div class="empty-state__icon">📝</div><div class="empty-state__title">Sin calificaciones</div><div class="empty-state__text">${nombre} aún no tiene calificaciones registradas.</div></div>
        </div>
      `;
      return;
    }

    const promedio = (notas.reduce((sum, n) => sum + n.nota, 0) / notas.length).toFixed(1);

    notasContainer.innerHTML = `
      <div class="section-card" style="margin-top:1.5rem;">
        <div class="section-card__header">
          <span class="section-card__header-icon">📝</span>
          <h3>Calificaciones de ${nombre}</h3>
        </div>
        <div class="stats-grid" style="margin-bottom:1.5rem;">
          <div class="stat-card">
            <div class="stat-card__label">Promedio</div>
            <div class="stat-card__value" style="color:${promedio >= 4.0 ? 'var(--success)' : 'var(--error)'};">${promedio}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Evaluaciones</div>
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
      </div>
    `;
  } catch {
    notasContainer.innerHTML = `<div class="alert alert-error" style="margin-top:1rem;">Error al cargar notas del estudiante</div>`;
  }
}

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

// ── Calificaciones — DOCENTE ─────────────────────────────────────────────

async function renderCalificacionesDocente(container) {
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
          <div class="form-group" style="flex:1;">
            <label for="cal-asignatura">Asignatura</label>
            <input type="text" id="cal-asignatura" placeholder="Nombre asignatura" required />
          </div>
          <div class="form-group" style="flex:1;">
            <label for="cal-nota">Nota (1.0 - 7.0)</label>
            <input type="number" id="cal-nota" min="1.0" max="7.0" step="0.1" placeholder="4.5" required />
          </div>
        </div>
        <div style="display:flex; gap:1rem;">
          <div class="form-group" style="flex:1;">
            <label for="cal-tipo">Tipo</label>
            <select id="cal-tipo" required style="width:100%; padding:0.625rem 0.875rem; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-family:var(--font); outline:none;">
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

  // Set today's date as default
  document.getElementById('cal-fecha').valueAsDate = new Date();

  document.getElementById('cal-form').addEventListener('submit', handleRegistrarCalificacion);
  cargarCalificacionesDocente();
}

async function handleRegistrarCalificacion(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-cal');
  const alertBox = document.getElementById('cal-alert');

  const payload = {
    estudianteId: document.getElementById('cal-estudiante').value.trim(),
    estudianteNombre: document.getElementById('cal-nombre-est').value.trim(),
    asignaturaId: document.getElementById('cal-asignatura').value.trim().toLowerCase().replace(/\s+/g, '-'),
    asignaturaNombre: document.getElementById('cal-asignatura').value.trim(),
    nota: parseFloat(document.getElementById('cal-nota').value),
    tipo: document.getElementById('cal-tipo').value,
    fecha: document.getElementById('cal-fecha').value,
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
    const msg = err?.data?.error || err?.data?.errores ? Object.values(err.data.errores).join(', ') : 'Error al registrar';
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

// ── Logout ───────────────────────────────────────────────────────────────

function handleLogout() {
  state.token = null;
  state.refreshToken = null;
  state.user = null;
  state.currentPage = 'dashboard';
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  showToast('Sesión cerrada', 'info');
  navigate();
}

// ── Iniciar aplicación ───────────────────────────────────────────────────
navigate();
