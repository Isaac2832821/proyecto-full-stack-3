import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../context/AuthContext';

import Dashboard from './Dashboard';
import Asistencia from './Asistencia';
import Calificaciones from './Calificaciones';
import Horarios from './Horarios';
import Notificaciones from './Notificaciones';
import Pagos from './Pagos';

// Mock del API global
vi.mock('../services/api', () => ({
  api: vi.fn().mockResolvedValue([])
}));

const mockUser = { rut: '12345678-9', rol: 'ADMIN', nombre: 'Admin User' };

describe('Smoke Tests for Pages', () => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: mockUser });

  const renderWithRouter = (ui) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renderiza Dashboard', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByText(/Hola, Admin/i)).toBeInTheDocument();
  });

  it('renderiza Asistencia', () => {
    renderWithRouter(<Asistencia />);
    expect(screen.getByText(/Registro de Asistencia/i)).toBeInTheDocument();
  });

  it('renderiza Calificaciones', () => {
    renderWithRouter(<Calificaciones />);
    expect(screen.getByText(/Calificaciones/i)).toBeInTheDocument();
  });

  it('renderiza Horarios', () => {
    renderWithRouter(<Horarios />);
    expect(screen.getByText(/Calendario Académico/i)).toBeInTheDocument();
  });

  it('renderiza Notificaciones', () => {
    renderWithRouter(<Notificaciones />);
    expect(screen.getByText(/Notificaciones/i)).toBeInTheDocument();
  });

  it('renderiza Pagos', () => {
    renderWithRouter(<Pagos />);
    expect(screen.getAllByText(/Pagos/i)[0]).toBeInTheDocument();
  });
});
