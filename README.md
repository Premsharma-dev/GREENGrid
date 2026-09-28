# GREENGrid — Smart Energy Management System (EMIS)

**GREENGrid** is an enterprise-grade Energy Management Information System (EMIS) designed for institutions and organizations—such as universities, colleges, corporate tech parks, hospitals, manufacturing plants, and logistics hubs—to monitor, analyze, and optimize electrical energy consumption and solar/wind renewable generation across multiple facilities.

---

## 1. System Architecture & Overview

GREENGrid follows a clean decoupled client-server architecture with automated energy calculation pipelines and rule-based anomaly detection:

```
+-------------------------------------------------------------+
|                      React 19 SPA                           |
|  Tailwind CSS v4 • Recharts Analytics • Responsive Sidebar  |
+------------------------------+------------------------------+
                               | REST APIs (Bearer JWT)
                               v
+-------------------------------------------------------------+
|               Full-Stack API Engine & Services              |
|   • Express (Port 3000 Dev/Prod) with Vite SPA mount        |
|   • Complete Django REST Framework Backend in `/backend`    |
|   • Differential Energy Computation Engine (Current - Prev)  |
|   • Automated HT-2A Tariff & Fixed Demand Billing Engine     |
|   • Anomaly Trigger Engine (>120% Rolling Average Alert)    |
|   • Rule-Based Conservation Recommendation System           |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 Relational Database Storage                 |
|   • MySQL 8.0 (Dockerized production ready in /backend)     |
|   • Embedded ACID File Storage (`data/db.json`) for Sandbox  |
+-------------------------------------------------------------+
```

---

## 2. Key Features

1. **Multi-Facility Hierarchy**:
   - Manage multiple buildings, campuses, square footages, building types (College, Office, Hospital, Factory, Warehouse).
2. **Submeter Hardware Registry**:
   - Track Electricity, Solar PV, Wind Turbine, and Generator meters with capacity ratings and operational statuses.
3. **Automated Differential Energy Calculation**:
   - System automatically calculates incremental consumption: `Current Reading - Previous Reading = Consumption (kWh)`.
   - Built-in prevention of negative consumption (unless authorized meter reset/rollover is flagged).
   - Diurnal breakdown: 65% Peak load, 35% Off-peak baseline.
4. **Interactive Dashboard & Recharts**:
   - **8 KPI Cards**: Total Consumption, Today's Load, Estimated Current Bill, Renewable Yield, Renewable %, Active Facilities, Active Meters, Pending Alerts.
   - **Chart 1**: Consumption Trend with 7-Day, 30-Day, 90-Day selector.
   - **Chart 2**: Facility Comparative Benchmark (kWh by facility).
   - **Chart 3**: Energy Source Mix (Donut: Grid vs. Solar vs. Wind).
   - **Chart 4 & 5**: 12-Month Electrical Load & Expenditure Trends.
5. **Dynamic Utility Billing & Tariffs**:
   - Configurable tariff parameters: Per-unit rate (`₹7.85/kWh`), fixed monthly demand fee (`₹3,500`), and statutory taxes (`12%`).
   - Formula: `Energy Charge = Units × Rate`, `Tax = (Energy Charge + Fixed Charge) × Tax %`, `Total = Energy Charge + Fixed Charge + Tax`.
   - Duplicate bill prevention for identical facility and billing month.
   - Itemized printable invoice modal with payment status workflow (Pending, Paid, Overdue).
6. **Renewable Energy Tracking**:
   - Track solar arrays and micro wind turbines.
   - Formula: `Renewable % = (Renewable Energy / Total Energy) × 100`.
7. **Automated Anomaly Detection & Alert Engine**:
   - **HIGH_CONSUMPTION**: Triggers when current load exceeds 7-day average by `>20%`.
   - **UNUSUAL_NIGHT_USAGE**: Flags off-hours baseline deviations.
   - **RENEWABLE_DROP**: Detects solar array yield reductions.
   - **HIGH_MONTHLY_COST**: Flags budget run-rate overages.
   - **METER_ANOMALY**: Telemetry latency or rollover alerts.
8. **Rule-Based Efficiency Recommendations Engine**:
   - Evaluates telemetry data and issues prioritized action items (e.g., night chiller setbacks, variable speed drive scheduling, solar array surface wash).
9. **Batch CSV Import & Export**:
   - Upload CSV files formatted as `meter_id,date,reading`.
   - Chronological sorting, duplicate checks, error reporting with row-by-row diagnostics.
   - Raw CSV data exports for readings, facilities, bills, and renewable generation.
10. **Certified PDF Audit Reports**:
    - Downloadable PDF executive summary reports formatted with key statistics, energy intensity (kWh/sq.ft), and recommended conservation actions.
11. **Role-Based Access Control (RBAC)**:
    - **ADMIN**: Full access to facilities, meters, user administration, tariffs, billing, and system settings.
    - **FACILITY MANAGER**: Access to assigned facilities, logging meter readings, viewing bills, renewable generation, alerts, and reports.
    - **VIEWER**: Read-only access to dashboards, facility telemetry, and reports.

---

## 3. Demo Credentials

| Role | Username | Email | Password | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@greengrid.org` | `admin123` | Full System &amp; Tariffs |
| **Facility Manager** | `manager` | `manager@greengrid.org` | `manager123` | Assigned Facilities &amp; Readings |
| **Viewer** | `viewer` | `viewer@greengrid.org` | `viewer123` | Read-Only Dashboards |

*(Quick-login buttons are also provided directly on the Login screen).*

---

## 4. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons, jsPDF, Axios.
- **Backend (Node.js/Express)**: Express 4, jsonwebtoken, CORS, tsx.
- **Backend (Django REST Framework in `/backend`)**: Python 3.10+, Django 4.2+, djangorestframework, djangorestframework-simplejwt, django-cors-headers, mysqlclient.
- **Database**: MySQL 8.0 (configured via `docker-compose.yml`) / ACID JSON embedded engine for instant development.

---

## 5. Quick Start Instructions

### Running the Live Full-Stack App (Port 3000)
```bash
# Install dependencies
npm install

# Start the full-stack server (serves React Vite frontend + REST API on port 3000)
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

### Running the Django + MySQL Backend (Optional / Standalone)

A complete Django backend with models, serializers, views, seed scripts, and tests is located in the `/backend` directory:

```bash
cd backend

# Option A: Run with Docker Compose (MySQL 8.0 + Django REST)
docker-compose up --build

# Option B: Run locally with Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations and seed sample data
python manage.py migrate
python manage.py seed_data

# Run backend test suite
python manage.py test

# Start Django development server
python manage.py runserver 0.0.0.0:8000
```

---

## 6. API Reference (DRF & Express Unified Endpoints)

### Authentication
- `POST /api/auth/login/`: Obtain JWT access and refresh tokens.
- `POST /api/auth/register/`: Create new user account.
- `POST /api/auth/refresh/`: Refresh expired access token.
- `GET /api/auth/me/`: Retrieve authenticated user profile.

### Facilities & Meters
- `GET /api/facilities/`: List facilities (supports search, location, status filters).
- `POST /api/facilities/`: Create facility (Admin).
- `GET /api/facilities/:id/`: Retrieve facility details with calculated aggregates.
- `PUT /api/facilities/:id/`: Update facility (Admin).
- `DELETE /api/facilities/:id/`: Delete facility (Admin, cascading).
- `GET /api/meters/`: List meters (filtered by facility or meter type).
- `POST /api/meters/`: Register submeter hardware.

### Energy & Telemetry
- `GET /api/energy/summary/`: Dashboard KPIs (total kWh, today kWh, bill, renewable %).
- `GET /api/energy/readings/`: Historical meter readings.
- `POST /api/energy/readings/`: Record reading; automatically calculates incremental consumption.
- `GET /api/energy/daily/`: Daily aggregated consumption with peak/off-peak and costs.
- `GET /api/energy/monthly/`: 12-month aggregated consumption.
- `POST /api/csv/import-readings/`: Batch ingestion of CSV readings.

### Billing & Tariffs
- `GET /api/billing/`: List bills.
- `POST /api/billing/generate/`: Generate monthly facility bill using active tariff.
- `PUT /api/billing/:id/status/`: Update payment status (`Pending`, `Paid`, `Overdue`).
- `GET /api/tariffs/`: Retrieve active tariff parameters.
- `PUT /api/tariffs/:id/`: Update unit rate, fixed fee, or tax percentage (Admin).

### Renewable & Alerts
- `GET /api/renewable/`: List solar and wind generation records.
- `POST /api/renewable/`: Record generation.
- `GET /api/renewable/summary/`: Total clean energy yield and grid independence %.
- `GET /api/alerts/`: Query active and historical anomaly alerts.
- `PUT /api/alerts/:id/read/`: Acknowledge alert.
- `PUT /api/alerts/:id/resolve/`: Mark alert resolved.
- `GET /api/recommendations/`: Algorithmic energy-saving recommendations.

---

## 7. Future IoT & Smart Meter Readiness

GREENGrid is architected for smart meter hardware integration without breaking API changes:
- In-field smart meters (Modbus TCP, RS-485 to LoRaWAN gateway, or Cellular IoT) can post JSON telemetry directly to `/api/energy/readings/` using device API keys.
- Real-time stream processing can be added via MQTT or RabbitMQ message brokers without modifying frontend visualizers.
