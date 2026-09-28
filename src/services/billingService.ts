import { api } from './api';
import { Bill, Tariff } from '../types';

export const billingService = {
  async getBills(params?: { facility_id?: string; month?: string; status?: string }): Promise<Bill[]> {
    const res = await api.get('/billing/', { params });
    return res.data;
  },

  async getBillById(id: string): Promise<Bill> {
    const res = await api.get(`/billing/${id}/`);
    return res.data;
  },

  async generateBill(facilityId: string, billingMonth: string): Promise<Bill> {
    const res = await api.post('/billing/generate/', { facility_id: facilityId, billing_month: billingMonth });
    return res.data;
  },

  async updatePaymentStatus(id: string, paymentStatus: 'Pending' | 'Paid' | 'Overdue'): Promise<Bill> {
    const res = await api.put(`/billing/${id}/status/`, { payment_status: paymentStatus });
    return res.data;
  },

  async getTariffs(): Promise<Tariff[]> {
    const res = await api.get('/tariffs/');
    return res.data;
  },

  async updateTariff(id: string, data: Partial<Tariff>): Promise<Tariff> {
    const res = await api.put(`/tariffs/${id}/`, data);
    return res.data;
  }
};
