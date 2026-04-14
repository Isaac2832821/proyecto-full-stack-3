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
    
    alertBox.innerHTML = `<div class="alert alert-error">${msg}</div>`;
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
        ${rol === 'APODERADO' ? renderApoderadoSection() : ''}
      </main>
    </div>
  `;

  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  if (rol === 'ADMIN') {
    loadUsuarios();
  }
  if (rol === 'APODERADO') {
    loadHijos();
    document.getElementById('add-hijo-form').addEventListener('submit', handleAddHijo);
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

// ── Dashboard Apoderado ──────────────────────────────────────────────────

function renderApoderadoSection() {
  return `
    <section style="margin-top:2rem;">
      <h3 style="font-size:1.25rem; font-weight:600; margin-bottom:1rem;">👼 Estudiantes a cargo</h3>
      
      <div style="display:flex; flex-wrap:wrap; gap: 2rem;">
        <div style="flex:1; min-width: 300px;">
          <div id="hijos-list" style="color:var(--text-muted);">Cargando estudiantes...</div>
        </div>
        
        <div style="flex:1; min-width: 300px; background: var(--bg-input); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow);">
          <h4 style="margin-bottom: 1rem; font-size:1.1rem; color: var(--primary-light);">➕ Matricular Nuevo Estudiante</h4>
          <div id="add-hijo-alert"></div>
          <form id="add-hijo-form">
            <input type="text" id="h-nombre" placeholder="Nombre" required style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border-radius:6px; background:var(--bg); color:var(--text); border:1px solid var(--border); outline:none;"/>
            <input type="text" id="h-apellido" placeholder="Apellido" required style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border-radius:6px; background:var(--bg); color:var(--text); border:1px solid var(--border); outline:none;"/>
            <input type="text" id="h-rut" placeholder="RUT (ej: 9999999-9)" required style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border-radius:6px; background:var(--bg); color:var(--text); border:1px solid var(--border); outline:none;"/>
            <input type="email" id="h-email" placeholder="Email" required style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border-radius:6px; background:var(--bg); color:var(--text); border:1px solid var(--border); outline:none;"/>
            <input type="password" id="h-password" placeholder="Contraseña provisoria" required style="width:100%; padding:0.75rem; margin-bottom:1.25rem; border-radius:6px; background:var(--bg); color:var(--text); border:1px solid var(--border); outline:none;"/>
            <button type="submit" class="btn btn-primary" id="btn-add-hijo" style="padding: 0.75rem 1rem;">Matricular Estudiante</button>
          </form>
        </div>
      </div>
    </section>
  `;
}

async function loadHijos() {
  const container = document.getElementById('hijos-list');
  try {
    const hijos = await api('/usuarios/mis-hijos');
    if (!hijos.length) {
      container.innerHTML = '<div class="alert alert-error" style="background:rgba(255,255,255,0.05); color:var(--text-muted); border-color:var(--border);">Aún no tienes estudiantes registrados a tu cargo. Usa el formulario de la derecha para matricularlos.</div>';
      return;
    }
    container.innerHTML = `
      <div style="display:grid; gap:1rem;">
        ${hijos.map(h => `
          <div style="background:var(--bg-card); padding:1rem; border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; gap:1.25rem; transition:var(--transition);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
            <div style="font-size: 2.2rem; filter: drop-shadow(0 2px 4px rgba(37,99,235,0.3));">🎓</div>
            <div>
              <div style="font-weight:600; font-size:1.1rem; color:var(--primary-light);">${h.nombre} ${h.apellido}</div>
              <div style="font-size:0.875rem; color:var(--text-muted); margin-top:0.25rem;">RUT: ${h.rut} | Email: ${h.email}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error al cargar estudiantes</div>`;
  }
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
  btn.textContent = 'Matriculando...';
  alertBox.innerHTML = '';

  try {
    await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async r => {
       const j = await r.json();
       if(!r.ok) throw {data: j};
       return j;
    });
    
    document.getElementById('add-hijo-form').reset();
    alertBox.innerHTML = `<div class="alert alert-success">¡Estudiante matriculado y asignado a tu cuenta con éxito!</div>`;
    btn.disabled = false;
    btn.textContent = 'Matricular Estudiante';
    loadHijos();
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

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate();
}

// ── Iniciar aplicación ───────────────────────────────────────────────────
navigate();
