import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.rol === 'DOCENTE') {
          const notas = await api('/calificaciones/mis-registros').catch(()=>[]);
          const asistencia = await api('/asistencia/mis-registros').catch(()=>[]);
          setData({ loading: false, notas, asistencia });
        } else if (user.rol === 'ESTUDIANTE') {
          const bffData = await api(`/bff/dashboard`).catch(()=>null);
          setData({ loading: false, ...bffData });
        } else {
          setData({ loading: false });
        }
      } catch (err) {
        setData({ loading: false, error: 'No se pudo cargar la información' });
      }
    };
    fetchData();
  }, [user]);

  if (data.loading) return <div className="loading-container"><span className="spinner spinner-lg"></span> Cargando datos...</div>;

  return (
    <div>
      <section className="welcome-section">
        <h2>Hola, {user.nombre} 👋</h2>
        <p>Panel de gestión — {user.rol}</p>
      </section>

      {user.rol === 'ESTUDIANTE' && data.promedioGeneral !== undefined && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label">Promedio General</div>
            <div className={`stat-card__value ${data.promedioGeneral >= 4 ? 'text-success' : 'text-error'}`}>{data.promedioGeneral}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">% Asistencia</div>
            <div className="stat-card__value text-primary">{data.porcentajeAsistencia}%</div>
          </div>
        </div>
      )}

      {user.rol === 'DOCENTE' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__label">Calificaciones Registradas</div>
            <div className="stat-card__value text-primary">{data.notas?.length || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Registros de Asistencia</div>
            <div className="stat-card__value text-primary">{data.asistencia?.length || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}
