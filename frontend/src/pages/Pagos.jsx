import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Pagos() {
  const { user } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchPagos = async () => {
    try {
      let data = [];
      if (user.rol === 'APODERADO') {
        data = await api(`/pagos/apoderado/${user.rut}`);
      } else if (user.rol === 'ADMIN') {
        data = await api('/pagos');
      }
      setPagos(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, [user]);

  const emitirCobro = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      await api('/pagos', {
        method: 'POST',
        body: JSON.stringify({
          apoderadoId: '11111111-1', // Apoderado Demo
          monto: 150000.0,
          concepto: 'Matrícula Semestre 1'
        })
      });
      setSuccessMsg('Cobro emitido exitosamente.');
      fetchPagos();
    } catch (err) {
      alert('Error emitiendo cobro');
    } finally {
      setLoading(false);
    }
  };

  const pagarDeuda = async (id) => {
    setLoading(true);
    try {
      await api(`/pagos/${id}/pagar`, { method: 'POST' });
      setSuccessMsg('Pago realizado con éxito.');
      fetchPagos();
    } catch (err) {
      alert('Error al pagar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card">
      <div className="section-card__header">
        <h3>Gestión de Pagos</h3>
      </div>
      
      {successMsg && (
        <div className="alert alert-success">
          {successMsg}
        </div>
      )}

      {user.rol === 'ADMIN' && (
        <div style={{ marginBottom: '2rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={emitirCobro} 
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Emitir Cobro de Matrícula General'}
          </button>
        </div>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map(p => (
              <tr key={p.id}>
                <td>{p.concepto}</td>
                <td style={{ fontWeight: 'bold' }}>${p.monto.toLocaleString('es-CL')}</td>
                <td>
                  <span className={`status-badge ${p.estado === 'PAGADO' ? 'status-success' : 'status-error'}`}>
                    {p.estado}
                  </span>
                </td>
                <td>
                  {p.estado === 'PENDIENTE' && user.rol === 'APODERADO' ? (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => pagarDeuda(p.id)}
                      disabled={loading}
                      style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
                    >
                      Pagar
                    </button>
                  ) : (
                    <span className="text-muted">
                      {p.estado === 'PAGADO' ? p.fechaPago.substring(0,10) : '-'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {pagos.length === 0 && <tr><td colSpan="4" className="empty-state">No hay registros de pagos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
