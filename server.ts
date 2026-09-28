import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import { db } from './server/db.ts';
import { UserRole } from './src/types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'greengrid-jwt-production-secret-token-key-2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Authentication Helpers & Middleware
interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  assigned_facility_id?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

function generateTokens(payload: AuthTokenPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: '7d' });
  return { access: accessToken, refresh: refreshToken };
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ detail: 'Given token not valid for any token type' });
    }
    req.user = user as AuthTokenPayload;
    next();
  });
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        detail: `You do not have permission to perform this action. Required role: ${allowedRoles.join(' or ')}.`
      });
    }
    next();
  };
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS (Django REST Framework compatible)
// -------------------------------------------------------------

// POST /api/auth/login/
app.post('/api/auth/login/', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or email is required' });
  }

  // Find user by username or email
  const user = db.getUserByUsernameOrEmail(username);
  if (!user || !user.is_active) {
    return res.status(401).json({ detail: 'No active account found with the given credentials' });
  }

  // In demo environment, passwords "admin123", "manager123", "viewer123" or matching role name work
  const tokenPayload: AuthTokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    assigned_facility_id: user.assigned_facility_id,
  };

  const tokens = generateTokens(tokenPayload);

  return res.json({
    access: tokens.access,
    refresh: tokens.refresh,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      assigned_facility_id: user.assigned_facility_id,
    }
  });
});

// POST /api/auth/register/
app.post('/api/auth/register/', (req: Request, res: Response) => {
  const { username, email, password, first_name, last_name, role } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  const existing = db.getUserByUsernameOrEmail(username) || db.getUserByUsernameOrEmail(email);
  if (existing) {
    return res.status(400).json({ detail: 'A user with that username or email already exists.' });
  }

  const newUser = db.createUser({
    username,
    email,
    first_name: first_name || '',
    last_name: last_name || '',
    role: (role as UserRole) || 'VIEWER',
    is_active: true,
  });

  const tokens = generateTokens({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
  });

  return res.status(201).json({
    access: tokens.access,
    refresh: tokens.refresh,
    user: newUser,
  });
});

// POST /api/auth/refresh/
app.post('/api/auth/refresh/', (req: Request, res: Response) => {
  const { refresh } = req.body;
  if (!refresh) {
    return res.status(400).json({ detail: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refresh, JWT_SECRET) as { id: string };
    const user = db.getUserById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ detail: 'User no longer active' });
    }

    const newAccess = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        assigned_facility_id: user.assigned_facility_id,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ access: newAccess });
  } catch (err) {
    return res.status(401).json({ detail: 'Token is invalid or expired' });
  }
});

// GET /api/auth/me/
app.get('/api/auth/me/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }
  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    assigned_facility_id: user.assigned_facility_id,
  });
});

// -------------------------------------------------------------
// 2. DASHBOARD KPI & SUMMARY
// -------------------------------------------------------------
app.get('/api/energy/summary/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  let facilityId = req.query.facility_id as string | undefined;

  // If user is Facility Manager or Viewer with assigned facility, restrict default
  if (req.user?.role !== 'ADMIN' && req.user?.assigned_facility_id) {
    facilityId = req.user.assigned_facility_id;
  }

  const summary = db.getDashboardSummary(facilityId);
  return res.json(summary);
});

// -------------------------------------------------------------
// 3. FACILITIES ENDPOINTS
// -------------------------------------------------------------
app.get('/api/facilities/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const search = req.query.search as string;
  const location = req.query.location as string;
  const status = req.query.status as string;

  let facilities = db.getFacilities(search, location, status);

  // If user is Manager or Viewer with assigned facility, highlight or filter if strict
  if (req.user?.role === 'MANAGER' && req.user.assigned_facility_id) {
    // Return all facilities but allow filtering by assigned
    const assignedId = req.user.assigned_facility_id;
    facilities = facilities.map(f => ({ ...f, is_assigned: f.id === assignedId }));
  }

  return res.json(facilities);
});

app.get('/api/facilities/:id/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const fac = db.getFacilityById(req.params.id);
  if (!fac) {
    return res.status(404).json({ detail: 'Facility not found.' });
  }
  return res.json(fac);
});

app.post('/api/facilities/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, location, building_type, area, description, status } = req.body;
  if (!name || !location || !building_type) {
    return res.status(400).json({ error: 'Name, location, and building type are required fields.' });
  }

  const newFac = db.createFacility({
    name,
    location,
    building_type,
    area: Number(area) || 10000,
    description: description || '',
    status: status || 'Active',
  });

  return res.status(201).json(newFac);
});

app.put('/api/facilities/:id/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateFacility(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ detail: 'Facility not found.' });
  }
  return res.json(updated);
});

app.delete('/api/facilities/:id/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteFacility(req.params.id);
  if (!success) {
    return res.status(404).json({ detail: 'Facility not found.' });
  }
  return res.status(204).send();
});

// -------------------------------------------------------------
// 4. METERS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/meters/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const meterType = req.query.meter_type as string;
  const search = req.query.search as string;

  const meters = db.getMeters(facilityId, meterType, search);
  return res.json(meters);
});

app.get('/api/meters/:id/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const meter = db.getMeterById(req.params.id);
  if (!meter) {
    return res.status(404).json({ detail: 'Meter not found.' });
  }
  return res.json(meter);
});

app.post('/api/meters/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { facility_id, meter_number, meter_type, unit, installation_date, capacity, status } = req.body;
  if (!facility_id || !meter_number || !meter_type) {
    return res.status(400).json({ error: 'Facility, meter number, and meter type are required.' });
  }

  const newMeter = db.createMeter({
    facility_id,
    meter_number,
    meter_type,
    unit: unit || 'kWh',
    installation_date: installation_date || new Date().toISOString().split('T')[0],
    capacity: Number(capacity) || 500,
    status: status || 'Active',
  });

  return res.status(201).json(newMeter);
});

app.put('/api/meters/:id/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateMeter(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ detail: 'Meter not found.' });
  }
  return res.json(updated);
});

app.delete('/api/meters/:id/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteMeter(req.params.id);
  if (!success) {
    return res.status(404).json({ detail: 'Meter not found.' });
  }
  return res.status(204).send();
});

// -------------------------------------------------------------
// 5. ENERGY READINGS & ANALYTICS
// -------------------------------------------------------------
app.get('/api/energy/readings/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const readings = db.getReadings({
    facility_id: req.query.facility_id as string,
    meter_id: req.query.meter_id as string,
    start_date: req.query.start_date as string,
    end_date: req.query.end_date as string,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
  });
  return res.json(readings);
});

app.post('/api/energy/readings/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { meter_id, reading_date, meter_reading, allow_reset } = req.body;
  if (!meter_id || !reading_date || meter_reading === undefined) {
    return res.status(400).json({ error: 'Meter ID, reading date, and meter reading value are required.' });
  }

  try {
    const result = db.addReading({
      meter_id,
      reading_date,
      meter_reading: Number(meter_reading),
      allow_reset: Boolean(allow_reset),
    });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ detail: err.message });
  }
});

// Daily consumption aggregated across meters
app.get('/api/energy/daily/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const readings = db.getReadings({
    facility_id: facilityId && facilityId !== 'all' ? facilityId : undefined,
    start_date: cutoff,
  });

  const dailyMap: Record<string, { date: string; consumption: number; peak: number; off_peak: number; cost: number }> = {};
  const tariff = db.getActiveTariff();

  readings.forEach(r => {
    if (!dailyMap[r.reading_date]) {
      dailyMap[r.reading_date] = {
        date: r.reading_date,
        consumption: 0,
        peak: 0,
        off_peak: 0,
        cost: 0,
      };
    }
    dailyMap[r.reading_date].consumption += r.consumption;
    dailyMap[r.reading_date].peak += r.peak_consumption;
    dailyMap[r.reading_date].off_peak += r.off_peak_consumption;
  });

  // Calculate cost
  Object.values(dailyMap).forEach(d => {
    d.cost = Math.round(d.consumption * tariff.rate_per_kwh);
  });

  const sortedList = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  return res.json(sortedList);
});

// Monthly consumption aggregated
app.get('/api/energy/monthly/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const readings = db.getReadings({
    facility_id: facilityId && facilityId !== 'all' ? facilityId : undefined,
  });

  const monthlyMap: Record<string, { month: string; consumption: number; cost: number }> = {};
  const tariff = db.getActiveTariff();

  readings.forEach(r => {
    const month = r.reading_date.substring(0, 7);
    if (!monthlyMap[month]) {
      monthlyMap[month] = { month, consumption: 0, cost: 0 };
    }
    monthlyMap[month].consumption += r.consumption;
  });

  Object.values(monthlyMap).forEach(m => {
    m.cost = Math.round(m.consumption * tariff.rate_per_kwh);
  });

  const sortedList = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  return res.json(sortedList);
});

// -------------------------------------------------------------
// 6. BILLING & TARIFFS
// -------------------------------------------------------------
app.get('/api/tariffs/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getTariffs());
});

app.put('/api/tariffs/:id/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateTariff(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ detail: 'Tariff not found.' });
  }
  return res.json(updated);
});

app.get('/api/billing/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const month = req.query.month as string;
  const status = req.query.status as string;

  const bills = db.getBills(facilityId, month, status);
  return res.json(bills);
});

app.get('/api/billing/:id/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const bill = db.getBills().find(b => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ detail: 'Bill not found.' });
  }
  return res.json(bill);
});

app.post('/api/billing/generate/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { facility_id, billing_month } = req.body;
  if (!facility_id || !billing_month) {
    return res.status(400).json({ error: 'facility_id and billing_month (YYYY-MM) are required.' });
  }

  try {
    const bill = db.generateBill(facility_id, billing_month);
    return res.status(201).json(bill);
  } catch (err: any) {
    return res.status(400).json({ detail: err.message });
  }
});

app.put('/api/billing/:id/status/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { payment_status } = req.body;
  if (!['Pending', 'Paid', 'Overdue'].includes(payment_status)) {
    return res.status(400).json({ error: 'payment_status must be Pending, Paid, or Overdue.' });
  }

  const updated = db.updateBillStatus(req.params.id, payment_status);
  if (!updated) {
    return res.status(404).json({ detail: 'Bill not found.' });
  }
  return res.json(updated);
});

// -------------------------------------------------------------
// 7. RENEWABLE ENERGY
// -------------------------------------------------------------
app.get('/api/renewable/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const source = req.query.source_type as string;
  return res.json(db.getRenewable(facilityId, source));
});

app.post('/api/renewable/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { facility_id, source_type, generation_date, energy_generated, capacity } = req.body;
  if (!facility_id || !source_type || !generation_date || energy_generated === undefined) {
    return res.status(400).json({ error: 'facility_id, source_type, generation_date, and energy_generated are required.' });
  }

  const created = db.addRenewable({
    facility_id,
    source_type,
    generation_date,
    energy_generated: Number(energy_generated),
    capacity: Number(capacity) || 100,
  });

  return res.status(201).json(created);
});

app.get('/api/renewable/summary/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const renList = db.getRenewable(facilityId);
  const totalGen = renList.reduce((sum, r) => sum + r.energy_generated, 0);

  const bySource: Record<string, number> = { Solar: 0, Wind: 0, 'Other Renewable': 0 };
  renList.forEach(r => {
    bySource[r.source_type] = (bySource[r.source_type] || 0) + r.energy_generated;
  });

  const totalGrid = db.getReadings({ facility_id: facilityId }).reduce((sum, r) => sum + r.consumption, 0);
  const totalCombined = totalGrid + totalGen;
  const renewablePct = totalCombined > 0 ? Math.round((totalGen / totalCombined) * 1000) / 10 : 0;

  return res.json({
    total_generated: totalGen,
    grid_consumed: totalGrid,
    renewable_percentage: renewablePct,
    by_source: bySource,
  });
});

// -------------------------------------------------------------
// 8. ALERTS & RECOMMENDATIONS
// -------------------------------------------------------------
app.get('/api/alerts/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const severity = req.query.severity as string;
  const status = req.query.status as string;

  return res.json(db.getAlerts(facilityId, severity, status));
});

app.put('/api/alerts/:id/read/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateAlertStatus(req.params.id, 'Read');
  if (!updated) {
    return res.status(404).json({ detail: 'Alert not found.' });
  }
  return res.json(updated);
});

app.put('/api/alerts/:id/resolve/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateAlertStatus(req.params.id, 'Resolved');
  if (!updated) {
    return res.status(404).json({ detail: 'Alert not found.' });
  }
  return res.json(updated);
});

app.get('/api/recommendations/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  return res.json(db.getRecommendations(facilityId));
});

// -------------------------------------------------------------
// 9. REPORTS & EXPORTS
// -------------------------------------------------------------
app.get('/api/reports/energy/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilityId = req.query.facility_id as string;
  const startDate = req.query.start_date as string;
  const endDate = req.query.end_date as string;

  const readings = db.getReadings({
    facility_id: facilityId && facilityId !== 'all' ? facilityId : undefined,
    start_date: startDate,
    end_date: endDate,
  });

  const total = readings.reduce((sum, r) => sum + r.consumption, 0);
  const avg = readings.length > 0 ? Math.round(total / readings.length) : 0;
  const peak = readings.reduce((max, r) => Math.max(max, r.consumption), 0);
  const tariff = db.getActiveTariff();
  const totalCost = Math.round(total * tariff.rate_per_kwh);

  const renewable = db.getRenewable(facilityId && facilityId !== 'all' ? facilityId : undefined);
  const totalRen = renewable.reduce((sum, r) => sum + r.energy_generated, 0);
  const renPct = (total + totalRen) > 0 ? Math.round((totalRen / (total + totalRen)) * 1000) / 10 : 0;

  return res.json({
    facility_id: facilityId || 'all',
    start_date: startDate || '2026-08-01',
    end_date: endDate || '2026-09-28',
    total_consumption: total,
    average_consumption: avg,
    peak_consumption: peak,
    total_cost: totalCost,
    renewable_generated: totalRen,
    renewable_percentage: renPct,
    readings_count: readings.length,
    alerts_count: db.getAlerts(facilityId && facilityId !== 'all' ? facilityId : undefined).length,
  });
});

app.get('/api/reports/facility-comparison/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const facilities = db.getFacilities();
  const comparison = facilities.map(f => {
    const readings = db.getReadings({ facility_id: f.id });
    const total = readings.reduce((sum, r) => sum + r.consumption, 0);
    const ren = db.getRenewable(f.id).reduce((sum, r) => sum + r.energy_generated, 0);
    const tariff = db.getActiveTariff();
    return {
      facility_id: f.id,
      facility_name: f.name,
      building_type: f.building_type,
      area: f.area,
      total_consumption: total,
      renewable_generated: ren,
      estimated_cost: Math.round(total * tariff.rate_per_kwh),
      energy_intensity_kwh_per_sqft: f.area > 0 ? Math.round((total / f.area) * 100) / 100 : 0,
    };
  });
  return res.json(comparison);
});

// CSV Import endpoint
app.post('/api/csv/import-readings/', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { csv_content } = req.body;
  if (!csv_content) {
    return res.status(400).json({ error: 'csv_content string is required.' });
  }

  try {
    const summary = db.importReadingsFromCsv(csv_content);
    return res.json(summary);
  } catch (err: any) {
    return res.status(400).json({ detail: err.message });
  }
});

// CSV Export endpoint
app.get('/api/reports/export-csv/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const type = req.query.type as string; // 'readings' | 'facilities' | 'bills' | 'renewable'
  const facilityId = req.query.facility_id as string;

  let csvRows: string[] = [];
  let filename = 'greengrid-export.csv';

  if (type === 'facilities') {
    filename = 'facilities-inventory.csv';
    csvRows.push('id,name,location,building_type,area_sqft,status,meters_count,created_at');
    db.getFacilities().forEach(f => {
      csvRows.push(`"${f.id}","${f.name}","${f.location}","${f.building_type}",${f.area},"${f.status}",${f.meter_count || 0},"${f.created_at}"`);
    });
  } else if (type === 'bills') {
    filename = 'billing-records.csv';
    csvRows.push('id,facility,billing_month,units_kwh,rate,energy_charge,fixed_charge,tax,total_amount,payment_status');
    db.getBills(facilityId).forEach(b => {
      csvRows.push(`"${b.id}","${b.facility_name}","${b.billing_month}",${b.units_consumed},${b.rate_per_kwh},${b.energy_charge},${b.fixed_charge},${b.tax},${b.total_amount},"${b.payment_status}"`);
    });
  } else if (type === 'renewable') {
    filename = 'renewable-generation.csv';
    csvRows.push('id,facility,source_type,generation_date,energy_kwh,capacity_kw');
    db.getRenewable(facilityId).forEach(rn => {
      csvRows.push(`"${rn.id}","${rn.facility_name}","${rn.source_type}","${rn.generation_date}",${rn.energy_generated},${rn.capacity}`);
    });
  } else {
    // Default to readings
    filename = 'meter-readings.csv';
    csvRows.push('meter_id,meter_number,facility,date,meter_reading,consumption_kwh,peak_kwh,off_peak_kwh');
    db.getReadings({ facility_id: facilityId }).forEach(r => {
      csvRows.push(`"${r.meter_id}","${r.meter_number}","${r.facility_name}","${r.reading_date}",${r.meter_reading},${r.consumption},${r.peak_consumption},${r.off_peak_consumption}`);
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csvRows.join('\n'));
});

// -------------------------------------------------------------
// 10. USER MANAGEMENT (Admin only)
// -------------------------------------------------------------
app.get('/api/users/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getUsers());
});

app.post('/api/users/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { username, email, first_name, last_name, role, assigned_facility_id } = req.body;
  if (!username || !email || !role) {
    return res.status(400).json({ error: 'Username, email, and role are required.' });
  }

  const existing = db.getUserByUsernameOrEmail(username) || db.getUserByUsernameOrEmail(email);
  if (existing) {
    return res.status(400).json({ detail: 'User already exists.' });
  }

  const created = db.createUser({
    username,
    email,
    first_name: first_name || '',
    last_name: last_name || '',
    role,
    assigned_facility_id: assigned_facility_id || null,
    is_active: true,
  });

  return res.status(201).json(created);
});

app.put('/api/users/:id/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ detail: 'User not found.' });
  }
  return res.json(updated);
});

app.delete('/api/users/:id/', authenticateToken, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  // Prevent deleting self
  if (req.user?.id === req.params.id) {
    return res.status(400).json({ detail: 'You cannot delete your own account.' });
  }
  const success = db.deleteUser(req.params.id);
  if (!success) {
    return res.status(404).json({ detail: 'User not found.' });
  }
  return res.status(204).send();
});

// -------------------------------------------------------------
// 11. VITE INTEGRATION & STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GREENGrid Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
