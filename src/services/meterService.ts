import { api } from './api';
import { Meter } from '../types';

export const meterService = {
  async getAll(params?: { facility_id?: string; meter_type?: string; search?: string }): Promise<Meter[]> {
    const res = await api.get('/meters/', { params });
    return res.data;
  },

  async getById(id: string): Promise<Meter> {
    const res = await api.get(`/meters/${id}/`);
    return res.data;
  },

  async create(data: Partial<Meter>): Promise<Meter> {
    const res = await api.post('/meters/', data);
    return res.data;
  },

  async update(id: string, data: Partial<Meter>): Promise<Meter> {
    const res = await api.put(`/meters/${id}/`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/meters/${id}/`);
  }
};
