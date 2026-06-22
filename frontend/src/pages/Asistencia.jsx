import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Asistencia() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user.rol === 'DOCENTE') {
      api('/asistencia/mis-registros').then(setData).catch(()=>setData([]));
    } else if (user.rol === 'ESTUDIANTE') {
      api(`/asistencia/estudiante/${user.rut}`).then(setData).catch(()=>setData([]));
    }
  }, [user]);

  return (
    <div className="section-card">
      <div className="section-card__header">
        <h3>Registro de Asistencia</h3>
      </div>
      {!data ? <div className="loading-container"><span className="spinner"></span> Cargando...</div> : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante RUT</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map(a => (
                <tr key={a.id}>
                  <td>{a.fechaClase}</td>
                  <td>{a.estudianteId}</td>
                  <td>
                    <span className={`status-badge ${a.estado === 'PRESENTE' ? 'status-success' : 'status-error'}`}>
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan="3" className="empty-state">No hay registros</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
