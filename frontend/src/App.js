import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TourPage from './pages/TourPage';
import MusicPage from './pages/MusicPage';
import SubscribePage from './pages/SubscribePage';
import BookingStatus from './pages/BookingStatus';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './pages/admin/AdminLayout';
import EventManagement from './pages/admin/EventManagement';
import BookingManagement from './pages/admin/BookingManagement';
import PaymentSettings from './pages/admin/PaymentSettings';
import ManifestManager from './components/ManifestManager';
import TrackingScripts from './components/TrackingScripts';
import { PwaInstallProvider } from './context/PwaInstallContext';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <PwaInstallProvider>
        <ManifestManager />
        <TrackingScripts />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tour" element={<TourPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/booking-status" element={<BookingStatus />} />
          <Route path="/admin-secret" element={<AdminLogin />} />
          <Route path="/admin-secret/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin-secret/events" element={<AdminLayout><EventManagement /></AdminLayout>} />
          <Route path="/admin-secret/bookings" element={<AdminLayout><BookingManagement /></AdminLayout>} />
          <Route path="/admin-secret/payment-settings" element={<AdminLayout><PaymentSettings /></AdminLayout>} />
        </Routes>
      </PwaInstallProvider>
    </BrowserRouter>
  );
}

export default App;
