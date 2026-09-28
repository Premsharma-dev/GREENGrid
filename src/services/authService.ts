import { api } from './api';
import { User } from '../types';

export const authService = {
  async login(username: string, password?: string): Promise<{ access: string; refresh: string; user: User }> {
    const res = await api.post('/auth/login/', { username, password });
    const { access, refresh, user } = res.data;
    localStorage.setItem('greengrid_access_token', access);
    localStorage.setItem('greengrid_refresh_token', refresh);
    localStorage.setItem('greengrid_user', JSON.stringify(user));
    return res.data;
  },

  async register(userData: any): Promise<any> {
    const res = await api.post('/auth/register/', userData);
    const { access, refresh, user } = res.data;
    localStorage.setItem('greengrid_access_token', access);
    localStorage.setItem('greengrid_refresh_token', refresh);
    localStorage.setItem('greengrid_user', JSON.stringify(user));
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me/');
    localStorage.setItem('greengrid_user', JSON.stringify(res.data));
    return res.data;
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('greengrid_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('greengrid_access_token');
  },

  logout(): void {
    localStorage.removeItem('greengrid_access_token');
    localStorage.removeItem('greengrid_refresh_token');
    localStorage.removeItem('greengrid_user');
  }
};
