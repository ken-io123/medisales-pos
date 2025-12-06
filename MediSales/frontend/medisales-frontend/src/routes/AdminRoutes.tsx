import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ProductManagement from '../pages/admin/ProductManagement';
import StockAlerts from '../pages/admin/StockAlerts';
import SalesReportsPage from '../pages/admin/SalesReportsPage';
import SalesAnalysisPage from '../pages/admin/SalesAnalysisPage';
import InventoryMovementPage from '../pages/admin/InventoryMovementPage';
import ExpirationMonitoring from '../pages/admin/ExpirationMonitoring';
import TransactionHistoryPage from '../pages/admin/TransactionHistoryPage';
import StaffManagement from '../pages/admin/StaffManagement';
import MessengerPage from '../pages/admin/MessengerPage';

const AdminRoutes = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<AdminDashboard />} />
  <Route path="products" element={<ProductManagement />} />
  <Route path="stock-alerts" element={<StockAlerts />} />
      <Route path="sales-reports" element={<SalesReportsPage />} />
      <Route path="sales-analysis" element={<SalesAnalysisPage />} />
      <Route path="inventory-movements" element={<InventoryMovementPage />} />
  <Route path="expiration-monitoring" element={<ExpirationMonitoring />} />
      <Route path="transactions" element={<TransactionHistoryPage />} />
      <Route path="staff" element={<StaffManagement />} />
      <Route path="messages" element={<MessengerPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  </DashboardLayout>
);

export default AdminRoutes;
