<div align="center">
  <img src="Final%20Logo.png" alt="NovaRad Logo" width="250"/>
  <h1>NovaRad</h1>
  <p><strong>A comprehensive digital health platform for streamlined radiology department operations.</strong></p>
  
  ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
  ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
</div>

<br />

## Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technologies Used](#-technologies-used)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Running the Application](#running-the-application)
- [API Reference](#-api-reference)
- [Security Features](#-security-features)
- [Troubleshooting](#-troubleshooting)
- [Team Members](#-team-members)

---

## Overview

NovaRad is a comprehensive digital health platform designed to streamline radiology department operations. It features patient registration, appointment scheduling, and access to diagnostic imaging services including MRI, CT scans, Ultrasound, and Digital X-rays. The application provides tailored, role-based dashboards for patients, staff, and administrators to ensure seamless workflows and data management.

---

## Key Features

### User Authentication & Authorization
- Patient registration and secure login
- Role-based access (Patient, Staff, Admin)
- Session management with robust authentication context

### Diagnostic Services
- MRI scheduling and detailed procedure information
- CT scan services
- Ultrasound examinations
- Digital X-ray imaging
- Dedicated service-specific information pages

### Multi-Role Dashboards
- **Patient**: Manage appointments, billing, medical records, and profile details.
- **Staff**: Track imaging orders, process radiology reports, and manage daily appointments.
- **Admin**: Oversee staff and patient administration, monitor billing, and generate system reports.

### Data Management
- Secure, encrypted patient data storage
- Comprehensive medical history tracking
- Appointment histories and billing records

### User Experience
- Fully responsive design optimized for desktop and mobile devices
- Intuitive navigation with a clean sidebar and topbar layout
- Reusable, sleek UI components (cards, tables, modals, buttons)
- Interactive chatbot support for immediate assistance

---

## Technologies Used

### Frontend
- **React** - Component-based UI library
- **JavaScript (ES6+)** - Core application logic
- **CSS3** - Styling and layout
- **Axios** - Promise-based HTTP client for API calls
- **Boxicons** - Premium vector icon library

### Backend
- **Python 3.x** - Server-side programming language
- **Flask** - Lightweight, extensible web framework
- **PostgreSQL** - Advanced open-source relational database
- **psycopg2** - PostgreSQL database adapter for Python

---

## Project Structure

```text
NovaRad/
├── app.py                          # Main Flask application & API routes
├── requirements.txt                # Python dependencies
├── package.json                    # Node.js dependencies
├── README.md                       # Project documentation
│
├── src/                            # React frontend source
│   ├── App.js                      # Main React component
│   ├── index.js                    # React DOM entry point
│   ├── index.css                   # Global application styles
│   ├── api/                        # Axios configuration & API helpers
│   ├── context/                    # AuthContext for global state
│   ├── components/                 # Reusable UI layouts & components
│   └── pages/                      # Route components (Patient, Staff, Admin)
│
├── public/                         # Public HTML templates & assets
├── static/                         # Static assets (compiled CSS, utility JS)
└── build/                          # Optimized production build output
```

---

## Database Schema

### Patient Data Model
Stores critical patient information securely:
- **Personal Details**: Name, Date of Birth, Contact Information
- **Medical History**: Previous diagnoses, medical conditions
- **Account Data**: Email, password hash, registration timestamp

> _Note: Additional normalized tables exist for appointments, billing, staff directories, and radiology reports._

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) and npm
- **Python** (v3.7 or higher)
- **PostgreSQL** (v12 or higher)
- **pip** (Python package installer)

### Installation & Setup

**1. Clone the Repository**
```bash
git clone <repository-url>
cd NovaRad
```

**2. Backend Setup (Flask + PostgreSQL)**

Create and activate a Python Virtual Environment:
```bash
# Create virtual environment
python -m venv venv

# Activate on Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Activate on Mac/Linux
source venv/bin/activate
```

Install Dependencies and Initialize Database:
```bash
pip install -r requirements.txt

# Database setup
flask db init      # Initialize migration folder (first time only)
flask db migrate   # Create migration scripts
flask db upgrade   # Apply migration to PostgreSQL
```

**3. Frontend Setup (React)**
```bash
npm install
```

### Running the Application

**Development Mode (Recommended)**
Run both backend and frontend simultaneously:
```bash
npm run dev
```
This command uses `concurrently` to start:
- **Flask Backend** on Port `5000`
- **React Frontend** on Port `3000` (automatically proxies API calls to Port `5000`)

**Separate Terminals**
If preferred, you can run them in distinct terminal windows:
```bash
# Terminal 1: Flask Backend (ensure venv is activated)
python app.py

# Terminal 2: React Frontend
npm start
```

**Production Build**
```bash
npm run build
# The build folder is generated and can be served statically by Flask or a web server like Nginx.
```

---

## API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/register` | `POST` | Patient account creation |
| `/api/auth/login` | `POST` | Authenticate and create session |
| `/api/patient/<id>` | `GET` | Retrieve specific patient profile |
| `/api/appointments` | `GET` | List all available appointments |
| `/api/appointments` | `POST` | Schedule a new appointment |
| `/api/billing` | `GET` | Retrieve user billing information |

---

## Security Features

- **Password Hashing**: Secure storage utilizing cryptographic salts.
- **Input Validation**: Strict checks applied on both frontend interfaces and backend endpoints.
- **SQL Injection Prevention**: Implementation of parameterized database queries.
- **CORS Protection**: Controlled Cross-Origin Resource Sharing configuration.
- **Secure Sessions**: Authentication tokens to guard protected routes and endpoints.

---

## Troubleshooting

| Issue | Potential Solution |
| :--- | :--- |
| **PostgreSQL Connection Error** | Verify `DATABASE_URL` in `.env` and confirm PostgreSQL service is running. |
| **ModuleNotFoundError (Python)** | Ensure the virtual environment is activated before running `pip install -r requirements.txt`. |
| **npm Dependency Issues** | Delete `node_modules` folder and `package-lock.json`, then re-run `npm install`. |
| **Port Already in Use** | Modify the Flask port (`app.run(port=5001)`) or the React port in `.env`. |
| **CORS Errors** | Check Flask CORS configuration to ensure it explicitly permits the React dev server origins. |

---

## Team Members

| Name | Role |
| :--- | :--- |
| Caroline El-baiady | Backend Developer |
| Mohamed Abdelrazik | Backend Developer |
| Khadija Elfeky | Frontend Developer |
| Reem Khaled | Frontend Developer |
| Omar Walid | Frontend Developer |
