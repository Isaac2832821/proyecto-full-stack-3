import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marcarLeido, enviarMensaje } from '../firebase';

export default function VerMensaje() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const m = location.state?.mensaje;
  const [replyBody, setReplyBody] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!m) {
      navigate('/mensajes');
      return;
    }
    // Marcar como leído si somos el destinatario y no estaba leído
    if (m.paraRut === user.rut && !m.leido) {
      marcarLeido(m.id).catch(console.error);
    }
  }, [m, navigate, user.rut]);

  if (!m) return null;

  const fecha = m.fecha && m.fecha.toDate ? m.fecha.toDate() : new Date();
  const fechaStr = fecha.toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });
  
  const esRecibido = m.paraRut === user.rut;
  const otroNombre = esRecibido ? m.deNombre : m.paraNombre;
  const otroRol = esRecibido ? m.deRol : m.paraRol;
  const initials = otroNombre ? otroNombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '??';

  const handleReply = async () => {
    if (!replyBody.trim()) {
      setError('Escribe una respuesta');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      await enviarMensaje({
        deRut: user.rut,
        deNombre: `${user.nombre} ${user.apellido}`,
        deRol: user.rol,
        paraRut: m.deRut,
        paraNombre: m.deNombre,
        paraRol: m.deRol,
        asunto: `Re: ${m.asunto}`,
        cuerpo: replyBody
      });
      navigate('/mensajes');
    } catch (e) {
      console.error(e);
      setError('Error al enviar respuesta: ' + e.message);
      setEnviando(false);
    }
  };

  return (
    <div className="section-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/mensajes')} 
        style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem', marginBottom: '1.5rem' }}
      >
        &larr; Volver a bandeja
      </button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--accent-light)', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>
                {otroNombre}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {otroRol} - {fechaStr}
              </div>
            </div>
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{m.asunto}</h3>
        </div>
        <div style={{ padding: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {m.cuerpo}
        </div>
      </div>

      {esRecibido && (
        <div style={{ marginTop: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>Responder</h4>
          
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <textarea 
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              rows="4" 
              placeholder="Escribe tu respuesta..." 
              style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', fontFamily: 'var(--font)', fontSize: '0.875rem', resize: 'vertical' }}
              disabled={enviando}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleReply} style={{ fontSize: '0.8125rem' }} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar respuesta'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
