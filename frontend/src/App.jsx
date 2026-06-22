import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Asistencia from './pages/Asistencia';
import Horarios from './pages/Horarios';
import Notificaciones from './pages/Notificaciones';
import Calificaciones from './pages/Calificaciones';
import Pagos from './pages/Pagos';
import Mensajes from './pages/Mensajes';
import NuevoMensaje from './pages/NuevoMensaje';
import VerMensaje from './pages/VerMensaje';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      {/* Protected Routes inside Layout */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/asistencia" element={<ProtectedRoute><Asistencia /></ProtectedRoute>} />
      <Route path="/horarios" element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
      <Route path="/notificaciones" element={<ProtectedRoute><Notificaciones /></ProtectedRoute>} />
      <Route path="/calificaciones" element={<ProtectedRoute><Calificaciones /></ProtectedRoute>} />
      <Route path="/pagos" element={<ProtectedRoute><Pagos /></ProtectedRoute>} />
      <Route path="/mensajes" element={<ProtectedRoute><Mensajes /></ProtectedRoute>} />
      <Route path="/mensajes/nuevo" element={<ProtectedRoute><NuevoMensaje /></ProtectedRoute>} />
      <Route path="/mensajes/:id" element={<ProtectedRoute><VerMensaje /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
