import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import VendorLoginPage from './pages/vendor/LoginPage';
import VendorRegisterPage from './pages/vendor/RegisterPage';
import VendorDashboardPage from './pages/vendor/DashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer routes */}
        <Route path="/v/:unique_qr_id" element={<MenuPage />} />
        <Route path="/v/:unique_qr_id/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:orderId" element={<OrderTrackingPage />} />

        {/* Vendor routes */}
        <Route path="/vendor/login" element={<VendorLoginPage />} />
        <Route path="/vendor/register" element={<VendorRegisterPage />} />
        <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/vendor/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
