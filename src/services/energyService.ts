import { api } from './api';
import { EnergyReading, DashboardSummary } from '../types';

export const energyService = {
  async getSummary(facilityId?: string): Promise<DashboardSummary> {
    const res = await api.get('/energy/summary/', { params: { facility_id: facilityId } });
    return res.data;
  },

  async getReadings(params?: { facility_id?: string; meter_id?: string; start_date?: string; end_date?: string; limit?: number }): Promise<EnergyReading[]> {
    const res = await api.get('/energy/readings/', { params });
    return res.data;
  },

  async addReading(payload: { meter_id: string; reading_date: string; meter_reading: number; allow_reset?: boolean }): Promise<{ reading: EnergyReading; alertGenerated?: any }> {
    const res = await api.post('/energy/readings/', payload);
    return res.data;
  },

  async getDaily(params?: { facility_id?: string; days?: number }): Promise<Array<{ date: string; consumption: number; peak: number; off_peak: number; cost: number }>> {
    const res = await api.get('/energy/daily/', { params });
    return res.data;
  },

  async getMonthly(params?: { facility_id?: string }): Promise<Array<{ month: string; consumption: number; cost: number }>> {
    const res = await api.get('/energy/monthly/', { params });
    return res.data;
  },

  async importCsv(csvContent: string): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
    const res = await api.post('/csv/import-readings/', { csv_content: csvContent });
    return res.data;
  }
};
