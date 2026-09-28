import { api } from './api';
import { RenewableGeneration } from '../types';

export interface RenewableSummaryData {
  total_generated: number;
  grid_consumed: number;
  renewable_percentage: number;
  by_source: {
    Solar: number;
    Wind: number;
    'Other Renewable': number;
  };
}

export const renewableService = {
  async getAll(params?: { facility_id?: string; source_type?: string }): Promise<RenewableGeneration[]> {
    const res = await api.get('/renewable/', { params });
    return res.data;
  },

  async addRecord(data: Partial<RenewableGeneration>): Promise<RenewableGeneration> {
    const res = await api.post('/renewable/', data);
    return res.data;
  },

  async getSummary(facilityId?: string): Promise<RenewableSummaryData> {
    const res = await api.get('/renewable/summary/', { params: { facility_id: facilityId } });
    return res.data;
  }
};
