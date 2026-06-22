import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  const isEstudiante = user.rol === 'ESTUDIANTE';
  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  return (
    <aside className={isEstudiante ? "sidebar lms-sidebar" : "sidebar"}>
      <div className={isEstudiante ? "lms-sidebar__header" : "sidebar__brand"}>
        <div className="sidebar__logo">
          <img src="/assets/logo.png" alt="Logo" className={isEstudiante ? "logo-estudiante" : "logo-default"} />
          <div>
            <h2>
              {isEstudiante ? 'Campus Virtual' : "Colegio Bernardo O'Higgins"}
            </h2>
            <p>
              {isEstudiante ? "Colegio B. O'Higgins" : 'Sistema de Gestión'}
            </p>
          </div>
        </div>
      </div>

      <nav className={`sidebar__nav ${isEstudiante ? 'nav-estudiante' : ''}`}>
        {isEstudiante ? (
          <>
            <NavLink to="/dashboard" className="sidebar__link lms-link"><span className="lms-link__icon">🏠</span><span className="lms-link__label">Actividad</span></NavLink>
            <NavLink to="/horarios" className="sidebar__link lms-link"><span className="lms-link__icon">📅</span><span className="lms-link__label">Calendario</span></NavLink>
            <NavLink to="/calificaciones" className="sidebar__link lms-link"><span className="lms-link__icon">📝</span><span className="lms-link__label">Calificaciones</span></NavLink>
            <NavLink to="/asistencia" className="sidebar__link lms-link"><span className="lms-link__icon">📋</span><span className="lms-link__label">Asistencia</span></NavLink>
            <NavLink to="/notificaciones" className="sidebar__link lms-link"><span className="lms-link__icon">🔔</span><span className="lms-link__label">Notificaciones</span></NavLink>
            <NavLink to="/mensajes" className="sidebar__link lms-link"><span className="lms-link__icon">✉️</span><span className="lms-link__label">Mensajes</span></NavLink>
          </>
        ) : (
          <>
            <div className="sidebar__section-label">Principal</div>
            <NavLink to="/dashboard" className="sidebar__link"><span className="sidebar__link-icon">📊</span> Dashboard</NavLink>
            
            {user.rol === 'DOCENTE' && (
              <>
                <div className="sidebar__section-label">Docencia</div>
                <NavLink to="/calificaciones" className="sidebar__link"><span className="sidebar__link-icon">📝</span> Calificaciones</NavLink>
                <NavLink to="/asistencia" className="sidebar__link"><span className="sidebar__link-icon">📋</span> Asistencia</NavLink>
                <NavLink to="/notificaciones" className="sidebar__link"><span className="sidebar__link-icon">🔔</span> Notificaciones</NavLink>
                <NavLink to="/mensajes" className="sidebar__link"><span className="sidebar__link-icon">✉️</span> Mensajes</NavLink>
              </>
            )}

            {user.rol === 'APODERADO' && (
              <>
                <div className="sidebar__section-label">Familia</div>
                <NavLink to="/calificaciones" className="sidebar__link"><span className="sidebar__link-icon">📝</span> Calificaciones</NavLink>
                <NavLink to="/pagos" className="sidebar__link"><span className="sidebar__link-icon">💳</span> Matrícula y Pagos</NavLink>
                <NavLink to="/notificaciones" className="sidebar__link"><span className="sidebar__link-icon">🔔</span> Notificaciones</NavLink>
                <NavLink to="/mensajes" className="sidebar__link"><span className="sidebar__link-icon">✉️</span> Mensajes</NavLink>
              </>
            )}

            {user.rol === 'ADMIN' && (
              <>
                <div className="sidebar__section-label">Administración</div>
                <NavLink to="/pagos" className="sidebar__link"><span className="sidebar__link-icon">💰</span> Gestión de Cobros</NavLink>
                <NavLink to="/notificaciones" className="sidebar__link"><span className="sidebar__link-icon">📢</span> Panel de Avisos</NavLink>
                <NavLink to="/mensajes" className="sidebar__link"><span className="sidebar__link-icon">✉️</span> Mensajes</NavLink>
              </>
            )}
          </>
        )}
      </nav>

      <div className="sidebar__footer">
        {!isEstudiante && (
          <div className="sidebar__user-info">
            <div className="sidebar__avatar">{initials}</div>
            <div className="sidebar__user-details">
              <div className="sidebar__user-name">{user.nombre} {user.apellido}</div>
              <div className="sidebar__user-role">{user.rol}</div>
            </div>
          </div>
        )}
        <button className={isEstudiante ? "lms-logout-btn" : "btn btn-secondary logout-btn"} onClick={logout}>
          {isEstudiante ? <><span className="logout-icon">⏻</span> Cerrar sesión</> : '🚪 Cerrar Sesión'}
        </button>
      </div>
    </aside>
  );
}
