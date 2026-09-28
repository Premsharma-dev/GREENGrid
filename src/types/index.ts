export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  assigned_facility_id?: string | null;
  created_at: string;
}

export type BuildingType = 'Office' | 'College' | 'Hospital' | 'Factory' | 'Warehouse' | 'Residential' | 'Other';
export type FacilityStatus = 'Active' | 'Inactive';

export interface Facility {
  id: string;
  name: string;
  location: string;
  building_type: BuildingType;
  area: number; // in sq ft or sq meters
  description: string;
  status: FacilityStatus;
  created_at: string;
  updated_at: string;
  // Computed / aggregated fields for UI
  meter_count?: number;
  current_consumption?: number;
  monthly_consumption?: number;
  active_alerts_count?: number;
}

export type MeterType = 'Electricity' | 'Solar' | 'Wind' | 'Generator';
export type MeterUnit = 'kWh' | 'kW';

export interface Meter {
  id: string;
  facility_id: string;
  facility_name?: string;
  meter_number: string;
  meter_type: MeterType;
  unit: MeterUnit;
  installation_date: string;
  capacity: number; // in kW
  status: 'Active' | 'Inactive';
  created_at: string;
  last_reading?: number;
  last_reading_date?: string;
}

export interface EnergyReading {
  id: string;
  meter_id: string;
  meter_number?: string;
  facility_id?: string;
  facility_name?: string;
  reading_date: string; // YYYY-MM-DD
  meter_reading: number;
  consumption: number;
  peak_consumption: number;
  off_peak_consumption: number;
  created_at: string;
}

export interface Tariff {
  id: string;
  name: string;
  rate_per_kwh: number;
  fixed_charge: number;
  tax_percentage: number;
  effective_from: string;
  effective_to?: string | null;
  active: boolean;
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue';

export interface Bill {
  id: string;
  facility_id: string;
  facility_name?: string;
  billing_month: string; // YYYY-MM
  units_consumed: number;
  rate_per_kwh: number;
  energy_charge: number;
  fixed_charge: number;
  tax: number;
  total_amount: number;
  payment_status: PaymentStatus;
  generated_at: string;
  due_date: string;
}

export type RenewableSourceType = 'Solar' | 'Wind' | 'Other Renewable';

export interface RenewableGeneration {
  id: string;
  facility_id: string;
  facility_name?: string;
  source_type: RenewableSourceType;
  generation_date: string; // YYYY-MM-DD
  energy_generated: number; // kWh
  capacity: number; // kW
  created_at: string;
}

export type AlertType = 'HIGH_CONSUMPTION' | 'UNUSUAL_NIGHT_USAGE' | 'RENEWABLE_DROP' | 'HIGH_MONTHLY_COST' | 'METER_ANOMALY';
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'New' | 'Read' | 'Resolved';

export interface Alert {
  id: string;
  facility_id: string;
  facility_name?: string;
  alert_type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string | null;
}

export interface Recommendation {
  id: string;
  facility_id?: string;
  facility_name?: string;
  title: string;
  description: string;
  recommendation_type: string;
  priority: 'Low' | 'Medium' | 'High';
  potential_savings?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_consumption: number;
  today_consumption: number;
  estimated_current_bill: number;
  renewable_generated: number;
  renewable_percentage: number;
  active_facilities_count: number;
  active_meters_count: number;
  active_alerts_count: number;
  trend_change_percentage: number;
}
