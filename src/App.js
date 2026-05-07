import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MRIPage from './pages/MRIPage';
import CTPage from './pages/CTPage';
import XRayPage from './pages/XRayPage';
import UltrasoundPage from './pages/UltrasoundPage';
import FoundersPage from './pages/FoundersPage';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import PatientAppointments from './pages/patient/PatientAppointments';
import BookAppointment from './pages/patient/BookAppointment';
import PatientBilling from './pages/patient/PatientBilling';
import PatientRecords from './pages/patient/PatientRecords';

// Staff
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffAppointments from './pages/staff/StaffAppointments';
import ImagingOrders from './pages/staff/ImagingOrders';
import RadiologyReport from './pages/staff/RadiologyReport';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStaff from './pages/admin/AdminStaff';
import AdminPatients from './pages/admin/AdminPatients';
import AdminBilling from './pages/admin/AdminBilling';
import AdminReports from './pages/admin/AdminReports';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: '#fff', padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/mri" element={<MRIPage />} />
      <Route path="/ct" element={<CTPage />} />
      <Route path="/x-ray" element={<XRayPage />} />
      <Route path="/ultrasound" element={<UltrasoundPage />} />
      <Route path="/founders" element={<FoundersPage />} />

      {/* Patient */}
      <Route path="/patient/dashboard" element={<PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>} />
      <Route path="/patient/profile" element={<PrivateRoute roles={['patient']}><PatientProfile /></PrivateRoute>} />
      <Route path="/patient/appointments" element={<PrivateRoute roles={['patient']}><PatientAppointments /></PrivateRoute>} />
      <Route path="/patient/book" element={<PrivateRoute roles={['patient']}><BookAppointment /></PrivateRoute>} />
      <Route path="/patient/billing" element={<PrivateRoute roles={['patient']}><PatientBilling /></PrivateRoute>} />
      <Route path="/patient/records" element={<PrivateRoute roles={['patient']}><PatientRecords /></PrivateRoute>} />

      {/* Staff */}
      <Route path="/staff/dashboard" element={<PrivateRoute roles={['radiologist','technician','receptionist']}><StaffDashboard /></PrivateRoute>} />
      <Route path="/staff/appointments" element={<PrivateRoute roles={['radiologist','technician','receptionist']}><StaffAppointments /></PrivateRoute>} />
      <Route path="/staff/imaging-orders" element={<PrivateRoute roles={['radiologist','technician','receptionist']}><ImagingOrders /></PrivateRoute>} />
      <Route path="/staff/report/:orderId" element={<PrivateRoute roles={['radiologist']}><RadiologyReport /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/staff" element={<PrivateRoute roles={['admin']}><AdminStaff /></PrivateRoute>} />
      <Route path="/admin/patients" element={<PrivateRoute roles={['admin']}><AdminPatients /></PrivateRoute>} />
      <Route path="/admin/billing" element={<PrivateRoute roles={['admin']}><AdminBilling /></PrivateRoute>} />
      <Route path="/admin/reports" element={<PrivateRoute roles={['admin']}><AdminReports /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
