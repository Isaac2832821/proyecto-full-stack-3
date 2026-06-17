/**
 * Módulo de utilidades puras del frontend — testeable sin DOM.
 *
 * Estas funciones son extraídas de main.js para permitir pruebas unitarias
 * con Vitest. Contienen lógica de negocio pura (sin efectos secundarios).
 */

/** URL base de la API, configurable por variable de entorno. */
export const API_BASE = import.meta?.env?.VITE_API_URL ?? 'http://localhost:8080';

// ─────────────────────────────────────────────────────────────────────────────
// Lógica de negocio — Notas (Chile: escala 1.0 a 7.0, aprobación ≥ 4.0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el promedio de una lista de calificaciones.
 * @param {Array<{nota: number}>} notas
 * @returns {number} promedio con 1 decimal, 0 si lista vacía
 */
export function calcularPromedio(notas) {
  if (!notas || notas.length === 0) return 0;
  const suma = notas.reduce((acc, n) => acc + n.nota, 0);
  return parseFloat((suma / notas.length).toFixed(1));
}

/**
 * Determina si un promedio es aprobatorio según la escala chilena.
 * La nota mínima de aprobación es 4.0.
 * @param {number} promedio
 * @returns {boolean}
 */
export function esAprobado(promedio) {
  return promedio >= 4.0;
}

/**
 * Retorna el color semántico según el valor de una nota.
 * - Verde (success): nota ≥ 4.0 (aprobado)
 * - Rojo (error): nota < 4.0 (reprobado)
 * @param {number} nota
 * @returns {'var(--success)'|'var(--error)'}
 */
export function colorNota(nota) {
  return nota >= 4 ? 'var(--success)' : 'var(--error)';
}

/**
 * Agrupa las notas por asignatura y calcula el promedio de cada una.
 * @param {Array<{asignaturaNombre?: string, asignaturaId?: string, nota: number}>} notas
 * @returns {Array<{asignatura: string, promedio: number}>}
 */
export function agruparNotasPorAsignatura(notas) {
  if (!notas || notas.length === 0) return [];
  const grupos = {};
  notas.forEach(n => {
    const k = n.asignaturaNombre || n.asignaturaId || 'Sin asignatura';
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(n.nota);
  });
  return Object.entries(grupos).map(([asignatura, vals]) => ({
    asignatura,
    promedio: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Lógica de negocio — Asistencia (Decreto MINEDUC 511: mínimo 85%)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el porcentaje de asistencia de una lista de registros.
 * PRESENTE y TARDANZA se cuentan como asistencia efectiva.
 * @param {Array<{estado: string}>} registros
 * @returns {number} porcentaje con 1 decimal
 */
export function calcularPorcentajeAsistencia(registros) {
  if (!registros || registros.length === 0) return 0;
  const presentes = registros.filter(
    r => r.estado === 'PRESENTE' || r.estado === 'TARDANZA'
  ).length;
  return parseFloat(((presentes / registros.length) * 100).toFixed(1));
}

/**
 * Retorna el estado de asistencia según la regla del 85% MINEDUC.
 * @param {number} porcentaje
 * @returns {'REGULAR'|'EN_RIESGO'|'CRITICO'}
 */
export function estadoAsistencia(porcentaje) {
  if (porcentaje >= 85) return 'REGULAR';
  if (porcentaje >= 75) return 'EN_RIESGO';
  return 'CRITICO';
}

/**
 * Retorna el color semántico según el porcentaje de asistencia.
 * @param {number} pct
 * @returns {string}
 */
export function colorAsistencia(pct) {
  if (pct >= 75) return 'var(--success)';
  if (pct >= 60) return 'var(--warning)';
  return 'var(--error)';
}

/**
 * Cuenta los registros por estado de asistencia.
 * @param {Array<{estado: string}>} registros
 * @returns {{PRESENTE: number, AUSENTE: number, TARDANZA: number, JUSTIFICADO: number}}
 */
export function contarPorEstado(registros) {
  const counts = { PRESENTE: 0, AUSENTE: 0, TARDANZA: 0, JUSTIFICADO: 0 };
  if (!registros) return counts;
  registros.forEach(r => {
    if (counts[r.estado] !== undefined) counts[r.estado]++;
  });
  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lógica de UI — Router / Navegación
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna el título de página según el nombre de la ruta.
 * @param {string} page
 * @returns {string}
 */
export function getTituloPage(page) {
  const titles = {
    'dashboard':         'Actividad',
    'perfil':            'Mi Perfil',
    'usuarios':          'Gestión de Usuarios',
    'profesores':        'Gestión de Profesores',
    'asignaturas-admin': 'Asignaturas',
    'hijos':             'Mis Estudiantes',
    'matricular':        'Matricular Estudiante',
    'calificaciones':    'Calificaciones',
    'asistencia':        'Asistencia',
    'mis-notas':         'Calificaciones',
    'mi-asistencia':     'Asistencia',
    'mensajes':          'Mensajes',
    'cambiar-password':  'Cambiar Contraseña',
  };
  return titles[page] || 'Actividad';
}

// ─────────────────────────────────────────────────────────────────────────────
// Lógica de Auth — JWT y sesión
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Comprueba si el usuario está autenticado.
 * @param {{token: string|null, user: object|null}} state
 * @returns {boolean}
 */
export function estaAutenticado(state) {
  return !!(state?.token && state?.user);
}

/**
 * Construye el payload de login desde valores de formulario.
 * @param {string} rut
 * @param {string} password
 * @returns {{rut: string, password: string}}
 */
export function buildLoginPayload(rut, password) {
  return { rut: rut.trim(), password };
}

/**
 * Construye el estado de usuario a partir de la respuesta del API de login.
 * @param {object} data - respuesta del endpoint /auth/login
 * @returns {{id, rut, nombre, apellido, email, rol}}
 */
export function buildUserFromResponse(data) {
  return {
    id: data.id,
    rut: data.rut,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    rol: data.rol,
  };
}

/**
 * Retorna las iniciales del usuario para el avatar.
 * @param {string} nombre
 * @param {string} apellido
 * @returns {string} ej: "JP"
 */
export function getIniciales(nombre, apellido) {
  if (!nombre || !apellido) return '??';
  return `${nombre[0]}${apellido[0]}`.toUpperCase();
}
