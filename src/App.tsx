import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ToastContainer } from './components/ui/Toast';


// A helper component to scroll to top on every route navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Pages
import LandingPage from './pages/LandingPage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import SalesPage from './pages/dashboard/SalesPage';
import FinancePage from './pages/dashboard/FinancePage';
import PropertyMgmtPage from './pages/dashboard/PropertyMgmtPage';
import ServiceProvidersPage from './pages/dashboard/ServiceProvidersPage';
import CommunicationsPage from './pages/dashboard/CommunicationsPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import AuditPage from './pages/dashboard/AuditPage';
import PropertiesAdminPage from './pages/dashboard/PropertiesAdminPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import ClientPortal from './pages/ClientPortal';
import LandlordPortal from './pages/LandlordPortal';
import ContactPage from './pages/ContactPage';


function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

import { useDataStore } from './stores/dataStore';

export default function App() {
  const loadFromServer = useDataStore((s) => s.loadFromServer);

  React.useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />


        {/* Dashboard (protected) */}
        <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route index element={<DashboardHome />} />
          <Route path="properties" element={<PropertiesAdminPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="property-mgmt" element={<PropertyMgmtPage />} />
          <Route path="service-providers" element={<ServiceProvidersPage />} />
          <Route path="communications" element={<CommunicationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Portals */}
        <Route path="/client" element={<RequireAuth><ClientPortal /></RequireAuth>} />
        <Route path="/landlord" element={<RequireAuth><LandlordPortal /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
