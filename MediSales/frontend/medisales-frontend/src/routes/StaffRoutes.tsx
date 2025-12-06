import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import POSTransactionPage from '../pages/staff/POSTransactionPage';
import ProductCatalogPage from '../pages/staff/ProductCatalogPage';
import DailySalesReportPage from '../pages/staff/DailySalesReportPage';
import StockAlertsPage from '../pages/staff/StockAlertsPage';
import ExpiryMonitorPage from '../pages/staff/ExpiryMonitorPage';
import ChatPage from '../pages/staff/ChatPage';
import InventoryViewPage from '../pages/staff/InventoryViewPage';
import ProfilePage from '../pages/staff/ProfilePage';

const StaffRoutes = () => (
  <DashboardLayout>
    <Routes>
      <Route path="pos" element={<POSTransactionPage />} />
      <Route path="products" element={<ProductCatalogPage />} />
      <Route path="daily-sales" element={<DailySalesReportPage />} />
      <Route path="stock-alerts" element={<StockAlertsPage />} />
      <Route path="expiry-monitor" element={<ExpiryMonitorPage />} />
      <Route path="inventory-view" element={<InventoryViewPage />} />
      <Route path="messages" element={<ChatPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route index element={<Navigate to="pos" replace />} />
      <Route path="*" element={<Navigate to="pos" replace />} />
    </Routes>
  </DashboardLayout>
);

export default StaffRoutes;
