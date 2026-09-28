import { api } from './api';
import { Alert, Recommendation } from '../types';

export const alertService = {
  async getAlerts(params?: { facility_id?: string; severity?: string; status?: string }): Promise<Alert[]> {
    const res = await api.get('/alerts/', { params });
    return res.data;
  },

  async markRead(id: string): Promise<Alert> {
    const res = await api.put(`/alerts/${id}/read/`);
    return res.data;
  },

  async markResolved(id: string): Promise<Alert> {
    const res = await api.put(`/alerts/${id}/resolve/`);
    return res.data;
  },

  async getRecommendations(facilityId?: string): Promise<Recommendation[]> {
    const res = await api.get('/recommendations/', { params: { facility_id: facilityId } });
    return res.data;
  }
};
