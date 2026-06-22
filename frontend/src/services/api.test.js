import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, login, logout } from './api';

describe('API Service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  it('debería realizar una petición con el token JWT si existe', async () => {
    localStorage.setItem('token', 'fake-jwt-token');
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const data = await api('/test');
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-jwt-token'
        })
      })
    );
    expect(data.success).toBe(true);
  });

  it('debería lanzar error si la API retorna ok: false', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' })
    });

    await expect(api('/error')).rejects.toThrow();
  });
});
