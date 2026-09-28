import { api } from './api';

export const reportService = {
  async getEnergyReport(params?: { facility_id?: string; start_date?: string; end_date?: string }): Promise<any> {
    const res = await api.get('/reports/energy/', { params });
    return res.data;
  },

  async getFacilityComparison(): Promise<any[]> {
    const res = await api.get('/reports/facility-comparison/');
    return res.data;
  },

  getExportUrl(type: 'readings' | 'facilities' | 'bills' | 'renewable', facilityId?: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const params = new URLSearchParams({ type });
    if (facilityId && facilityId !== 'all') {
      params.append('facility_id', facilityId);
    }
    return `${baseUrl}/reports/export-csv/?${params.toString()}`;
  }
};

export const userService = {
  async getAll(): Promise<any[]> {
    const res = await api.get('/users/');
    return res.data;
  },

  async create(data: any): Promise<any> {
    const res = await api.post('/users/', data);
    return res.data;
  },

  async update(id: string, data: any): Promise<any> {
    const res = await api.put(`/users/${id}/`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}/`);
  }
};
