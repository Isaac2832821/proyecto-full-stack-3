import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../context/AuthContext';

import Layout from './Layout';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const mockUser = { rut: '12345678-9', rol: 'ADMIN', nombre: 'Admin', apellido: 'User' };

describe('Smoke Tests for Components', () => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: mockUser, logout: vi.fn() });

  const renderWithRouter = (ui) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renderiza Layout con Navbar y Sidebar', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="child">Test Child</div>
      </Layout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renderiza Navbar', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText(/Panel de Gestión/i)).toBeInTheDocument();
  });

  it('renderiza Sidebar', () => {
    renderWithRouter(<Sidebar mobileOpen={true} setMobileOpen={vi.fn()} />);
    expect(screen.getByText(/Principal/i)).toBeInTheDocument();
  });
});
