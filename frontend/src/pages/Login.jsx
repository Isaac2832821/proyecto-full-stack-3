import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await login(rut, password);
      // Navigation is handled automatically by App.jsx since user state changes
    } catch (err) {
      setError(err?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <video className="login-video" autoPlay muted loop playsInline>
        <source src="/assets/fondo-login.mp4" type="video/mp4" />
      </video>

      <div className="login-page__overlay"></div>

      <div className="login-card visible">
        <div className="login-card__logo">
          <img src="/assets/logo.png" alt="Logo Colegio" />
          <h1>Iniciar Sesión</h1>
          <p>Colegio Bernardo O'Higgins</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="rut">RUT</label>
            <input 
              type="text" 
              id="rut" 
              placeholder="Ej: 11111111-1" 
              required 
              value={rut}
              onChange={(e) => setRut(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Ingrese su contraseña" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
