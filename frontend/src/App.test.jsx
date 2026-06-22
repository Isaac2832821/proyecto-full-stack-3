import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import * as AuthContext from './context/AuthContext';

vi.mock('./pages/Login', () => ({
  default: () => <div data-testid="login-mock">Login Mock</div>
}));

vi.mock('./components/Layout', () => ({
  default: ({children}) => <div data-testid="layout-mock">{children}</div>
}));

vi.mock('./pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-mock">Dashboard Mock</div>
}));

describe('App Component', () => {
  it('debería renderizar la pantalla de Login si no hay token', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null });
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-mock')).toBeInTheDocument();
  });

  it('debería renderizar la app principal si hay usuario', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { rut: '123', rol: 'ADMIN' } });
    
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('layout-mock')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-mock')).toBeInTheDocument();
  });
});
