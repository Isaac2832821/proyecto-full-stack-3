import { describe, it, expect } from 'vitest';
import {
  calcularPromedio,
  esAprobado,
  colorNota,
  agruparNotasPorAsignatura,
  calcularPorcentajeAsistencia,
  estadoAsistencia,
  colorAsistencia,
  contarPorEstado,
  getTituloPage,
  estaAutenticado,
  buildLoginPayload,
  buildUserFromResponse,
  getIniciales,
} from '../src/utils.js';

// ═══════════════════════════════════════════════════════════════════════════
// NOTAS
// ═══════════════════════════════════════════════════════════════════════════

describe('calcularPromedio', () => {
  it('calcula promedio de una lista de notas', () => {
    const notas = [{ nota: 5.0 }, { nota: 6.0 }, { nota: 7.0 }];
    expect(calcularPromedio(notas)).toBe(6.0);
  });

  it('retorna 0 con lista vacía', () => {
    expect(calcularPromedio([])).toBe(0);
  });

  it('retorna 0 con null', () => {
    expect(calcularPromedio(null)).toBe(0);
  });

  it('redondea a 1 decimal', () => {
    const notas = [{ nota: 5.0 }, { nota: 6.0 }];
    expect(calcularPromedio(notas)).toBe(5.5);
  });

  it('calcula promedio de una sola nota', () => {
    expect(calcularPromedio([{ nota: 4.5 }])).toBe(4.5);
  });

  it('calcula promedio con notas reprobadas', () => {
    const notas = [{ nota: 2.0 }, { nota: 3.0 }];
    expect(calcularPromedio(notas)).toBe(2.5);
  });
});

describe('esAprobado', () => {
  it('4.0 es aprobado (nota mínima Chile)', () => {
    expect(esAprobado(4.0)).toBe(true);
  });

  it('3.9 es reprobado', () => {
    expect(esAprobado(3.9)).toBe(false);
  });

  it('7.0 es aprobado', () => {
    expect(esAprobado(7.0)).toBe(true);
  });

  it('1.0 es reprobado', () => {
    expect(esAprobado(1.0)).toBe(false);
  });

  it('5.5 es aprobado', () => {
    expect(esAprobado(5.5)).toBe(true);
  });
});

describe('colorNota', () => {
  it('nota 4.0 retorna color success', () => {
    expect(colorNota(4.0)).toBe('var(--success)');
  });

  it('nota 3.9 retorna color error', () => {
    expect(colorNota(3.9)).toBe('var(--error)');
  });

  it('nota 7.0 retorna color success', () => {
    expect(colorNota(7.0)).toBe('var(--success)');
  });

  it('nota 1.0 retorna color error', () => {
    expect(colorNota(1.0)).toBe('var(--error)');
  });
});

describe('agruparNotasPorAsignatura', () => {
  it('agrupa notas por asignatura y calcula promedio', () => {
    const notas = [
      { asignaturaNombre: 'Matemáticas', nota: 6.0 },
      { asignaturaNombre: 'Matemáticas', nota: 4.0 },
      { asignaturaNombre: 'Historia', nota: 5.0 },
    ];
    const result = agruparNotasPorAsignatura(notas);
    const mat = result.find(r => r.asignatura === 'Matemáticas');
    const his = result.find(r => r.asignatura === 'Historia');
    expect(mat.promedio).toBe(5.0);
    expect(his.promedio).toBe(5.0);
  });

  it('usa asignaturaId si no hay nombre', () => {
    const notas = [{ asignaturaId: 'mat-001', nota: 6.0 }];
    const result = agruparNotasPorAsignatura(notas);
    expect(result[0].asignatura).toBe('mat-001');
  });

  it('usa "Sin asignatura" si no hay nombre ni id', () => {
    const notas = [{ nota: 5.0 }];
    const result = agruparNotasPorAsignatura(notas);
    expect(result[0].asignatura).toBe('Sin asignatura');
  });

  it('retorna array vacío con lista vacía', () => {
    expect(agruparNotasPorAsignatura([])).toEqual([]);
  });

  it('retorna array vacío con null', () => {
    expect(agruparNotasPorAsignatura(null)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ASISTENCIA — Regla MINEDUC 85%
// ═══════════════════════════════════════════════════════════════════════════

describe('calcularPorcentajeAsistencia', () => {
  it('100% con todos presentes', () => {
    const r = [{ estado: 'PRESENTE' }, { estado: 'PRESENTE' }];
    expect(calcularPorcentajeAsistencia(r)).toBe(100.0);
  });

  it('50% con mitad presentes', () => {
    const r = [{ estado: 'PRESENTE' }, { estado: 'AUSENTE' }];
    expect(calcularPorcentajeAsistencia(r)).toBe(50.0);
  });

  it('TARDANZA cuenta como asistencia efectiva', () => {
    const r = [{ estado: 'TARDANZA' }, { estado: 'TARDANZA' }];
    expect(calcularPorcentajeAsistencia(r)).toBe(100.0);
  });

  it('JUSTIFICADO NO cuenta como PRESENTE (solo PRESENTE y TARDANZA)', () => {
    const r = [{ estado: 'JUSTIFICADO' }, { estado: 'AUSENTE' }];
    expect(calcularPorcentajeAsistencia(r)).toBe(0.0);
  });

  it('retorna 0 con lista vacía', () => {
    expect(calcularPorcentajeAsistencia([])).toBe(0);
  });

  it('retorna 0 con null', () => {
    expect(calcularPorcentajeAsistencia(null)).toBe(0);
  });

  it('calcula correctamente con mezcla de estados', () => {
    const r = [
      { estado: 'PRESENTE' },
      { estado: 'PRESENTE' },
      { estado: 'TARDANZA' },
      { estado: 'AUSENTE' },
    ];
    expect(calcularPorcentajeAsistencia(r)).toBe(75.0);
  });
});

describe('estadoAsistencia', () => {
  it('≥85% es REGULAR', () => {
    expect(estadoAsistencia(85)).toBe('REGULAR');
    expect(estadoAsistencia(100)).toBe('REGULAR');
    expect(estadoAsistencia(90)).toBe('REGULAR');
  });

  it('75-84.9% es EN_RIESGO', () => {
    expect(estadoAsistencia(75)).toBe('EN_RIESGO');
    expect(estadoAsistencia(80)).toBe('EN_RIESGO');
    expect(estadoAsistencia(84.9)).toBe('EN_RIESGO');
  });

  it('<75% es CRITICO', () => {
    expect(estadoAsistencia(74)).toBe('CRITICO');
    expect(estadoAsistencia(0)).toBe('CRITICO');
    expect(estadoAsistencia(50)).toBe('CRITICO');
  });
});

describe('colorAsistencia', () => {
  it('≥75% retorna success', () => {
    expect(colorAsistencia(75)).toBe('var(--success)');
    expect(colorAsistencia(100)).toBe('var(--success)');
  });

  it('60-74% retorna warning', () => {
    expect(colorAsistencia(60)).toBe('var(--warning)');
    expect(colorAsistencia(74)).toBe('var(--warning)');
  });

  it('<60% retorna error', () => {
    expect(colorAsistencia(59)).toBe('var(--error)');
    expect(colorAsistencia(0)).toBe('var(--error)');
  });
});

describe('contarPorEstado', () => {
  it('cuenta correctamente cada estado', () => {
    const registros = [
      { estado: 'PRESENTE' },
      { estado: 'PRESENTE' },
      { estado: 'AUSENTE' },
      { estado: 'TARDANZA' },
      { estado: 'JUSTIFICADO' },
    ];
    const counts = contarPorEstado(registros);
    expect(counts.PRESENTE).toBe(2);
    expect(counts.AUSENTE).toBe(1);
    expect(counts.TARDANZA).toBe(1);
    expect(counts.JUSTIFICADO).toBe(1);
  });

  it('retorna ceros con lista vacía', () => {
    const counts = contarPorEstado([]);
    expect(counts.PRESENTE).toBe(0);
    expect(counts.AUSENTE).toBe(0);
  });

  it('retorna ceros con null', () => {
    const counts = contarPorEstado(null);
    expect(counts.PRESENTE).toBe(0);
  });

  it('ignora estados desconocidos', () => {
    const registros = [{ estado: 'DESCONOCIDO' }];
    const counts = contarPorEstado(registros);
    expect(counts.PRESENTE).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER / NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════════════════

describe('getTituloPage', () => {
  it('retorna título correcto para cada página', () => {
    expect(getTituloPage('dashboard')).toBe('Actividad');
    expect(getTituloPage('perfil')).toBe('Mi Perfil');
    expect(getTituloPage('usuarios')).toBe('Gestión de Usuarios');
    expect(getTituloPage('calificaciones')).toBe('Calificaciones');
    expect(getTituloPage('asistencia')).toBe('Asistencia');
    expect(getTituloPage('mensajes')).toBe('Mensajes');
  });

  it('retorna "Actividad" para página desconocida', () => {
    expect(getTituloPage('pagina-inexistente')).toBe('Actividad');
  });

  it('retorna "Actividad" para undefined', () => {
    expect(getTituloPage(undefined)).toBe('Actividad');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH / SESIÓN
// ═══════════════════════════════════════════════════════════════════════════

describe('estaAutenticado', () => {
  it('retorna true con token y user presentes', () => {
    expect(estaAutenticado({ token: 'abc', user: { rut: '11-1' } })).toBe(true);
  });

  it('retorna false sin token', () => {
    expect(estaAutenticado({ token: null, user: { rut: '11-1' } })).toBe(false);
  });

  it('retorna false sin user', () => {
    expect(estaAutenticado({ token: 'abc', user: null })).toBe(false);
  });

  it('retorna false con null', () => {
    expect(estaAutenticado(null)).toBe(false);
  });

  it('retorna false con token vacío', () => {
    expect(estaAutenticado({ token: '', user: {} })).toBe(false);
  });
});

describe('buildLoginPayload', () => {
  it('construye payload con rut trimmed', () => {
    const payload = buildLoginPayload('  11111111-1  ', 'pass123');
    expect(payload.rut).toBe('11111111-1');
    expect(payload.password).toBe('pass123');
  });

  it('incluye rut y password en el payload', () => {
    const payload = buildLoginPayload('22222222-2', 'mipass');
    expect(payload).toHaveProperty('rut');
    expect(payload).toHaveProperty('password');
  });
});

describe('buildUserFromResponse', () => {
  it('mapea correctamente la respuesta del API', () => {
    const data = {
      id: 'user-1', rut: '11111111-1', nombre: 'Juan',
      apellido: 'Pérez', email: 'juan@test.cl', rol: 'DOCENTE',
    };
    const user = buildUserFromResponse(data);
    expect(user.id).toBe('user-1');
    expect(user.nombre).toBe('Juan');
    expect(user.rol).toBe('DOCENTE');
  });

  it('retorna todos los campos requeridos', () => {
    const data = { id: '1', rut: 'r', nombre: 'n', apellido: 'a', email: 'e', rol: 'ADMIN' };
    const user = buildUserFromResponse(data);
    expect(Object.keys(user)).toEqual(['id', 'rut', 'nombre', 'apellido', 'email', 'rol']);
  });
});

describe('getIniciales', () => {
  it('retorna iniciales en mayúscula', () => {
    expect(getIniciales('Juan', 'Pérez')).toBe('JP');
  });

  it('retorna iniciales de un solo carácter cada nombre', () => {
    expect(getIniciales('Ana', 'Soto')).toBe('AS');
  });

  it('retorna "??" sin nombre ni apellido', () => {
    expect(getIniciales(null, null)).toBe('??');
  });

  it('retorna "??" con strings vacíos', () => {
    expect(getIniciales('', '')).toBe('??');
  });
});
