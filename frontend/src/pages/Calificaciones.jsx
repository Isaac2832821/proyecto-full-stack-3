import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Calificaciones() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user.rol === 'DOCENTE') {
      api('/calificaciones/mis-registros').then(setData).catch(()=>setData([]));
    } else if (user.rol === 'ESTUDIANTE') {
      api(`/calificaciones/estudiante/${user.rut}`).then(setData).catch(()=>setData([]));
    } else {
      api('/calificaciones').then(setData).catch(()=>setData([]));
    }
  }, [user]);

  return (
    <div className="section-card">
      <div className="section-card__header">
        <h3>Registro de Calificaciones</h3>
      </div>
      {!data ? <div className="loading-container"><span className="spinner"></span> Cargando...</div> : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asignatura</th>
                <th>Estudiante RUT</th>
                <th>Nota</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id}>
                  <td>{c.asignaturaNombre || c.asignaturaId}</td>
                  <td>{c.estudianteId}</td>
                  <td className={c.nota >= 4 ? 'text-success' : 'text-error'} style={{ fontWeight: 'bold' }}>
                    {c.nota}
                  </td>
                  <td className="text-muted">{c.comentario || '-'}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan="4" className="empty-state">No hay calificaciones registradas</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
