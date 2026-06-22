import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { enviarMensaje } from '../firebase';

export default function NuevoMensaje() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  
  const [paraRut, setParaRut] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  useEffect(() => {
    api('/usuarios/destinatarios')
      .then(data => {
        setDestinatarios(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setError('Error al cargar destinatarios');
        setLoading(false);
      });
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!paraRut || !asunto || !cuerpo) {
      setError('Completa todos los campos');
      return;
    }

    const dest = destinatarios.find(d => d.rut === paraRut);
    if (!dest) return;

    setEnviando(true);
    setError('');

    try {
      await enviarMensaje({
        deRut: user.rut,
        deNombre: `${user.nombre} ${user.apellido}`,
        deRol: user.rol,
        paraRut: dest.rut,
        paraNombre: `${dest.nombre} ${dest.apellido}`,
        paraRol: dest.rol,
        asunto,
        cuerpo
      });
      navigate('/mensajes');
    } catch (e) {
      console.error(e);
      setError('Error al enviar mensaje: ' + e.message);
      setEnviando(false);
    }
  };

  return (
    <div className="section-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/mensajes')} style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}>
          &larr; Volver
        </button>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Nuevo mensaje</h3>
      </div>

      {loading ? (
        <div className="loading-container"><span className="spinner spinner-lg"></span></div>
      ) : (
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="form-group">
            <label>Para</label>
            <select value={paraRut} onChange={e => setParaRut(e.target.value)} disabled={enviando} required>
              <option value="" disabled>Selecciona destinatario...</option>
              {destinatarios.map(u => (
                <option key={u.rut} value={u.rut}>
                  {u.nombre} {u.apellido} ({u.rol})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Asunto</label>
            <input 
              type="text" 
              value={asunto} 
              onChange={e => setAsunto(e.target.value)} 
              placeholder="Escribe el asunto..." 
              maxLength="120" 
              disabled={enviando}
              required
            />
          </div>

          <div className="form-group">
            <label>Mensaje</label>
            <textarea 
              value={cuerpo} 
              onChange={e => setCuerpo(e.target.value)} 
              rows="6" 
              placeholder="Escribe tu mensaje..." 
              style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', fontFamily: 'var(--font)', fontSize: '0.875rem', resize: 'vertical' }}
              disabled={enviando}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/mensajes')} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
