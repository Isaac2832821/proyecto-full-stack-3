import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Notificaciones() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Si hubiese endpoint GET /notificaciones/usuario/{id} en el backend
    // Por ahora simulamos que no hay datos ya que la arquitectura de mensajería (RabbitMQ) 
    // se maneja del backend a la BD, pero no tenemos endpoint en el API Gateway o lo hacemos manual
    api('/notificaciones').then(setData).catch(() => setData([]));
  }, [user]);

  return (
    <div className="section-card">
      <div className="section-card__header">
        <h3>Bandeja de Notificaciones</h3>
      </div>
      {!data ? <div className="loading-container"><span className="spinner"></span> Cargando...</div> : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {data.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <div className="empty-state__title">No tienes notificaciones nuevas</div>
            </div>
          )}
          {data.map(n => (
            <div key={n.id} className="hijo-card" style={{ display: 'block', borderLeft: '4px solid var(--accent)' }}>
              <div className="stat-card__label" style={{ marginBottom: '0.25rem' }}>{n.fechaEnvio || 'Reciente'}</div>
              <div className="stat-card__value" style={{ fontSize: '1rem' }}>{n.mensaje}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
