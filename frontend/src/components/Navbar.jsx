import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Actividad';
      case '/asistencia': return 'Asistencia';
      case '/horarios': return 'Calendario de Horarios';
      case '/notificaciones': return 'Notificaciones';
      case '/calificaciones': return 'Calificaciones';
      default: return 'Panel de Gestión';
    }
  };

  if (!user) return null;

  return (
    <nav className="topbar">
      <h1 className="topbar__title">{getPageTitle(location.pathname)}</h1>
      <div className="topbar__user">
        <span className="topbar__badge">{user.rol}</span>
        <button className="btn-logout" onClick={logout}>Cerrar Sesión</button>
      </div>
    </nav>
  );
}
