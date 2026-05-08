## Overview

NovaRad is a comprehensive digital health platform designed to streamline radiology department operations. It features patient registration, appointment scheduling, and access to diagnostic imaging services including MRI, CT scans, Ultrasound, and Digital X-rays. The application provides role-based dashboards for patients, staff, and administrators.

**Stack**: React (Frontend) + Flask (Backend) + PostgreSQL (Database)

---

## Key Features

### User Authentication & Authorization

- Patient registration and secure login
- Role-based access (Patient, Staff, Admin)
- Session management with authentication context

### Diagnostic Services

- MRI scheduling and information
- CT scan services
- Ultrasound examinations
- Digital X-ray imaging
- Service-specific information pages

### Multi-Role Dashboards

- **Patient**: Appointments, billing, medical records, profile management
- **Staff**: Imaging orders, radiology reports, appointment management
- **Admin**: Staff management, patient administration, billing oversight, report generation

### Data Management

- Secure patient data storage
- Medical history tracking
- Appointment and billing records

### User Experience

- Responsive design across all devices
- Intuitive navigation with sidebar + topbar layout
- Reusable UI components (cards, tables, modals, buttons)
- Interactive chatbot support

### Security

- Password hashing and encryption
- Form input validation
- Parameterized database queries (SQL injection prevention)
- Secure session handling
- CORS protection

---

## Technologies Used

### Frontend

- **React** - UI library
- **JavaScript (ES6+)** - Application logic
- **CSS3** - Styling
- **Axios** - HTTP client for API calls
- **Boxicons** - Icon library

### Backend

- **Python 3.x** - Server language
- **Flask** - Web framework
- **PostgreSQL** - Relational database
- **psycopg2** - PostgreSQL adapter

---

## Project Structure

```
NovaRad/
├── app.py                          # Main Flask application & API routes
├── requirements.txt                # Python dependencies
├── package.json                    # Node.js dependencies
├── README.md
│
├── src/                            # React frontend source
│   ├── App.js                      # Main React component
│   ├── index.js                    # Entry point
│   ├── index.css                   # Global styles
│   ├── api/
│   │   └── client.js               # Axios API client configuration
│   ├── context/
│   │   └── AuthContext.js          # Global authentication state management
│   ├── components/
│   │   ├── DashboardLayout.js      # Sidebar + topbar layout
│   │   └── UI.js                   # Reusable UI components
│   └── pages/
│       ├── HomePage.js             # Landing page
│       ├── LoginPage.js
│       ├── RegisterPage.js
│       ├── ModalityPages.js        # MRI, CT, X-Ray, Ultrasound, Founders
│       ├── patient/                # Patient-specific pages
│       │   ├── PatientDashboard.js
│       │   ├── PatientProfile.js
│       │   ├── PatientAppointments.js
│       │   ├── PatientBilling.js
│       │   └── PatientRecords.js
│       ├── staff/                  # Staff-specific pages
│       │   ├── StaffDashboard.js
│       │   ├── ImagingOrders.js
│       │   └── RadiologyReport.js
│       └── admin/                  # Admin-specific pages
│           ├── AdminDashboard.js
│           ├── AdminStaff.js
│           ├── AdminPatients.js
│           └── AdminBilling.js
│
├── public/
│   └── index.html                  # HTML template
│
├── static/                         # Static assets
│   ├── CSS files for different pages
│   └── JavaScript utilities
│
└── build/                          # Production build output (generated)
```

---

## Database Schema

### Patient Table

Stores patient information:

- **Personal Details**: Name, Date of Birth, Contact Information
- **Medical History**: Previous diagnoses, medical conditions
- **Account**: Email, password hash, registration date

_Additional tables for appointments, billing, staff, and reports exist in the database._

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher) and npm
- **Python** (v3.7 or higher)
- **PostgreSQL** (v12 or higher)
- **pip** (Python package manager)

---

## Installation & Setup

### 1. Clone & Navigate to Project

```bash
git clone <repository-url>
cd NovaRad
```

### 2. Backend Setup (Flask + PostgreSQL)

#### Create Python Virtual Environment

```bash
python -m venv venv
```

#### Activate Virtual Environment

- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Mac/Linux**:
  ```bash
  source venv/bin/activate
  ```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/novarad
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-secret-key-here
```

#### Initialize Database

```bash
flask db init      # Initialize migration folder (first time only)
flask db migrate   # Create migration
flask db upgrade   # Apply migration
```

### 3. Frontend Setup (React)

#### Install Node Dependencies

```bash
npm install
```

---

## Running the Application

### Development Mode

Run both backend and frontend simultaneously with one command:

```bash
npm run dev
```

This uses `concurrently` to start:
- **Flask Backend** on Port 5000
- **React Frontend** on Port 3000

The React app will automatically proxy API calls to Flask on port 5000.

### Alternative: Separate Terminals

If you prefer to run them in separate terminals:

#### Terminal 1 - Flask Backend (Port 5000)

```bash
# Make sure venv is activated
python app.py
```

#### Terminal 2 - React Frontend (Port 3000)

```bash
npm start
```

### Production Build

```bash
npm run build          # Create optimized production build
# Copy build folder to Flask static directory for serving
```

---

## Key API Endpoints

- `POST /api/auth/register` - Patient registration
- `POST /api/auth/login` - Patient login
- `GET /api/patient/<id>` - Get patient profile
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Schedule appointment
- `GET /api/billing` - Get billing information

---

## Usage Guide

1. **New User**: Click "Sign Up" to create a patient account
2. **Login**: Use credentials to log in
3. **Browse Services**: Explore MRI, CT, X-Ray, and Ultrasound services
4. **Schedule Appointment**: Select service and preferred date/time
5. **View Dashboard**: Access personalized dashboard based on your role

---

## Security Features

- Password hashing with salt
- Form input validation (frontend & backend)
- Secure session management
- SQL injection prevention via parameterized queries
- CORS configuration for API protection
- Authentication tokens/sessions for protected routes

---

## Troubleshooting

| Issue                                | Solution                                                              |
| ------------------------------------ | --------------------------------------------------------------------- |
| **PostgreSQL connection error**      | Verify DATABASE_URL in `.env` and ensure PostgreSQL is running        |
| **Module not found errors (Python)** | Run `pip install -r requirements.txt` in activated venv               |
| **npm dependencies issues**          | Delete `node_modules` and `package-lock.json`, then run `npm install` |
| **Port already in use**              | Change port in Flask (`app.run(port=5001)`) or React (`.env` file)    |
| **CORS errors**                      | Verify Flask CORS configuration allows requests from React dev server |

---

## Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Axios Documentation](https://axios-http.com/)

---

## Team Members

| Name               | Role      |
| ------------------ | --------- |
| Caroline El-baiady | Developer |
| Khadija Elfeky     | Developer |
| Mohamed Abdelrazik | Developer |
| Reem Khaled        | Developer |
| Omar Walid         | Developer |

