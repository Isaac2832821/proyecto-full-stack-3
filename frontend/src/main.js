// ── Configuración ────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8081';

// ── Estado global ────────────────────────────────────────────────────────
let state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  currentView: 'login' // para alternar entre "login" o "registro"
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
  btn.textContent = 'Ingresando...';
  alertBox.innerHTML = '';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ rut, password }),
    });

    // Guardar sesión
    state.token = data.token;
    state.user = {
      id: data.id,
      rut: data.rut,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      rol: data.rol,
    };
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));

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
              <label for="reg-nombre" style="display:block; font-size:0.8125rem; font-weight:500; color:var(--text-muted); margin-bottom:0.375rem;">Nombre</label>
              <input type="text" id="reg-nombre" required style="width:100%; padding:0.75rem 1rem; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; color:var(--text); font-family:var(--font); outline:none;" />
            </div>
            <div class="form-group" style="margin-bottom: 0; flex: 1;">
              <label for="reg-apellido" style="display:block; font-size:0.8125rem; font-weight:500; color:var(--text-muted); margin-bottom:0.375rem;">Apellido</label>
              <input type="text" id="reg-apellido" required style="width:100%; padding:0.75rem 1rem; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; color:var(--text); font-family:var(--font); outline:none;" />
            </div>
          </div>
          <div class="form-group">
            <label for="reg-rut">RUT</label>
            <input type="text" id="reg-rut" placeholder="Ej: 11111111-1" required autocomplete="off" />
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input type="email" id="reg-email" placeholder="correo@ejemplo.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="reg-rol" style="display:block; font-size:0.8125rem; font-weight:500; color:var(--text-muted); margin-bottom:0.375rem;">Rol</label>
            <select id="reg-rol" required style="width:100%; padding:0.75rem 1rem; background:var(--bg-input); border:1px solid var(--border); border-radius:8px; color:var(--text); font-family:var(--font); outline:none; margin-bottom:1.25rem;">
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="DOCENTE">Docente</option>
              <option value="APODERADO">Apoderado</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reg-password">Contraseña</label>
            <input type="password" id="reg-password" required autocomplete="new-password" />
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
  btn.textContent = 'Registrando...';
  alertBox.innerHTML = '';

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    state.token = data.token;
    state.user = {
      id: data.id,
      rut: data.rut,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      rol: data.rol,
    };
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));

    state.currentView = 'login';
    navigate();
  } catch (err) {
    let msg = 'Error al registrar';
    if (err?.data?.errores) {
       msg = Object.values(err.data.errores).join('<br>');
    } else if (err?.data?.error) {
       msg = err.data.error;
    }
    
    alertBox.innerHTML = `<div class="alert alert-error">\${msg}</div>`;
    btn.disabled = false;
    btn.textContent = 'Registrarse';
  }
}

// ── Dashboard ────────────────────────────────────────────────────────────

function renderDashboard(container) {
  const { nombre, apellido, rol } = state.user;

  container.innerHTML = `
    <div class="dashboard">
      <nav class="topbar">
        <span class="topbar__brand">🏫 Colegio Bernardo O'Higgins</span>
        <div class="topbar__user">
          <span>${nombre} ${apellido}</span>
          <span class="topbar__badge">${rol}</span>
          <button class="btn-logout" id="btn-logout">Cerrar Sesión</button>
        </div>
      </nav>
      <main class="dashboard__content">
        <section class="welcome-section">
          <h2>Bienvenido, ${nombre} 👋</h2>
          <p>Panel de gestión del sistema escolar</p>
        </section>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card__label">Tu Rol</div>
            <div class="stat-card__value">${rol}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Email</div>
            <div class="stat-card__value" style="font-size:1rem;">${state.user.email}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">RUT</div>
            <div class="stat-card__value" style="font-size:1.25rem;">${state.user.rut}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">Estado</div>
            <div class="stat-card__value" style="font-size:1.25rem;">✅ Activo</div>
          </div>
        </div>
        ${rol === 'ADMIN' ? renderAdminSection() : ''}
      </main>
    </div>
  `;

  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  if (rol === 'ADMIN') {
    loadUsuarios();
  }
}

function renderAdminSection() {
  return `
    <section style="margin-top:1rem;">
      <h3 style="font-size:1.25rem; font-weight:600; margin-bottom:1rem;">👥 Gestión de Usuarios</h3>
      <div id="usuarios-list" style="color:var(--text-muted);">Cargando usuarios...</div>
    </section>
  `;
}

async function loadUsuarios() {
  const container = document.getElementById('usuarios-list');
  try {
    const usuarios = await api('/usuarios');
    if (!usuarios.length) {
      container.textContent = 'No hay usuarios registrados.';
      return;
    }
    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid var(--border); text-align:left;">
              <th style="padding:0.75rem; color:var(--text-muted); font-size:0.8125rem; text-transform:uppercase;">ID</th>
              <th style="padding:0.75rem; color:var(--text-muted); font-size:0.8125rem; text-transform:uppercase;">Nombre</th>
              <th style="padding:0.75rem; color:var(--text-muted); font-size:0.8125rem; text-transform:uppercase;">RUT</th>
              <th style="padding:0.75rem; color:var(--text-muted); font-size:0.8125rem; text-transform:uppercase;">Email</th>
              <th style="padding:0.75rem; color:var(--text-muted); font-size:0.8125rem; text-transform:uppercase;">Rol</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:0.75rem;">${u.id}</td>
                <td style="padding:0.75rem;">${u.nombre} ${u.apellido}</td>
                <td style="padding:0.75rem;">${u.rut}</td>
                <td style="padding:0.75rem; color:var(--text-muted);">${u.email}</td>
                <td style="padding:0.75rem;"><span class="topbar__badge">${u.rol}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error al cargar usuarios</div>`;
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate();
}

// ── Iniciar aplicación ───────────────────────────────────────────────────
navigate();
