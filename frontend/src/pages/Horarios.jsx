import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Horarios() {
  const [horarios, setHorarios] = useState(null);

  useEffect(() => {
    api('/horarios').then(setHorarios).catch(()=>setHorarios([]));
  }, []);

  return (
    <div className="section-card">
      <div className="section-card__header">
        <h3>Calendario Académico</h3>
      </div>
      {!horarios ? <div className="loading-container"><span className="spinner"></span> Cargando...</div> : (
        <div className="stats-grid">
          {horarios.map(h => (
            <div key={h.id} className="stat-card">
              <div className="stat-card__value" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{h.asignaturaNombre}</div>
              <div className="stat-card__label">Día: {h.diaSemana}</div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>Sala: {h.sala} | {h.horaInicio} - {h.horaFin}</div>
            </div>
          ))}
          {horarios.length === 0 && <p className="empty-state">No hay horarios programados.</p>}
        </div>
      )}
    </div>
  );
}
