import { Routes, Route, Navigate } from 'react-router-dom';
import SalesLogin from './pages/Sales/SalesLogin';
import AdminLogin from './pages/Admin/AdminLogin';
import SalesDashboard from './pages/Sales/SalesDashboard';
import SalesContracts from './pages/Sales/SalesContracts';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PaymentsHub from './pages/Admin/PaymentsHub';
import SalesQRCode from './pages/Sales/SalesQRCode';
import NewContractForm from './pages/Sales/NewContractForm';
import SalesRenewalForm from './pages/Sales/SalesRenewalForm';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminAgents from './pages/Admin/AdminAgents';
import AdminContractsExport from './pages/Admin/AdminContractsExport';
import AdminContractDetail from './pages/Admin/AdminContractDetail';
import AdminDiscountCodes from './pages/Admin/AdminDiscountCodes';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './hooks/useAuth';

function PrivateRoute({ role, children }) {
  const { user } = useAuth();

  if (!user || user.role.name !== role) {
    return <Navigate to={`/${role}/login`} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-vital-black text-white antialiased">
        <Routes>
          <Route path="/sales/login" element={<SalesLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/sales/dashboard"
            element={<PrivateRoute role="sales_agent"><SalesDashboard /></PrivateRoute>}
          />
          <Route
            path="/sales/contracts"
            element={<PrivateRoute role="sales_agent"><SalesContracts /></PrivateRoute>}
          />
          <Route
            path="/sales/contracts/new"
            element={<PrivateRoute role="sales_agent"><NewContractForm /></PrivateRoute>}
          />
          <Route
            path="/sales/contracts/renewal"
            element={<PrivateRoute role="sales_agent"><SalesRenewalForm /></PrivateRoute>}
          />
          <Route
            path="/sales/contracts/:contractId/qr"
            element={<PrivateRoute role="sales_agent"><SalesQRCode /></PrivateRoute>}
          />
          <Route
            path="/sales/profile"
            element={<PrivateRoute role="sales_agent"><ProfilePage /></PrivateRoute>}
          />
          <Route
            path="/admin/profile"
            element={<PrivateRoute role="admin"><ProfilePage /></PrivateRoute>}
          />
          <Route element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/payments" element={<PaymentsHub />} />
            <Route path="/admin/contracts" element={<AdminContractsExport />} />
            <Route path="/admin/contracts/:contractId" element={<AdminContractDetail />} />
            <Route path="/admin/agents" element={<AdminAgents />} />
            <Route path="/admin/discount-codes" element={<AdminDiscountCodes />} />
          </Route>
          <Route path="*" element={<Navigate to="/sales/login" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
