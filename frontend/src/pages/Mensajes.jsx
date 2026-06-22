import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { escucharMensajesRecibidos, escucharMensajesEnviados } from '../firebase';

export default function Mensajes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('recibidos');
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};
    if (tab === 'recibidos') {
      unsubscribe = escucharMensajesRecibidos(user.rut, (data) => {
        setMensajes(data);
        setLoading(false);
      });
    } else {
      unsubscribe = escucharMensajesEnviados(user.rut, (data) => {
        setMensajes(data);
        setLoading(false);
      });
    }
    return () => unsubscribe();
  }, [tab, user.rut]);

  const unreadCount = mensajes.filter(m => !m.leido).length;

  return (
    <div className="section-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="section-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Bandeja de entrada</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', margin: 0 }}>
            {loading ? 'Cargando...' : tab === 'recibidos' ? `${unreadCount} sin leer - ${mensajes.length} total` : `${mensajes.length} enviados`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/mensajes/nuevo')} style={{ fontSize: '0.8125rem' }}>
          Nuevo mensaje
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          className={`btn ${tab === 'recibidos' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setTab('recibidos')}
          style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}
        >
          Recibidos
        </button>
        <button 
          className={`btn ${tab === 'enviados' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setTab('enviados')}
          style={{ fontSize: '0.75rem', padding: '0.4rem 1rem' }}
        >
          Enviados
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {loading ? (
          <div className="loading-container"><span className="spinner"></span></div>
        ) : mensajes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.3 }}>📬</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>No hay mensajes</div>
          </div>
        ) : (
          mensajes.map(m => {
            const isR = tab === 'recibidos';
            const nombre = isR ? m.deNombre : m.paraNombre;
            const initials = nombre ? nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??';
            const fecha = m.fecha && m.fecha.toDate ? m.fecha.toDate().toLocaleDateString('es-CL') : 'Ahora';
            const unread = isR && !m.leido;

            return (
              <div 
                key={m.id} 
                onClick={() => navigate(`/mensajes/${m.id}`, { state: { mensaje: m, tab } })}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: `1px solid ${unread ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`, 
                  borderLeft: unread ? '3px solid var(--accent)' : '',
                  borderRadius: 'var(--radius-sm)', 
                  padding: '1.25rem 1.5rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'flex-start',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-light)', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: unread ? 700 : 500, fontSize: '0.875rem', color: 'var(--text)' }}>
                      {isR ? 'De: ' : 'Para: '} {nombre}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {fecha}
                    </span>
                  </div>
                  <div style={{ fontWeight: unread ? 600 : 400, fontSize: '0.8125rem', color: unread ? 'var(--text)' : 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {m.asunto}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.cuerpo}
                  </div>
                </div>
                {unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '4px' }}></div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
