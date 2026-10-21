import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AddServices from './AddServices';
import CategoryManagement from './CategoryManagement';
import CloudComHero from './CloudComHero';
import ForgotPassword from './ForgotPassword';
import Login from './Login';
import NotFound from './NotFound';
import ResetPassword from './ResetPassword';
import View from './View';

function RequireAuth({ children }) {
  return sessionStorage.getItem('adminToken')
    ? children
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CloudComHero />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/view" element={<RequireAuth><View /></RequireAuth>} />
        <Route path="/products-services" element={<RequireAuth><View /></RequireAuth>} />
        <Route path="/add-services" element={<AddServices />} />
        <Route path="/categories" element={<RequireAuth><CategoryManagement /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
