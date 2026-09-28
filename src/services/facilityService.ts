import { api } from './api';
import { Facility } from '../types';

export const facilityService = {
  async getAll(params?: { search?: string; location?: string; status?: string }): Promise<Facility[]> {
    const res = await api.get('/facilities/', { params });
    return res.data;
  },

  async getById(id: string): Promise<Facility> {
    const res = await api.get(`/facilities/${id}/`);
    return res.data;
  },

  async create(data: Partial<Facility>): Promise<Facility> {
    const res = await api.post('/facilities/', data);
    return res.data;
  },

  async update(id: string, data: Partial<Facility>): Promise<Facility> {
    const res = await api.put(`/facilities/${id}/`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/facilities/${id}/`);
  }
};
